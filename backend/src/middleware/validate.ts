import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

type Source = "body" | "query" | "params";

export const validate =
    (schema: ZodType, source: Source = "body") =>
        (req: Request, res: Response, next: NextFunction) => {
            const parsed = schema.safeParse(req[source] ?? {});

            if (!parsed.success) {
                return res.status(400).json({
                    error: "Invalid input",
                    details: parsed.error.issues.map((i) => ({
                        field: i.path.join("."),
                        message: i.message,
                    })),
                });
            }

            if (source === "body") {
                req.body = parsed.data;

            } else {
                res.locals[source] = parsed.data;
            }

            next();
        }