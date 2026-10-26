import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { createProductSchema, idParams, sellerOrdersQuery, slugify, storeSchema, updateOrderStatusSchema, updateProductSchema, updateStoreSchema } from "../schemas/seller.schema.js";
import { db } from "../db/index.js";
import { orderItems, orders, products, stores, users } from "../db/schema.js";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import crypto from "crypto";
import type z from "zod";


const router = Router();

const getStoreId = async (sellerId: number) => {
  const [store] = await db
    .select({ id: stores.id })
    .from(stores)
    .where(eq(stores.sellerId, sellerId));
  return store?.id ?? null;
};

/* POST /seller/store */
router.post("/store", validate(storeSchema), async (req, res) => {
    const sellerId = (req as any).user.id as number;
    const {name, description} = req.body;

    try{

        const [existing] = await db
        .select({id: stores.id})
        .from(stores)
        .where(eq(stores.sellerId, sellerId));

        if(existing){
            return res.status(409).json({error: "You already have a store"});
        }

        let slug = slugify(name);
        const [taken] = await db
        .select({id: stores.id})
        .from(stores)
        .where(eq(stores.slug, slug));

        if(taken){
            slug = `${slug}-${crypto.randomBytes(2).toString("hex")}`;
        }

        const [store] = await db
        .insert(stores)
        .values({sellerId, name, slug, description})
        .returning({
            id: stores.id,
            name: stores.name,
            slug: stores.slug,
            description: stores.description,
        });

        return res.status(201).json(store);
  
    }catch(err: any){
        const code = err.cause?.code ?? err.code;
        if(code === "23505"){
            return res.status(409).json({error: "Store name already taken, try another"});

        }
        console.error("Create store failed:", err.cause ?? err);
        return res.status(500).json({error: "Something went wrong"});

    }
});

/* GET /seller/store */

router.get("/store", async (req, res) => {
  const sellerId = (req as any).user.id as number;

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
      .where(eq(stores.sellerId, sellerId));

    if (!store) {
      return res.status(404).json({ error: "You haven't set up a store yet" });
    }

    return res.json(store);
  } catch (err: any) {
    console.error("Get my store failed:", err.cause ?? err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

/* /seller/store */

router.put("/store", validate(updateStoreSchema), async (req, res) => {
  const sellerId = (req as any).user.id as number;

  try {
    const [store] = await db
      .update(stores)
      .set(req.body)
      .where(eq(stores.sellerId, sellerId))
      .returning({
        id: stores.id,
        name: stores.name,
        slug: stores.slug,
        description: stores.description,
      });

    if (!store) {
      return res.status(404).json({ error: "You haven't set up a store yet" });
    }

    return res.json(store);
  } catch (err: any) {
    console.error("Update store failed:", err.cause ?? err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});


/* POST /seller/products */

router.post("/products", validate(createProductSchema), async (req, res) => {
  const sellerId = (req as any).user.id as number;

  try {
    const [store] = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.sellerId, sellerId));

    if (!store) {
      return res.status(403).json({ error: "Set up your store before adding products" });
    }

    const [product] = await db
      .insert(products)
      .values({ ...req.body, storeId: store.id })
      .returning();

    return res.status(201).json(product);
  } catch (err: any) {
    console.error("Create product failed:", err.cause ?? err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// PUT /seller/products/:id
router.put(
  "/products/:id",
  validate(idParams, "params"),
  validate(updateProductSchema),
  async (req, res) => {
    const sellerId = (req as any).user.id as number;
    const { id } = res.locals.params as z.infer<typeof idParams>;

    try {
      const storeId = await getStoreId(sellerId);
      if (!storeId) {
        return res.status(403).json({ error: "Set up your store first" });
      }

      const [product] = await db
        .update(products)
        .set(req.body)
        .where(
          and(
            eq(products.id, id),
            eq(products.storeId, storeId),
            eq(products.isActive, true)
          )
        )
        .returning();

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      return res.json(product);
    } catch (err: any) {
      console.error("Update product failed:", err.cause ?? err);
      return res.status(500).json({ error: "Something went wrong" });
    }
  }
);

// DELETE /seller/products/:id  (soft delete)
router.delete("/products/:id", validate(idParams, "params"), async (req, res) => {
  const sellerId = (req as any).user.id as number;
  const { id } = res.locals.params as z.infer<typeof idParams>;

  try {
    const storeId = await getStoreId(sellerId);
    if (!storeId) {
      return res.status(403).json({ error: "Set up your store first" });
    }

    const [product] = await db
      .update(products)
      .set({ isActive: false })
      .where(
        and(
          eq(products.id, id),
          eq(products.storeId, storeId),
          eq(products.isActive, true)
        )
      )
      .returning({ id: products.id });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.json({ message: "Product removed" });
  } catch (err: any) {
    console.error("Delete product failed:", err.cause ?? err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// GET /seller/orders?status=&page=&limit=
router.get("/orders", validate(sellerOrdersQuery, "query"), async (req, res) => {
  const sellerId = (req as any).user.id as number;
  const { status, page, limit } = res.locals.query as z.infer<typeof sellerOrdersQuery>;

  try {
    const storeId = await getStoreId(sellerId);
    if (!storeId) return res.status(403).json({ error: "Set up your store first" });

    const where = status
      ? and(eq(orders.storeId, storeId), eq(orders.status, status))
      : eq(orders.storeId, storeId);

    const [rows, totalRows] = await Promise.all([
      db
        .select({
          id: orders.id,
          status: orders.status,
          totalCents: orders.total,
          shippingAddress: orders.shippingAddress,
          createdAt: orders.createdAt,
          buyerName: users.name,
        })
        .from(orders)
        .innerJoin(users, eq(orders.buyerId, users.id))
        .where(where)
        .orderBy(desc(orders.id))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ total: count() }).from(orders).where(where),
    ]);

    // load the items for just these orders
    const ids = rows.map((r) => r.id);
    const items = ids.length
      ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids))
      : [];

    const byOrder = new Map<number, typeof items>();
    for (const item of items) {
      byOrder.set(item.orderId, [...(byOrder.get(item.orderId) ?? []), item]);
    }

    const total = totalRows[0]?.total ?? 0;

    return res.json({
      orders: rows.map((o) => ({ ...o, items: byOrder.get(o.id) ?? [] })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    console.error("List seller orders failed:", err.cause ?? err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// PATCH /seller/orders/:id/status
router.patch(
  "/orders/:id/status",
  validate(idParams, "params"),
  validate(updateOrderStatusSchema),
  async (req, res) => {
    const sellerId = (req as any).user.id as number;
    const { id } = res.locals.params as z.infer<typeof idParams>;
    const next = req.body.status as "shipped" | "delivered";

    // the only status each new status may come from
    const from = { shipped: "pending", delivered: "shipped" }[next];

    try {
      const storeId = await getStoreId(sellerId);
      if (!storeId) return res.status(403).json({ error: "Set up your store first" });

      const [updated] = await db
        .update(orders)
        .set({ status: next })
        .where(and(eq(orders.id, id), eq(orders.storeId, storeId), eq(orders.status, from)))
        .returning({ id: orders.id, status: orders.status, updatedAt: orders.updatedAt });

      if (updated) return res.json(updated);

      // nothing changed: find out why
      const [existing] = await db
        .select({ status: orders.status })
        .from(orders)
        .where(and(eq(orders.id, id), eq(orders.storeId, storeId)));

      if (!existing) return res.status(404).json({ error: "Order not found" });

      return res
        .status(409)
        .json({ error: `Cannot change an order from ${existing.status} to ${next}` });
    } catch (err: any) {
      console.error("Update order status failed:", err.cause ?? err);
      return res.status(500).json({ error: "Something went wrong" });
    }
  }
);
export default router;