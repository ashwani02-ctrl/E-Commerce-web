import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { stores } from "../db/schema.js";

export const getStoreId = async (sellerId: number) => {
  const [store] = await db
    .select({ id: stores.id })
    .from(stores)
    .where(eq(stores.sellerId, sellerId));
  return store?.id ?? null;
};