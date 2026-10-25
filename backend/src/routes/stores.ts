import { Router } from "express";
import { z } from "zod";
import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { products, stores } from "../db/schema.js";
import { validate } from "../middleware/validate.js";
import { listQuery } from "../schemas/product.schema.js";
import { finalPrice } from "../utils/price.js";

const router = Router();

const slugParams = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Invalid store slug"),
});

// GET /stores/:slug  (seller profile)
router.get("/:slug", validate(slugParams, "params"), async (_req, res) => {
  const { slug } = res.locals.params as z.infer<typeof slugParams>;

  try {
    const [store] = await db
      .select({
        id: stores.id,
        name: stores.name,
        slug: stores.slug,
        description: stores.description,
        createdAt: stores.createdAt,
      })
      .from(stores)
      .where(eq(stores.slug, slug));

    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }

    const [countRow] = await db
      .select({ total: count() })
      .from(products)
      .where(and(eq(products.storeId, store.id), eq(products.isActive, true)));

    return res.json({
      name: store.name,
      slug: store.slug,
      description: store.description,
      createdAt: store.createdAt,
      productCount: countRow?.total ?? 0,
    });
  } catch (err: any) {
    console.error("Get store failed:", err.cause ?? err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// GET /stores/:slug/products?search=&category=&sort=&page=&limit=
router.get(
  "/:slug/products",
  validate(slugParams, "params"),
  validate(listQuery, "query"),
  async (_req, res) => {
    const { slug } = res.locals.params as z.infer<typeof slugParams>;
    const { search, category, sort, page, limit } =
      res.locals.query as z.infer<typeof listQuery>;

    try {
      const [store] = await db
        .select({ id: stores.id, name: stores.name, slug: stores.slug })
        .from(stores)
        .where(eq(stores.slug, slug));

      if (!store) {
        return res.status(404).json({ error: "Store not found" });
      }

      const conditions = [eq(products.storeId, store.id), eq(products.isActive, true)];

      if (search) {
        const term = `%${search.replace(/[%_\\]/g, "\\$&")}%`;
        conditions.push(
          or(
            ilike(products.title, term),
            ilike(products.brand, term),
            ilike(products.description, term)
          )!
        );
      }

      if (category) {
        conditions.push(eq(products.category, category));
      }

      const where = and(...conditions);

      const orderBy = {
        newest: desc(products.id),
        price_asc: asc(products.price),
        price_desc: desc(products.price),
        rating: sql`${products.rating} DESC NULLS LAST`,
      }[sort];

      const [rows, totalRows] = await Promise.all([
        db
          .select({
            id: products.id,
            title: products.title,
            price: products.price,
            discountPercent: products.discountPercent,
            rating: products.rating,
            category: products.category,
            brand: products.brand,
            imageUrl: products.imageUrl,
            stock: products.stock,
          })
          .from(products)
          .where(where)
          .orderBy(orderBy, asc(products.id))
          .limit(limit)
          .offset((page - 1) * limit),
        db.select({ total: count() }).from(products).where(where),
      ]);

      const total = totalRows[0]?.total ?? 0;

      return res.json({
        store: { name: store.name, slug: store.slug },
        products: rows.map((p) => ({
          ...p,
          finalPrice: finalPrice(p.price, p.discountPercent),
        })),
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err: any) {
      console.error("Store products failed:", err.cause ?? err);
      return res.status(500).json({ error: "Something went wrong" });
    }
  }
);

export default router;