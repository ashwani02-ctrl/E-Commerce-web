
import { integer, serial, varchar, timestamp, pgTable, text, boolean, real, jsonb } from "drizzle-orm/pg-core";


export const users = pgTable("users", {
    id: serial("id").primaryKey(),

    name: varchar("name", {
        length: 100,
    }).notNull(),

    email: varchar("email", {
        length: 255,
    }).notNull().unique(),

    passwordHash: varchar("password_hash", {
        length: 255,
    }).notNull(),

    role: varchar("role", {
        length: 10
    }).notNull().default("buyer"),

    createdAt: timestamp("created_at").defaultNow(),
});

export const passwordResets = pgTable("password_resets", {
    id: serial("id").primaryKey(),

    userId: integer("user_id")
    .notNull()
    .references(() => users.id, {onDelete: "cascade"}),

    tokenHash: varchar("token_hash", { length: 64}).notNull(),

    expiresAt: timestamp("expires_at").notNull(),
});

export const revokedTokens = pgTable("revoked_tokens", {
  jti: varchar("jti", { length: 64 }).primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const stores = pgTable("stores", {
    id: serial("id").primaryKey(),
    sellerId: integer("seller_id")
    .notNull()
    .unique()
    .references(() => users.id, {onDelete: "cascade"}),
    name: varchar("name", {length: 100}).notNull(),
    slug: varchar("slug", {length: 100}).notNull().unique(),
});

export const products = pgTable("products", {
    id: serial("id").primaryKey(),
    storeId: integer("store_id")
    .references(() => stores.id, {onDelete: "cascade"}),
    title: varchar("title", {length: 150}).notNull(),
    description: text("description"),
    price: integer("price").notNull(),
    stock: integer("stock").notNull().default(0),
    category: varchar("category", {length: 50}),
    imageUrl: varchar("image_url", {length: 500}),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow(),
    brand: varchar("brand", {length: 100}),
    rating: real("rating"),
    discountPercent: real("discount_percent"),
    images: jsonb("images").$type<string[]>().default([]),
    tags: jsonb("tags").$type<string[]>().default([]),

})