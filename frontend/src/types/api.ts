export type Role = "buyer" | "seller" | "admin";
export type OrderStatus = "pending" | "shipped" | "delivered" | "cancelled";
export type ProductSort = "newest" | "oldest" | "price_asc" | "price_desc" | "rating";

export interface ApiErrorDetail {
    field: string;
    message: string;
}

export interface ApiErrorBody{
    error: string;
    details?: unknown;
}

export interface MessageResponse {
    message: string;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface SellerRef {
    name: string;
    slug: string;
}

/* ---------- auth ---------- */

export interface User {
    id: number;
    name: string;
    email: string;
    role: Role;
}

export interface LoginResponse {
    token: string;
    user: User;
}

export interface RegisterInput {
    name: string;
    email: string;
    password: string;
    role: "buyer" | "seller";
}

/* ---------- products ---------- */

export interface ProductSummary {
  id: number;
  title: string;
  priceCents: number;
  finalPriceCents: number;
  discountPercent: number | null;
  rating: number | null;
  category: string | null;
  brand: string | null;
  imageUrl: string | null;
  stock: number;
  storeName: string | null;
  storeSlug: string | null;
}

export interface ProductListResponse extends Pagination {
  products: ProductSummary[];
}
 
/** Card in GET /stores/:slug/products (the store is returned once, at the top) */
export type StoreProductSummary = Omit<ProductSummary, "storeName" | "storeSlug">;
 
export interface StoreProductsResponse extends Pagination {
  store: SellerRef;
  products: StoreProductSummary[];
}
 
/** A full product row (seller and admin lists) */
export interface Product {
  id: number;
  storeId: number | null;
  title: string;
  description: string | null;
  priceCents: number;
  stock: number;
  category: string | null;
  brand: string | null;
  rating: number | null;
  discountPercent: number | null;
  images: string[] | null;
  tags: string[] | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}
 
/** GET /products/:id */
export interface ProductDetail extends Product {
  finalPriceCents: number;
  seller: SellerRef | null;
}
 
/** Body for POST /seller/products and POST /admin/products (PUT sends any subset) */
export interface ProductInput {
  title: string;
  description?: string;
  priceCents: number;
  stock: number;
  category?: string;
  brand?: string;
  discountPercent?: number;
  imageUrl?: string;
  images?: string[];
  tags?: string[];
}
 
export interface ProductListParams {
  search?: string;
  category?: string;
  sort?: ProductSort;
  page?: number;
  limit?: number;
}
 
export interface SellerProductsResponse extends Pagination {
  products: Product[];
}
 
/** GET /admin/products has no total yet */
export interface AdminProductsResponse {
  page: number;
  products: Product[];
}
 
/* ---------- stores ---------- */
 
/** GET /stores/:slug (public) */
export interface StoreProfile {
  name: string;
  slug: string;
  description: string | null;
  createdAt: string | null;
  productCount: number;
}
 
/** GET /seller/store (the seller's own store) */
export interface SellerStore {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string | null;
}
 
export interface StoreInput {
  name: string;
  description?: string;
}
 
/* ---------- cart ---------- */
 
export interface CartItem {
  productId: number;
  quantity: number;
  /** false when the product was removed or the stock dropped below the quantity */
  available: boolean;
  title: string | null;
  imageUrl: string | null;
  stock: number;
  unitPriceCents: number;
  lineTotalCents: number;
  seller: SellerRef | null;
}
 
export interface Cart {
  items: CartItem[];
  itemCount: number;
  subtotalCents: number;
}
 
/* ---------- orders ---------- */
 
export interface OrderListParams {
  status?: OrderStatus;
  page?: number;
  limit?: number;
}
 
/** Order line as the buyer sees it */
export interface OrderItem {
  productId: number;
  title: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
}
 
export interface BuyerOrder {
  id: number;
  status: OrderStatus;
  totalCents: number;
  shippingAddress: string;
  createdAt: string | null;
  seller: SellerRef | null;
  items: OrderItem[];
}
 
export interface BuyerOrderDetail extends BuyerOrder {
  updatedAt: string | null;
}
 
export interface BuyerOrdersResponse extends Pagination {
  orders: BuyerOrder[];
}
 
export interface CheckoutInput {
  shippingAddress: string;
}
 
/** One order is created per seller, so checkout can return several */
export interface CheckoutResponse {
  orders: { orderId: number; totalCents: number }[];
  grandTotalCents: number;
}
 
/** In the `details` of a 409 from POST /buyer/checkout */
export interface CheckoutProblem {
  productId: number;
  title: string | null;
  problem: string;
}
 
/** Order line as the seller sees it (raw row from the database) */
export interface SellerOrderItem {
  id: number;
  orderId: number;
  productId: number;
  titleSnapshot: string;
  priceCentsSnapshot: number;
  quantity: number;
}
 
export interface SellerOrder {
  id: number;
  status: OrderStatus;
  totalCents: number;
  shippingAddress: string;
  createdAt: string | null;
  buyerName: string;
  items: SellerOrderItem[];
}
 
export interface SellerOrdersResponse extends Pagination {
  orders: SellerOrder[];
}
 
export interface UpdateOrderStatusResponse {
  id: number;
  status: OrderStatus;
  updatedAt: string | null;
}
 
/* ---------- admin ---------- */
 
export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  createdAt: string | null;
}