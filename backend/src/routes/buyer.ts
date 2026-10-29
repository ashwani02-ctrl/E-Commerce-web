import { Router } from "express";
import { redis } from "../redis.js";
import { db } from "../db/index.js";
import { orderItems, orders, products, stores } from "../db/schema.js";
import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { finalPrice } from "../utils/price.js";
import type z from "zod";
import { addCartItemSchema, buyerOrdersQuery, checkoutSchema, MAX_PER_ITEM, productIdParams, updateCartItemSchema } from "../schemas/cart.schema.js";
import { validate } from "../middleware/validate.js";
import { idParams } from "../schemas/seller.schema.js";

const router = Router();

const CART_TTL = 60 * 60 * 24 * 30; // 30 days, in seconds
const cartKey = (buyerId: number) => `cart:${buyerId}`;

type ItemRow = typeof orderItems.$inferSelect;

const formatItem = (i: ItemRow) => ({
    productsId: i.productId,
    title: i.titleSnapshot,
    unitPrice: i.priceSnapshot,
    quantity: i.quantity,
    lineTotal: i.priceSnapshot * i.quantity,
})

class CheckoutError extends Error {
    status: number;
    details?: unknown;
    constructor(status: number, message: string, details?: unknown) {
        super(message);
        this.status = status;
        this.details = details;

    }
}

// GET /buyer/cart

router.get("/cart", async (req, res) => {
    const buyerId = (req as any).user.id as number;

    try {
        const raw = await redis.hgetall(cartKey(buyerId));

        const entries = Object.entries(raw)
            .map(([id, qty]) => ({
                productId: Number(id),
                quantity: Number(qty)
            }))
            .sort((a, b) => a.productId - b.productId);

        if (entries.length === 0) {
            return res.json({
                items: [],
                itemCount: 0,
                subtotal: 0
            });
        }

        const rows = await db
            .select({
                id: products.id,
                title: products.title,
                price: products.price,
                discountPercent: products.discountPercent,
                imageUrl: products.imageUrl,
                stock: products.stock,
                isActive: products.isActive,
                storeName: stores.name,
                storeSlug: stores.slug
            })
            .from(products)
            .leftJoin(stores, eq(products.storeId, stores.id))
            .where(inArray(products.id, entries.map((e) => e.productId)));

        const byId = new Map(rows.map((p) => [p.id, p]));

        const items = entries.map(({ productId, quantity }) => {
            const p = byId.get(productId);

            if (!p || !p.isActive) {
                return {
                    productId,
                    quantity,
                    available: false,
                    title: null,
                    imageUrl: null,
                    stock: 0,
                    unitPrice: 0,
                    lineTotal: 0,
                    seller: null
                };
            }

            const unit = finalPrice(p.price, p.discountPercent);

            return {
                productId,
                quantity,
                available: p.stock >= quantity,
                title: p.title,
                imageUrl: p.imageUrl,
                stock: p.stock,
                unitPrice: unit,
                lineTotal: unit * quantity,
                seller: p.storeSlug ? { name: p.storeName, slug: p.storeSlug } : null,

            };

        });

        const ok = items.filter((i) => i.available);

        return res.json({
            items,
            itemCount: ok.reduce((sum, i) => sum + i.quantity, 0),
            subtotal: ok.reduce((sum, i) => sum + i.lineTotal, 0),
        });

    } catch (err: any) {
        console.error("Get cart failed:", err.cause ?? err);
        return res.status(500).json({ error: "Something went wrong" });

    }
});


// POST /buyer/cart/items

router.post("/cart/items", validate(addCartItemSchema), async (req, res) => {
    const buyerId = (req as any).user.id as number;
    const { productId, quantity } = req.body as z.infer<typeof addCartItemSchema>;

    try {
        const [product] = await db
            .select({ id: products.id, stock: products.stock })
            .from(products)
            .where(and(eq(products.id, productId), eq(products.isActive, true)));

        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        const key = cartKey(buyerId);
        const current = Number((await redis.hget(key, String(productId))) ?? 0);
        const newQty = current + quantity;

        if (newQty > MAX_PER_ITEM) {
            return res.status(400).json({ error: `You can add at most ${MAX_PER_ITEM} of one item` });

        }

        if (newQty > product.stock) {
            return res.status(409).json({ error: `Only ${product.stock} in stock` });
        }

        await redis.multi().hset(key, String(productId), newQty).expire(key, CART_TTL).exec();

        return res.status(201).json({ productId, quantity: newQty });

    } catch (err: any) {
        console.error("Add to cart failed:", err.cause ?? err);
        return res.status(500).json({ error: "Something went wrong" });
    }
});

// PATCH /buyer/cart/items/:productId

router.patch(
    "/cart/items/:productId",
    validate(productIdParams, "params"),
    validate(updateCartItemSchema),
    async (req, res) => {
        const buyerId = (req as any).user.id as number;
        const { productId } = res.locals.params as z.infer<typeof productIdParams>;
        const { quantity } = req.body as z.infer<typeof updateCartItemSchema>;

        try {
            const key = cartKey(buyerId);

            if (!(await redis.hexists(key, String(productId)))) {
                return res.status(404).json({ error: "Item is not in your cart " });

            }

            const [product] = await db
                .select({ stock: products.stock })
                .from(products)
                .where(and(eq(products.id, productId), eq(products.isActive, true)));



            if (!product) {
                return res.status(404).json({ error: "Product not found" });
            }
            if (quantity > product.stock) {
                return res.status(409).json({ error: `Only ${product.stock} in stock` });
            }

            await redis.multi().hset(key, String(productId), quantity).expire(key, CART_TTL).exec();

            return res.json({ productId, quantity });


        } catch (err: any) {
            console.error("Update cart item failed:", err.cause ?? err);
            return res.status(500).json({ error: "Something went wrong" });

        }
    }
);

// DELETE /buyer/cart/items/:productId

router.delete("/cart/items/:productId",
    validate(productIdParams, "params"), async (req, res) => {
        const buyerId = (req as any).user.id as number;
        const { productId } = res.locals.params as z.infer<typeof productIdParams>;

        try {
            const removed = await redis.hdel(cartKey(buyerId), String(productId));

            if (removed === 0) {
                return res.status(404).json({ error: "Item is not in your cart" });
            }
            return res.json({ message: "Item removed" });

        } catch (err: any) {
            console.error("Remove cart item failed:", err.cause ?? err);
            return res.status(500).json({ error: "Something went wrong" });

        }
    });





// POST /buyer/checkout   body: { shippingAddress }
router.post("/checkout", validate(checkoutSchema), async (req, res) => {
  const buyerId = (req as any).user.id as number;
  const { shippingAddress } = req.body as z.infer<typeof checkoutSchema>;

  // stops a double click or two tabs from checking out the same cart twice
  const lockKey = `lock:checkout:${buyerId}`;
  const gotLock = await redis.set(lockKey, "1", "EX", 30, "NX");
  if (!gotLock) {
    return res.status(409).json({ error: "Checkout already in progress" });
  }

  try {
    const raw = await redis.hgetall(cartKey(buyerId));
    const entries = Object.entries(raw).map(([id, qty]) => ({
      productId: Number(id),
      quantity: Number(qty),
    }));

    if (entries.length === 0) {
      return res.status(400).json({ error: "Your cart is empty" });
    }

    const created = await db.transaction(async (tx) => {
      // lock these product rows until we finish, so nobody else can buy the same stock
      const rows = await tx
        .select({
          id: products.id,
          storeId: products.storeId,
          title: products.title,
          price: products.price,
          discountPercent: products.discountPercent,
          stock: products.stock,
          isActive: products.isActive,
        })
        .from(products)
        .where(inArray(products.id, entries.map((e) => e.productId)))
        .orderBy(asc(products.id))
        .for("update");

      const byId = new Map(rows.map((p) => [p.id, p]));

      // check every item, and report all the problems at once
      const problems: { productId: number; title: string | null; problem: string }[] = [];
      for (const e of entries) {
        const p = byId.get(e.productId);
        if (!p || !p.isActive) {
          problems.push({ productId: e.productId, title: p?.title ?? null, problem: "No longer available" });
        } else if (p.stock < e.quantity) {
          problems.push({ productId: e.productId, title: p.title, problem: `Only ${p.stock} left` });
        }
      }
      if (problems.length > 0) {
        throw new CheckoutError(409, "Some items in your cart can't be bought", problems);
      }

      // one order per seller (platform products have no store and form their own order)
      const groups = new Map<
        number | null,
        { productId: number; title: string; unitCents: number; quantity: number }[]
      >();

      for (const e of entries) {
        const p = byId.get(e.productId)!; // checked above
        const list = groups.get(p.storeId) ?? [];
        list.push({
          productId: p.id,
          title: p.title,
          unitCents: finalPrice(p.price, p.discountPercent),
          quantity: e.quantity,
        });
        groups.set(p.storeId, list);
      }

      const result: { orderId: number; totalCents: number }[] = [];

      for (const [storeId, lines] of groups) {
        const total = lines.reduce((sum, l) => sum + l.unitCents * l.quantity, 0);

        const [order] = await tx
          .insert(orders)
          .values({ buyerId, storeId, total, shippingAddress })
          .returning({ id: orders.id });

        if (!order) throw new Error("Order insert failed");

        await tx.insert(orderItems).values(
          lines.map((l) => ({
            orderId: order.id,
            productId: l.productId,
            titleSnapshot: l.title.slice(0, 150),
            priceSnapshot: l.unitCents,
            quantity: l.quantity,
          }))
        );

        for (const l of lines) {
          await tx
            .update(products)
            .set({ stock: sql`${products.stock} - ${l.quantity}` })
            .where(eq(products.id, l.productId));
        }

        result.push({ orderId: order.id, totalCents: total });
      }

      return result;
    });

    // only after the transaction committed
    await redis.del(cartKey(buyerId));

    return res.status(201).json({
      orders: created,
      grandTotalCents: created.reduce((sum, o) => sum + o.totalCents, 0),
    });
  } catch (err: any) {
    if (err instanceof CheckoutError) {
      return res.status(err.status).json({ error: err.message, details: err.details });
    }
    console.error("Checkout failed:", err.cause ?? err);
    return res.status(500).json({ error: "Something went wrong" });
  } finally {
    await redis.del(lockKey);
  }
});

// GET /buyer/orders?status=&page=&limit=
router.get("/orders", validate(buyerOrdersQuery, "query"), async (req, res) => {
  const buyerId = (req as any).user.id as number;
  const { status, page, limit } = res.locals.query as z.infer<typeof buyerOrdersQuery>;

  try {
    const where = status
      ? and(eq(orders.buyerId, buyerId), eq(orders.status, status))
      : eq(orders.buyerId, buyerId);

    const [rows, totalRows] = await Promise.all([
      db
        .select({
          id: orders.id,
          status: orders.status,
          totalCents: orders.total,
          shippingAddress: orders.shippingAddress,
          createdAt: orders.createdAt,
          storeName: stores.name,
          storeSlug: stores.slug,
        })
        .from(orders)
        .leftJoin(stores, eq(orders.storeId, stores.id))
        .where(where)
        .orderBy(desc(orders.id))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ total: count() }).from(orders).where(where),
    ]);

    const ids = rows.map((r) => r.id);
    const items = ids.length
      ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids))
      : [];

    const byOrder = new Map<number, ItemRow[]>();
    for (const item of items) {
      byOrder.set(item.orderId, [...(byOrder.get(item.orderId) ?? []), item]);
    }

    const total = totalRows[0]?.total ?? 0;

    return res.json({
      orders: rows.map((o) => ({
        id: o.id,
        status: o.status,
        totalCents: o.totalCents,
        shippingAddress: o.shippingAddress,
        createdAt: o.createdAt,
        seller: o.storeSlug ? { name: o.storeName, slug: o.storeSlug } : null,
        items: (byOrder.get(o.id) ?? []).map(formatItem),
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    console.error("List buyer orders failed:", err.cause ?? err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// GET /buyer/orders/:id
router.get("/orders/:id", validate(idParams, "params"), async (req, res) => {
  const buyerId = (req as any).user.id as number;
  const { id } = res.locals.params as z.infer<typeof idParams>;

  try {
    const [o] = await db
      .select({
        id: orders.id,
        status: orders.status,
        totalCents: orders.total,
        shippingAddress: orders.shippingAddress,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        storeName: stores.name,
        storeSlug: stores.slug,
      })
      .from(orders)
      .leftJoin(stores, eq(orders.storeId, stores.id))
      .where(and(eq(orders.id, id), eq(orders.buyerId, buyerId)));

    if (!o) {
      return res.status(404).json({ error: "Order not found" });
    }

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));

    return res.json({
      id: o.id,
      status: o.status,
      totalCents: o.totalCents,
      shippingAddress: o.shippingAddress,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      seller: o.storeSlug ? { name: o.storeName, slug: o.storeSlug } : null,
      items: items.map(formatItem),
    });
  } catch (err: any) {
    console.error("Get buyer order failed:", err.cause ?? err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// POST /buyer/orders/:id/cancel
router.post("/orders/:id/cancel", validate(idParams, "params"), async (req, res) => {
  const buyerId = (req as any).user.id as number;
  const { id } = res.locals.params as z.infer<typeof idParams>;

  try {
    const cancelled = await db.transaction(async (tx) => {
      // only works while the order is still pending
      const [order] = await tx
        .update(orders)
        .set({ status: "cancelled" })
        .where(and(eq(orders.id, id), eq(orders.buyerId, buyerId), eq(orders.status, "pending")))
        .returning({ id: orders.id });

      if (!order) return false;

      const items = await tx
        .select({ productId: orderItems.productId, quantity: orderItems.quantity })
        .from(orderItems)
        .where(eq(orderItems.orderId, id));

      // put the stock back
      for (const item of items) {
        await tx
          .update(products)
          .set({ stock: sql`${products.stock} + ${item.quantity}` })
          .where(eq(products.id, item.productId));
      }

      return true;
    });

    if (cancelled) {
      return res.json({ message: "Order cancelled" });
    }

    // nothing changed: find out why
    const [existing] = await db
      .select({ status: orders.status })
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.buyerId, buyerId)));

    if (!existing) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res
      .status(409)
      .json({ error: `Only pending orders can be cancelled (this one is ${existing.status})` });
  } catch (err: any) {
    console.error("Cancel order failed:", err.cause ?? err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});


export default router;