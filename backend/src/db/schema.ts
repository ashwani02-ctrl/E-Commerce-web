
import { integer, serial, varchar, timestamp, pgTable } from "drizzle-orm/pg-core";

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