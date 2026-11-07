"use client";

import { useEffect, useState, type FormEvent } from "react";
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
import { checkPassword, isPasswordValid } from "@/lib/validation";
import type { MessageResponse } from "@/types/api";

const linkButton =
  "inline-flex h-12 w-full items-center justify-center rounded-md bg-brand-navy text-base font-semibold text-white transition-colors hover:bg-brand-blue";

export default function ResetPasswordPage() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [linkBroken, setLinkBroken] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const checklist = checkPassword(password);

  // read ?token=... from the emailed link, then remove it from the address bar so it
  // doesn't stay in the browser history or get sent to other sites in the Referer header
  useEffect(() => {
    const found = new URLSearchParams(window.location.search).get("token");
    if (found) {
      setToken(found);
      window.history.replaceState(null, "", window.location.pathname);
    }
    setReady(true);
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting || !token) return;

    setFormError("");

    const found: Record<string, string> = {};
    if (!isPasswordValid(password)) found.password = "Your password doesn't meet all the requirements below";
    if (confirm !== password) found.confirm = "The two passwords don't match";

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await api.post<MessageResponse>(
        "/auth/reset-password",
        { token, newPassword: password },
        { auth: false }
      );
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        const fields = err.fieldErrors;
        if (fields.newPassword) {
          setErrors({ password: fields.newPassword });
        } else {
          setLinkBroken(true); // "Link is invalid or expired"
        }
      } else {
        setFormError(errorMessage(err)); // for example 429 "Too many requests"
      }
    } finally {
      setSubmitting(false);
    }
  }

  const noLink = ready && (!token || linkBroken) && !done;

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
            {!ready ? (
              <CardHeader className="p-0">
                <CardTitle className="text-4xl font-black tracking-[-0.06em] text-brand-navy">
                  Loading…
                </CardTitle>
              </CardHeader>
            ) : done ? (
              <>
                <CardHeader className="space-y-4 p-0">
                  <CardTitle className="text-4xl font-black tracking-[-0.06em] text-brand-navy">
                    Password updated
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground" role="status">
                    Your password has been changed. You can log in with it now.
                  </CardDescription>
                </CardHeader>
                <CardFooter className="mt-2 p-0 pt-6">
                  <Link href="/login" className={linkButton}>
                    Log in
                  </Link>
                </CardFooter>
              </>
            ) : noLink ? (
              <>
                <CardHeader className="space-y-4 p-0">
                  <CardTitle className="text-4xl font-black tracking-[-0.06em] text-brand-navy">
                    This link isn&apos;t valid
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground" role="alert">
                    The reset link is missing, already used, or older than 15 minutes. Request a new one and
                    we&apos;ll email it to you.
                  </CardDescription>
                </CardHeader>
                <CardFooter className="mt-2 p-0 pt-6">
                  <Link href="/forgot-password" className={linkButton}>
                    Request a new link
                  </Link>
                </CardFooter>
              </>
            ) : (
              <>
                <CardHeader className="space-y-4 p-0">
                  <CardTitle className="text-4xl font-black tracking-[-0.06em] text-brand-navy">
                    Choose a new password
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    Pick a password you haven&apos;t used before.
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
                      <label htmlFor="password" className="text-sm font-medium text-brand-navy">
                        New password
                      </label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={submitting}
                        aria-invalid={Boolean(errors.password)}
                        aria-describedby={errors.password ? "password-error password-rules" : "password-rules"}
                        className="h-12 rounded-lg border border-border bg-white text-base placeholder:text-muted-foreground"
                      />
                      {errors.password && (
                        <p id="password-error" role="alert" className="text-sm text-red-600">
                          {errors.password}
                        </p>
                      )}
                      <ul id="password-rules" aria-label="Password requirements" className="grid gap-1 text-sm">
                        {checklist.map((rule) => (
                          <li
                            key={rule.id}
                            className={rule.passed ? "text-green-700" : "text-muted-foreground"}
                          >
                            <span aria-hidden="true">{rule.passed ? "✓" : "○"}</span> {rule.label}
                            <span className="sr-only">{rule.passed ? " (met)" : " (not met)"}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="confirm" className="text-sm font-medium text-brand-navy">
                        Confirm new password
                      </label>
                      <Input
                        id="confirm"
                        name="confirm"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Type it again"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        disabled={submitting}
                        aria-invalid={Boolean(errors.confirm)}
                        aria-describedby={errors.confirm ? "confirm-error" : undefined}
                        className="h-12 rounded-lg border border-border bg-white text-base placeholder:text-muted-foreground"
                      />
                      {errors.confirm && (
                        <p id="confirm-error" role="alert" className="text-sm text-red-600">
                          {errors.confirm}
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
                      {submitting ? "Updating…" : "Update password"}
                    </Button>
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