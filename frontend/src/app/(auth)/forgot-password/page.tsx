"use client";
 
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoginCard } from "@/app/_components/login/logincard";
import { ApiError, api, errorMessage } from "@/lib/api";
import { validateEmail } from "@/lib/validation";
import type { MessageResponse } from "@/types/api";
 
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
 
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
 
    setFormError("");
 
    const problem = validateEmail(email);
    setEmailError(problem);
    if (problem) return;
 
    setSubmitting(true);
    try {
      // the backend gives the same reply whether or not the email has an account
      await api.post<MessageResponse>("/auth/forgot-password", { email: email.trim() }, { auth: false });
      setSentTo(email.trim());
    } catch (err) {
      if (err instanceof ApiError && err.status === 400 && err.fieldErrors.email) {
        setEmailError(err.fieldErrors.email);
      } else {
        setFormError(errorMessage(err)); // for example 429 "Too many requests"
      }
    } finally {
      setSubmitting(false);
    }
  }
 
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <LoginCard />
 
      <div className="flex items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-md">
          <Link
            href="/login"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-brand-navy transition-colors hover:text-brand-blue"
          >
            <span aria-hidden="true">←</span>
            <span>Back to log in</span>
          </Link>
 
          <Card className="w-full p-6 max-w-md border-none bg-transparent shadow-none">
            {sentTo ? (
              <>
                <CardHeader className="space-y-4 p-0">
                  <CardTitle className="text-4xl font-black tracking-[-0.06em] text-brand-navy">
                    Check your email
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    If an account exists for <span className="font-semibold text-brand-navy">{sentTo}</span>,
                    we&apos;ve sent a link to reset your password. It works for 15 minutes.
                  </CardDescription>
                </CardHeader>
 
                <CardContent className="space-y-3 p-0 pt-6" role="status">
                  <p className="text-sm text-muted-foreground">
                    Can&apos;t find it? Check your spam folder, or try again with a different email.
                  </p>
                </CardContent>
 
                <CardFooter className="mt-2 flex-col gap-4 p-0 pt-4">
                  <Link
                    href="/login"
                    className="inline-flex h-12 w-full items-center justify-center rounded-md bg-brand-navy text-base font-semibold text-white transition-colors hover:bg-brand-blue"
                  >
                    Back to log in
                  </Link>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSentTo(null)}
                    className="h-12 w-full text-base font-semibold"
                  >
                    Use a different email
                  </Button>
                </CardFooter>
              </>
            ) : (
              <>
                <CardHeader className="space-y-4 p-0">
                  <CardTitle className="text-4xl font-black tracking-[-0.06em] text-brand-navy">
                    Forgot your password?
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    Enter your email and we&apos;ll send you a link to reset it.
                  </CardDescription>
                  <CardAction className="pt-2"></CardAction>
                </CardHeader>
 
                <form onSubmit={handleSubmit} noValidate>
                  <CardContent className="space-y-6 p-0 pt-6">
                    {formError && (
                      <p
                        role="alert"
                        className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                      >
                        {formError}
                      </p>
                    )}
 
                    <div className="grid gap-2">
                      <label htmlFor="email" className="text-sm font-medium text-brand-navy">
                        Email
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={submitting}
                        aria-invalid={Boolean(emailError)}
                        aria-describedby={emailError ? "email-error" : undefined}
                        className="h-12 rounded-lg border border-border bg-white text-base placeholder:text-muted-foreground"
                      />
                      {emailError && (
                        <p id="email-error" role="alert" className="text-sm text-red-600">
                          {emailError}
                        </p>
                      )}
                    </div>
                  </CardContent>
 
                  <CardFooter className="mt-2 flex-col gap-4 p-0 pt-4">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="h-12 w-full bg-brand-navy text-base font-semibold text-white hover:bg-brand-blue"
                    >
                      {submitting ? "Sending link…" : "Send reset link"}
                    </Button>
 
                    <p className="text-center text-sm text-muted-foreground pb-4">
                      Remembered it?{" "}
                      <Link href="/login" className="font-semibold text-brand-blue hover:underline">
                        Log in
                      </Link>
                    </p>
                  </CardFooter>
                </form>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}