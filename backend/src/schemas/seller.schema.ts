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