import { Router } from "express";
import { db } from "../db/index.js";
import { products, stores } from "../db/schema.js";
import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { listQuery } from "../schemas/product.schema.js";
import { validate } from "../middleware/validate.js";
import type z from "zod";
import { finalPrice } from "../utils/price.js";

const router = Router();

/* GET /products/categories */
router.get("/categories", async (req, res) => {
    try {
        const rows = await db
            .selectDistinct({ category: products.category })
            .from(products)
            .where(eq(products.isActive, true))
            .orderBy(asc(products.category));

        return res.json(rows.map((r) => r.category).filter(Boolean));
    } catch (err: any) {
        console.error("categories failed:", err.cause ?? err);
        return res.status(500).json({ error: "Something went wrong" });

    }
});

/* GET /products?search=&category=&sort=&page=&limit= */
router.get("/", validate(listQuery, "query"), async (req, res) => {
    const { search, category, sort, page, limit } =
        res.locals.query as z.infer<typeof listQuery>;

    try {
        const conditions = [eq(products.isActive, true)];

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
            rating: sql`${products.rating} DESC NULLS LAST`
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
                    storeName: stores.name,
                    storeSlug: stores.slug,
                })
                .from(products)
                .leftJoin(stores, eq(products.storeId, stores.id))
                .where(where)
                .orderBy(orderBy, asc(products.id)) // id as tie-breaker keeps pages stable
                .limit(limit)
                .offset((page - 1) * limit),
            db.select({ total: count() }).from(products).where(where),

        ]);

        const total = totalRows[0]?.total ?? 0;

        return res.json({
            products: rows.map((p) => ({
                ...p,
                finalPrice: finalPrice(p.price, p.discountPercent),
            })),
            page,
            limit,
            total,
            totalPages: Math.ceil(total/limit),
        })
    }catch(err: any){
        console.error("List products failed:", err.cause ?? err);
        return res.status(500).json({error: "something went wrong"});

    }
    
});

/* GET /products/:id */
router.get("/:id", async(req, res) => {
    const id = Number(req.params.id);

    if(!Number.isInteger(id) || id < 1){
        return res.status(400).json({error: "Invalid product id"});
    }

    try {
        const [row] = await db
        .select({
            product: products,
            storeName: stores.name,
            storeSlug: stores.slug,
        })
        .from(products)
        .leftJoin(stores, eq(products.storeId, stores.id))
        .where(and(eq(products.id, id),eq(products.isActive, true)));

        if(!row){
            return res.status(404).json({error: "Product not found"});
        }
   const { product, storeName, storeSlug } = row;

    return res.json({
      ...product,
      finalPrice: finalPrice(product.price, product.discountPercent),
      seller: storeSlug ? { name: storeName, slug: storeSlug } : null, // null = sold by the platform

    });
  } catch (err: any) {
    console.error("Get product failed:", err.cause ?? err);
    return res.status(500).json({ error: "Something went wrong" });

  }
});

export default router;

