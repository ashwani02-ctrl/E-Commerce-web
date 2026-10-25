import z from "zod";

export const listQuery = z.object({
    search: z.string().trim().max(100).optional(),
    category: z.string().trim().max(50).optional(),
    sort: z.enum(["newest", "price_asc", "price_desc", "rating"]).default("newest"),
    page: z.coerce.number().int().min(1).max(50).default(20),
    limit: z.coerce.number().int().min(1).max(50).default(20),
})