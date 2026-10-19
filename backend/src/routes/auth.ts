import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq, and, gt } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, passwordResets } from "../db/schema.js";
import crypto from "crypto";
import { error } from "console";


const router = Router();

//POST /auth/register
router.post("/register", async (req, res) => {
    const { name, email, password, role } = req.body;

    if(role !== "buyer" && role !== "seller"){
        return res.status(400).json({error: "role must be a buyer or seller"});
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    const [user] = await db
    .insert(users)
    .values({name, email, passwordHash, role})
    .returning({ id: users.id, email: users.email, role: users.role});

    res.status(201).json(user);
});

//POST /auth/login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const [user] = await db.select().from(users).where(eq(users.email, email));
    if(!user || !(await bcrypt.compare(password, user.passwordHash))){
        return res.status(401).json({error: "Wrong email or password"});
    }

    const token = jwt.sign(
        {id: user.id, role: user.role},
        process.env.JWT_SECRET!,
        {expiresIn: "7d"}
    );

    res.json({token, role: user.role});
})


const hashToken = (t: string) => 
    crypto.createHash("sha256").update(t).digest("hex");

// POST /auth/forgot-password
router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;

    const [user] = await db.select().from(users).where(eq(users.email, email));
    
    if(user){
        const token = crypto.randomBytes(32).toString("hex");

        await db.delete(passwordResets).where(eq(passwordResets.userId, user.id));
        await db.insert(passwordResets).values({
            userId: user.id,
            tokenHash: hashToken(token),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        })

        const link = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
        console.log("Reset Link", link);
    }

    res.json({message: "If that email exists, a reset link has been sent"});

});

// POST /auth/reset-password
router.post("/reset-password", async (req, res) => {
    const { token, newPassword} = req.body;

    if(!token || !newPassword || newPassword.length < 8){
        return res.status(400).json({error: "Token and a password of 8+ characters are required."});
    }

    const [reset] = await db
    .select()
    .from(passwordResets)
    .where(
        and(
            eq(passwordResets.tokenHash, hashToken(token)),
            gt(passwordResets.expiresAt, new Date())
        )
    );

    if(!reset){
        return res.status(400).json({error: "Link is invalid or expired"});
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({passwordHash: newHash}).where(eq(users.id, reset.userId));
    await db.delete(passwordResets).where(eq(passwordResets.userId, reset.userId));

    res.json({message: "Password reset. You can log in now"});
});

export default router;

