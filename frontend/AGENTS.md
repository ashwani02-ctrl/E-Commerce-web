# AGENTS.md

Guidance for AI coding agents working in this repository. Read it fully before changing code.

## Project

**Bazaar** is a multi-seller e-commerce marketplace with three roles:

- **buyer**: browses products, keeps a cart, checks out, views order history and status, cancels pending orders.
- **seller**: sets up one store, adds/edits/removes their own products, views received orders, moves orders `pending -> shipped -> delivered`.
- **admin**: manages platform products (products with no store), views users. Created by script only, never through public registration.

Monorepo layout:

```
backend/    Express + TypeScript API
frontend/   Next.js (App Router) web app
```

## Stack

| Area | Tech |
|---|---|
| Backend | Node 22, Express 5, TypeScript, `tsx` for dev |
| Database | PostgreSQL on Supabase, Drizzle ORM (`postgres-js` driver) |
| Cache / cart | Redis via `ioredis` (Docker locally, hosted Redis in production) |
| Validation | Zod 4 |
| Auth | bcrypt (cost 12) + JWT (7 days, role inside the token) |
| Security | helmet, cors (single origin), express-rate-limit |
| Email | nodemailer (SMTP) for password reset |
| Frontend | Next.js 16 App Router, React, TypeScript, Tailwind CSS, shadcn/ui |

## Commands

Backend (run in `backend/`):

```
npm run dev                  # tsx watch src/server.ts, port 5000
npm run seed                 # loads src/db/products.json as platform products (store_id NULL)
npm run create-admin         # creates or promotes the admin from ADMIN_EMAIL / ADMIN_PASSWORD
npx drizzle-kit push         # applies src/db/schema.ts to the database
npx tsc --noEmit             # type check
docker compose up --build    # backend + Redis in containers
```

Frontend (run in `frontend/`):

```
npm run dev                  # port 3000
npm run build
npm run lint
npx tsc --noEmit
```

Local Redis: `docker run -d --name redis -p 6379:6379 redis` (later `docker start redis`).

## Environment variables

Never commit `.env`. Every variable below must exist in `backend/.env` unless noted.

```
PORT=5000
CLIENT_URL=http://localhost:3000        # the only origin CORS allows
DATABASE_URL=                           # Supabase Session pooler connection string
JWT_SECRET=
REDIS_URL=redis://localhost:6379
SMTP_HOST= SMTP_PORT= SMTP_USER= SMTP_PASS= MAIL_FROM=
ADMIN_EMAIL= ADMIN_PASSWORD=            # used only by create-admin
```

`frontend/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:5000`

Any file that reads `process.env` at import time (for example `db/index.ts`) must start with `import "dotenv/config"`, because imports run before the body of `server.ts`.

## Backend structure

```
backend/src/
  server.ts            app setup, middleware order, route mounting
  redis.ts             shared ioredis client
  db/                  index.ts (connection), schema.ts, seed.ts, createAdmin.ts, products.json
  middleware/          auth.ts (requireAuth, requireRole), validate.ts
  routes/              auth, products, stores, seller, buyer, admin
  schemas/             Zod schemas: auth, product, order, cart
  utils/               mail.ts, price.ts (finalPrice)
```

Route mounting (order matters: `cors` and `express.json()` come before routes):

```
/auth      authLimiter (50 per 15 min per IP) + a stricter limiter on login
/products  public
/stores    public
/seller    requireAuth, requireRole("seller")
/buyer     requireAuth, requireRole("buyer")
/admin     requireAuth, requireRole("admin")
```

### API reference

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `/auth/login`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password`; `PUT /auth/change-password` |
| Public | `GET /health`, `/products` (search, category, sort, page, limit), `/products/categories`, `/products/:id`, `/stores/:slug`, `/stores/:slug/products` |
| Seller | `GET/POST/PUT /seller/store`; `GET/POST /seller/products`; `PUT/DELETE /seller/products/:id`; `GET /seller/orders`; `PATCH /seller/orders/:id/status` |
| Buyer | `GET /buyer/cart`, `DELETE /buyer/cart`, `POST /buyer/cart/items`, `PATCH/DELETE /buyer/cart/items/:productId`, `POST /buyer/checkout`, `GET /buyer/orders`, `GET /buyer/orders/:id`, `POST /buyer/orders/:id/cancel` |
| Admin | `GET/POST /admin/products`, `PUT/DELETE /admin/products/:id`, `GET /admin/users` |

## Database

Tables (Drizzle, `serial` integer ids, so every foreign key is `integer`):

- `users`: name, email (unique, stored lowercase), password_hash, role (`buyer|seller|admin`), created_at
- `password_resets`: user_id, token_hash (SHA-256), expires_at (15 minutes)
- `revoked_tokens`: jti (primary key), expires_at. Written by logout, checked by `requireAuth`
- `stores`: seller_id (unique, one store per seller), name, slug (unique), description, created_at
- `products`: store_id (**nullable**: NULL means sold by the platform), title, description, price, stock, category, brand, rating, discount_percent, images (jsonb), tags (jsonb), image_url, is_active, created_at, updated_at
- `orders`: buyer_id, store_id (nullable for platform orders), status (`pending|shipped|delivered|cancelled`), total, shipping_address, created_at, updated_at
- `order_items`: order_id, product_id, title_snapshot, price_snapshot, quantity

Cart is not a table: Redis hash `cart:{buyerId}` mapping productId to quantity, 30 day TTL.

## Backend conventions (follow these)

**Identity and permissions**
- The user id and role always come from the JWT (`req.user`), never from the request body or URL.
- Role middleware is not enough. Every query on seller or buyer data must also filter by ownership in the `WHERE` clause (`store_id = <the seller's store>`, `buyer_id = <req.user.id>`).
- For someone else's record return `404`, not `403`.
- Public registration accepts only `buyer` or `seller`. Admin is created with `npm run create-admin`.

**Validation and errors**
- Validate with Zod through `validate(schema, "body" | "query" | "params")` before the handler. Express 5 makes `req.query` read-only, so validated query/params are read from `res.locals.query` / `res.locals.params`.
- Never pass an unvalidated `req.body` to `.values()` or `.set()`.
- Error shape is always `{ "error": "message", "details"?: [{ "field", "message" }] }`.
- Status codes: 400 invalid input, 401 not logged in, 403 wrong role, 404 not found, 409 conflict or invalid state change, 429 rate limited, 500 server error.
- Wrap database work in `try/catch`, log `err.cause ?? err`, and answer with a generic 500. Never leave a request hanging.
- Duplicate unique values: catch Postgres code `23505` and return 409.

**Data rules**
- Money is stored as integers in paise (`49900` means 499.00). Never use floats. The discounted price comes from `finalPrice()` in `utils/price.ts`.
- Never trust a price, total or stock value from the client. Read them from the database.
- Products are soft-deleted with `is_active = false`, never removed, because `order_items` references them.
- `order_items` stores snapshots of title and price at purchase time.
- Lists are paginated, with `limit` capped at 50 and a stable tie-breaker (`id`) in `ORDER BY`.
- Platform products are found with `isNull(products.storeId)`. Use a left join to `stores` or they disappear from listings.

**Orders**
- Checkout creates one order per seller (platform items form their own order) inside a single transaction: lock product rows `FOR UPDATE`, verify stock, insert orders and items, decrement stock. Only after commit is the Redis cart cleared. A short Redis lock prevents double checkout.
- Status changes are conditional updates (`WHERE status = <expected previous status>`) so concurrent requests cannot overwrite each other. Sellers can only move forward (`pending -> shipped -> delivered`). Only buyers can cancel, and only while `pending`, which restores stock in the same transaction.

**Auth details**
- Passwords: 8 to 72 characters with a lowercase letter, an uppercase letter and a number (login only checks that one was sent).
- Login returns `{ token, user }`. Tokens carry `{ id, role }` and a `jti`. Logout stores the `jti` in `revoked_tokens`.
- Forgot password always returns the same message, whether or not the email exists. Reset tokens are random, stored only as a SHA-256 hash, single use, and valid 15 minutes.

**TypeScript and style**
- ESM. Local imports use a `.js` extension even though the files are `.ts` (`import x from "./routes/auth.js"`).
- `verbatimModuleSyntax` is on: type-only imports must use `import type`.
- Strict indexing: a query's first row is `T | undefined`. Check it before use.
- Prefer small route files with named handlers; keep business rules out of validation schemas.

## Frontend structure

```
frontend/src/
  proxy.ts                  Next 16 proxy (replaces middleware.ts): redirects by role cookie
  app/
    (auth)/                 login, register, forgot-password (URLs have no "(auth)")
    layout.tsx              wraps the app in <AuthProvider>
    ... planned: products, stores/[slug], (buyer) cart/checkout/orders/account, seller/*, admin/*
  components/
    ui/                     shadcn components
    comp/logincard.tsx      left brand panel shared by all auth pages
  lib/
    api.ts                  the only fetch helper; token storage; ApiError
    format.ts               formatPrice, rupeesToCents, formatDate, status labels
    validation.ts           password rules and form validators mirroring the backend
    session.ts              role cookie, homePathForRole, getSafeNext
  providers/
    AuthProvider.tsx        user, login, register, logout
    RoleGuard.tsx           wraps seller/admin/buyer layouts
  types/api.ts              types for every API response and request body
```

## Frontend conventions

- All backend calls go through `api` from `@/lib/api`. Do not call `fetch` directly in components. Use `api.get<Type>(...)` with types from `@/types/api`.
- Public pages (home, product list and detail, store profile) are server components calling `api` with `{ auth: false, cache: "no-store" }`. Logged-in pages are client components (`"use client"`), because the token lives in `localStorage`.
- Show money with `formatPrice(cents)`. In seller forms the price is typed in rupees and converted with `rupeesToCents` (`validateProductForm` does this).
- Show server field errors with `err.fieldErrors` on `ApiError`; show other errors with `errorMessage(err)`.
- The token is in `localStorage` key `bazaar_token`; the user in `bazaar_user`; `proxy.ts` reads the `bazaar_role` cookie. That cookie holds only the role, can be edited by anyone, and exists only to redirect early. **Real authorization is always the backend checking the token.**
- Use `next/link` for internal links, `import type` for types, and the `@/` alias for `src/`.
- Auth pages share the `LoginCard` panel and the same card layout and Tailwind classes (`brand-navy`, `brand-blue`, `brand-orange`). Match them for new auth pages.
- Make interactive elements at least 44px tall, label every input, and keep error text associated with its input (`aria-describedby`, `role="alert"`).

## Status

Done:
- Backend: all routes in the API reference above, seed and admin scripts, Docker setup.
- Frontend: `lib`, `providers`, `types`, `proxy.ts`, login, register, forgot-password pages.

Not built yet:
- Frontend: reset-password page (the reset email links to `/reset-password?token=...`), public product and store pages, cart, checkout, order history, seller dashboard, admin panel.
- Backend: `GET /admin/orders` (platform orders currently have nobody to ship them), payment gateway (orders are created as `pending` without payment), order emails, tests, `GET /seller/products/:id`.

## Things to verify before relying on them

- Column names in `db/schema.ts`: the code assumes `products.price` is the paise column in the Drizzle `select` calls, while the API and frontend types expose it as `priceCents`. Check that the column and every route agree, and rename the column to `priceCents` if they do not. The same applies to `orders.total` (exposed in JSON as `totalCents`).
- Seeded prices come from DummyJSON and are in US dollars, so they display as small rupee amounts.

## Do not

- Do not commit `.env`, `node_modules`, or secrets, and do not log tokens, passwords or reset links in production code.
- Do not accept `sellerId`, `buyerId`, `storeId`, `role`, `isActive`, `rating` or prices from a request body.
- Do not change a response shape without updating `frontend/src/types/api.ts`.
- Do not hard-delete products or users that have orders.
- Do not use `onConflictDoNothing()` where silent failure would hide a problem (the first `create-admin` bug came from this).
- Do not add features outside the three roles above (reviews, wishlists, coupons) unless asked.

## Current UI behavior for authenticated navigation

- After successful registration, the app redirects the user to `/login`.
- After login, the home page swaps the anonymous `Log in` and `Join now` actions for a role-aware authenticated account control.
- Buyer state shows a welcome message and a circular avatar + cart button, with a dropdown menu containing:
  - `My Profile`
  - `My Orders`
  - `Wishlist`
  - `Saved Addresses`
  - `Account Settings`
  - `Logout`
- Seller state shows a `Seller Dashboard` control and a circular avatar, with a dropdown menu containing:
  - `My Store`
  - `Seller Dashboard`
  - `Manage Products`
  - `Manage Orders`
  - `Store Settings`
  - `Logout`
- The dropdown is a client-side menu tied to the authenticated user role from the session state, not a backend role check.

## Before finishing a change

1. `npx tsc --noEmit` passes in the package you edited.
2. New or changed routes were exercised in Postman with the right role token, a wrong-role token (expect 403), and no token (expect 401).
3. Ownership checks hold: another seller's or buyer's ids return 404.
4. New request bodies have a Zod schema, and new response shapes have a type in `types/api.ts`.