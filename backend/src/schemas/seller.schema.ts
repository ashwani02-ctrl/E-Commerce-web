import z from "zod";

export const storeSchema = z.object({
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().min(2).max(1000).optional(),
})

export const slugify = (text: string) => 
    text
.toLowerCase()
.normalize("NFKD")
.replace(/[^a-z0-9]+/g, "-")
.replace(/^-+|-+$/g, "")
.slice(0, 90) || "store";

export const updateStoreSchema = storeSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Send at least one field to update",
  });

export const createProductSchema = z.object({
  title: z.string().trim().min(2).max(150),
  description: z.string().trim().max(2000).optional(),
  priceCents: z.number().int().positive().max(100_000_000),
  stock: z.number().int().min(0).max(100_000),
  category: z.string().trim().max(50).optional(),
  brand: z.string().trim().max(100).optional(),
  discountPercent: z.number().min(0).max(90).optional(),
  imageUrl: z.url().max(500).optional(),
  images: z.array(z.url().max(500)).max(10).optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
});

export const updateProductSchema = createProductSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Send at least one field to update",
  });

export const idParams = z.object({
  id: z.coerce.number().int().min(1),
});

export const ORDER_STATUSES = ["pending", "shipped", "delivered", "cancelled"] as const;

export const sellerOrdersQuery = z.object({
  // ?status= arrives as "", so treat empty as "no filter"
  status: z.preprocess((v) => (v === "" ? undefined : v), z.enum(ORDER_STATUSES).optional()),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["shipped", "delivered"]),
});