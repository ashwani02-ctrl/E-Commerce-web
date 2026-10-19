import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function requireAuth(req: Request, res: Response, next: NextFunction){
    const header = req.headers.authorization;
    const token = header?.split("")[1];

    if(!token) { return res.status(401).json({error: "not logged in"}); }

    try {
        (req as any).user = jwt.verify(token, process.env.JWT_SECRET!);
        next();
    }catch{
        res.status(401).json({error: "Invalid token"});
    }
}

export function requireRole(role: "buyer" | "seller"){
    return (req: Request, res: Response, next: NextFunction) => {
        if((req as any).user.role !== role) {
            return res.status(403).json({error: "Not allowed"});
        }
        next();
    };
}