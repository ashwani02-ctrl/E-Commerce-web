import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq, and, gt } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, passwordResets, revokedTokens } from "../db/schema.js";
import crypto from "crypto";
import { sendResetEmail } from "../utils/mail.js";
import { validate } from "../middleware/validate.js";
import {
    forgotPasswordSchema,
    loginSchema,
    registerSchema,
    resetPasswordSchema
} from "../schemas/auth.schema.js";
import rateLimit from "express-rate-limit";
import { loginLimiter } from "../middleware/rateLimiter.js";
import { requireAuth } from "../middleware/auth.js";
import { error } from "console";

const router = Router();


/* POST /auth/register */

router.post("/register", validate(registerSchema), async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const passwordHash = await bcrypt.hash(password, 12);

        const [user] = await db
            .insert(users)
            .values({ name, email, passwordHash, role })
            .returning({ id: users.id, email: users.email, role: users.role });

        return res.status(201).json(user);
    } catch (err: any) {
        const code = err.cause?.code ?? err.code;

        if (code === "23505") {
            return res.status(409).json({
                error: "Email already registered"
            });
        }

        console.error("Register failed:", err.cause ?? err);
        return res.status(500).json({ error: "Something went wrong" });
    }
});

/*POST /auth/login */

router.post("/login", loginLimiter, validate(loginSchema), async (req, res) => {
    const { email, password } = req.body;
    try {
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email));

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({
                error: "Wrong email or password"
            });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: "7d", jwtid: crypto.randomUUID() }
        );

        res.status(200).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
        });
    } catch (err: any) {
        console.error("Login failed:", err.cause ?? err);
        return res.status(500).json({ error: "Something went wrong" });

    }
})

/* POST /auth/logout */

router.post("/logout", requireAuth, async(req, res) => {
    const {jti, exp} = (req as any).user;

    try{
        await db
        .insert(revokedTokens)
        .values({jti, expiresAt: new Date(exp * 1000)})
        .onConflictDoNothing();

        return res.status(200).json({message: "Logged Out"});
    }catch(err: any){
        console.error("Logout failed:", err.cause ?? err);
        return res.status(500).json({error: "Something went wrong"});
    }
})


const hashToken = (t: string) =>
    crypto.createHash("sha256").update(t).digest("hex");

/* POST /auth/forgot-password */
router.post("/forgot-password", validate(forgotPasswordSchema), async (req, res) => {
    const { email } = req.body;

    try {
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email));

        if (user) {
            const token = crypto.randomBytes(32).toString("hex");

            await db
                .delete(passwordResets)
                .where(eq(passwordResets.userId, user.id));

            await db
                .insert(passwordResets)
                .values({
                    userId: user.id,
                    tokenHash: hashToken(token),
                    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
                });

            const clientUrl = process.env.CLIENT_URL || "https://localhost:3000";

            const resetUrl = new URL("/reset-password", clientUrl);
            resetUrl.searchParams.set("token", token);
            //testing 
            console.log(resetUrl);

            try {
                await sendResetEmail(user.email, resetUrl.toString());

            } catch (emailError) {
                console.error("Password reset email failed:", emailError);

                await db
                    .delete(passwordResets)
                    .where(eq(passwordResets.userId, user.id));
            }
        }

        res.status(200).json({
            message: "If that email exists, a reset link has been sent"
        });
    } catch (err: unknown) {
        console.error("Forgot password failed:", err);

        return res.status(500).json({
            error: "Something went wrong. Please try again later",
        });
    }

});

// POST /auth/reset-password
router.post("/reset-password", validate(resetPasswordSchema), async (req, res) => {
    const { token, newPassword } = req.body;

    try {


        const newHash = await bcrypt.hash(newPassword, 12);

        const success = await db.transaction(async (tx) => {
            const [reset] = await tx
                .delete(passwordResets)
                .where(
                    and(
                        eq(passwordResets.tokenHash, hashToken(token)),
                        gt(passwordResets.expiresAt, new Date())
                    )
                )
                .returning({ userId: passwordResets.userId });

            if (!reset) return false;

            await tx
                .update(users)
                .set({ passwordHash: newHash })
                .where(eq(users.id, reset.userId));

            await tx.delete(passwordResets).where(eq(passwordResets.userId, reset.userId));

            return true;

        });

        if (!success) {
            return res.status(400).json({ error: "Link is invalid or expired." });
        }

        return res.json({ message: "Password reset. You can log in now" });
    } catch (err: any) {

        console.error("Reset password failed:", err.cause ?? err);
        return res.status(500).json({ error: "Something went wrong" });
    }

});

export default router;

