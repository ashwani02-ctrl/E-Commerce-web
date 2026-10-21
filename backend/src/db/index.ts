import "dotenv/config"
import postgres from "postgres";
import {drizzle} from "drizzle-orm/postgres-js"

// console.log("DB URL host:", process.env.DATABASE_URL?.split("@")[1]);

const client = postgres(process.env.DATABASE_URL!);

export const db = drizzle(client);
