import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import sellerRoutes from "./routes/seller.js";
import buyerRoutes from "./routes/buyer.js";
import helmet from "helmet";
import { authLimiter } from "./middleware/rateLimiter.js";
import { requireAuth, requireRole } from "./middleware/auth.js";

const server = express();

const PORT: number = Number(process.env.PORT) || 5000;
const CLIENT_URL: string = process.env.CLIENT_URL || "http://localhost:3000";

server.use(helmet());

server.use(
    cors({
        origin: CLIENT_URL,
        credentials: true,
    })
);

server.use(express.json());



server.get("/health", (req, res) => {
    res.json({status: "ok"});
});

server.use("/auth", authLimiter, authRoutes);

server.use("/products", productRoutes);

server.use("/seller", requireAuth, requireRole("seller"), sellerRoutes);

server.use("/buyer", requireAuth, requireRole("buyer"), buyerRoutes);



server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});