import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { slugify, storeSchema } from "../schemas/seller.schema.js";
import { db } from "../db/index.js";
import { stores } from "../db/schema.js";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

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

export default router;