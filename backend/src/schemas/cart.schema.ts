import z from "zod";
import { sellerOrdersQuery } from "./seller.schema.js";

export const MAX_PER_ITEM = 20;

export const addCartItemSchema = z.object({
    productId: z.number().int().min(1),
    quantity: z.number().int().min(1).max(MAX_PER_ITEM).default(1),
});

export const updateCartItemSchema = z.object({
    quantity: z.number().int().min(1).max(MAX_PER_ITEM),
});

export const productIdParams = z.object({
    productId: z.coerce.number().int().min(1),
});

export const checkoutSchema = z.object({
  shippingAddress: z.string().trim().min(10).max(500),
});

// same page/limit/status shape as the seller's list
export const buyerOrdersQuery = sellerOrdersQuery;