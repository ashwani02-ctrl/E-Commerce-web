import "dotenv/config";
import { readFileSync } from "fs";
import path from "path";
import { db } from "./index.js";
import { products } from "./schema.js";
import { isNull } from "drizzle-orm";

type DummyProduct = {
    title: string;
    description: string;
    category: string;
    price: number;
    discountPercentage: number;
    rating: number;
    stock: number;
    brand?: string;
    tags: string[];
    images: string[];
    thumbnail: string;
};

function loadProducts(): DummyProduct[] {
    const file = path.join(process.cwd(), "src/db/products.json");
    return JSON.parse(readFileSync(file, "utf-8")).products;
}

async function seed() {
    const existing = await db
        .select()
        .from(products)
        .where(isNull(products.storeId));

    if (existing.length > 0) {
        console.log("Platform products already exist, nothing to add");
        process.exit(0);
    }

    const items = loadProducts();

    await db
        .insert(products)
        .values(
            items.map((p) => ({
                storeId: null,
                title: p.title.slice(0, 150),
                description: p.description,
                price: Math.round(p.price * 100),
                stock: p.stock,
                category: p.category,
                brand: p.brand?.slice(0, 100) ?? null,
                rating: p.rating,
                discountPercent: p.discountPercentage,
                images: p.images,
                tags: p.tags,
                imageUrl: p.thumbnail,
            }))
        );

        console.log(`Added ${items.length} products`);
        process.exit(0);

}

seed().catch((err) => {
    console.error("Seed failed:", err.cause ?? err);
    process.exit(1);
})