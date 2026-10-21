import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

export const validate = 
(schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body ?? {});

    if(!parsed.success){
        return res.status(400).json({
            error: "Invalid input",
            details: parsed.error.issues.map((i) => ({
                field: i.path.join("."),
                message: i.message,
            })),
        });
    }

    req.body = parsed.data;
    next();
}