import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

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

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: {error: "Too many requests, please try again later"},
});

server.get("/health", (req, res) => {
    res.json({status: "ok"});
});

server.use("/auth", authLimiter, authRoutes);

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});