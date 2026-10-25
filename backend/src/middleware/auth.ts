import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { revokedTokens } from "../db/schema.js";
import { eq } from "drizzle-orm";

export async function requireAuth(req: Request, res: Response, next: NextFunction){
    const header = req.headers.authorization;
    const token = header?.split(" ")[1];

    if(!token) { return res.status(401).json({error: "not logged in"}); }

    try{
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;

        const [revoked] = await db
        .select()
        .from(revokedTokens)
        .where(eq(revokedTokens.jti, payload.jti ?? ""));

        if(revoked){
            return res.status(401).json({error: "Logged out, please log in again"});

        }

        (req as any).user = payload;
        next();
    }catch{
        return res.status(401).json({error: "Invalid token"});
    }
}

export function requireRole(role: "buyer" | "seller" | "admin"){
    return (req: Request, res: Response, next: NextFunction) => {
        if((req as any).user.role !== role) {
            return res.status(403).json({error: "Not allowed"});
        }
        next();
    };
}