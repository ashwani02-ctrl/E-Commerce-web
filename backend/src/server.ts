import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const server = express();

const PORT: number = Number(process.env.PORT) || 5000;
const CLIENT_URL: string = process.env.CLIENT_URL || "";

server.use(
    cors({
        origin: CLIENT_URL,
        credentials: true,
    })
);

server.use(express.json());

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});