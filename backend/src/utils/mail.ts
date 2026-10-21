import nodemailer from "nodemailer";

export async function sendResetEmail(to: string, link: string) {

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject: "Reset Your password",
        text: `Open this link to reset your password (valid for 15 minutes): ${link}`,
        html: `
      <p>You asked to reset your password.</p>
      <p><a href="${link}">Click here to choose a new password</a></p>
      <p>This link works for 15 minutes. If you didn't ask for this, ignore this email.</p>
    `,
    });

}