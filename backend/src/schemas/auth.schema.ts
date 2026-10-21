import { z } from "zod";

const email = z.string().trim().toLowerCase().email().max(255);

const newPassword = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters")
    .regex(/[a-z]/, "Add a lowercase letter")
    .regex(/[A-Z]/, "Add an uppercase letter")
    .regex(/[0-9]/, "Add a number");

export const registerSchema = z.object({
    name: z.string().trim().min(2).max(100),
    email,
    password: newPassword,
    role: z.enum(["buyer", "seller"]),
});

export const loginSchema = z.object({
    email,
    password: z.string().min(1, "password is required"),
});

export const forgotPasswordSchema = z.object({email});

export const resetPasswordSchema = z.object({
    token: z.string().min(1),
    newPassword,
})

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword,
})