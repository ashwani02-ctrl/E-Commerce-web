import "dotenv/config";
import bcrypt from "bcrypt";
import { db } from "./index.js";
import { users } from "./schema.js";

async function main() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if(!email || !password){
        throw new Error("set ADMIN_EMAIL and ADMIN_PASSWORD in .env");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    
    await db
    .insert(users)
    .values({
        name: "Admin",
        email: email.toLowerCase(),
        passwordHash, 
        role: "admin"
    })
    .onConflictDoNothing();

    console.log("Admin ready:", email);
    process.exit(0);
}

main().catch((err) => {
    console.error(err.cause ?? err);
    process.exit(1);
});