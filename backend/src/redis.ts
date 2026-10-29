import "dotenv/config";
import { Redis } from "ioredis";

export const redis = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: 2 });

redis.on("error", (err) => console.error("Redis error:", err.message));