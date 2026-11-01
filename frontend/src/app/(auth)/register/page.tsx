"use client";
 
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { LoginCard } from "@/components/comp/logincard";
import { useAuth } from "@/providers/AuthProvider";
import { getSafeNext, homePathForRole } from "@/lib/session";
import { ApiError, errorMessage } from "@/lib/api";
import { checkPassword, isPasswordValid, validateEmail, validateName } from "@/lib/validation";
import type { RegisterInput } from "@/types/api";
 
type RoleChoice = RegisterInput["role"];
 
const ROLE_OPTIONS: { value: RoleChoice; label: string }[] = [
  { value: "buyer", label: "I want to buy" },
  { value: "seller", label: "I want to sell" },
];
 
export default function RegisterPage() {
  const router = useRouter();
  const { user, isLoading, register, login } = useAuth();
 
  const [role, setRole] = useState<RoleChoice>("buyer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
 
  const checklist = checkPassword(password);
 
  // runs after the automatic login below, and if a logged-in user opens /register
  useEffect(() => {
    if (!isLoading && user) {
      router.replace(getSafeNext() ?? homePathForRole(user.role));
    }
  }, [isLoading, user, router]);
 
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
 
    setFormError("");
 
    const found: Record<string, string> = {};
    const nameError = validateName(name);
    if (nameError) found.name = nameError;
    const emailError = validateEmail(email);
    if (emailError) found.email = emailError;
    if (!isPasswordValid(password)) found.password = "Your password doesn't meet all the requirements below";
 
    setErrors(found);
    if (Object.keys(found).length > 0) return;
 
    setSubmitting(true);
 
    try {
      await register({ name: name.trim(), email: email.trim(), password, role });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setErrors({ email: err.message }); // "Email already registered"
      } else if (err instanceof ApiError && err.status === 400 && Object.keys(err.fieldErrors).length > 0) {
        setErrors(err.fieldErrors);
      } else {
        setFormError(errorMessage(err));
      }
      setSubmitting(false);
      return;
    }
 
    // the account exists now: log in straight away, then the effect above redirects by role
    try {
      await login(email.trim(), password);
    } catch {
      router.push("/login"); // account was created, so just ask them to log in
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
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-brand-navy transition-colors hover:text-brand-blue"
          >
            <span aria-hidden="true">←</span>
            <span>Back to Bazaar</span>
          </Link>
 
          <Card className="w-full p-6 max-w-md border-none bg-transparent shadow-none">
            <CardHeader className="space-y-4 p-0">
              <CardTitle className="text-4xl font-black tracking-[-0.06em] text-brand-navy">
                Create your account
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Join Bazaar to start shopping or selling.
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
                  <span id="role-label" className="text-sm font-medium text-brand-navy">
                    Account type
                  </span>
                  <div
                    role="group"
                    aria-labelledby="role-label"
                    className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1.5"
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={role === option.value}
                        disabled={submitting}
                        onClick={() => setRole(option.value)}
                        className={`h-11 rounded-lg text-sm font-semibold transition-colors ${
                          role === option.value
                            ? "bg-brand-navy text-white"
                            : "text-brand-navy hover:bg-white"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
 
                <div className="grid gap-2">
                  <label htmlFor="name" className="text-sm font-medium text-brand-navy">
                    Full name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={submitting}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "name-error" : undefined}
                    className="h-12 rounded-lg border border-border bg-white text-base placeholder:text-muted-foreground"
                  />
                  {errors.name && (
                    <p id="name-error" role="alert" className="text-sm text-red-600">
                      {errors.name}
                    </p>
                  )}
                </div>
 
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
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    className="h-12 rounded-lg border border-border bg-white text-base placeholder:text-muted-foreground"
                  />
                  {errors.email && (
                    <p id="email-error" role="alert" className="text-sm text-red-600">
                      {errors.email}
                    </p>
                  )}
                </div>
 
                <div className="grid gap-2">
                  <label htmlFor="password" className="text-sm font-medium text-brand-navy">
                    Password
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
              </CardContent>
 
              <CardFooter className="mt-2 flex-col gap-4 p-0 pt-4">
                <Button
                  type="submit"
                  disabled={submitting || isLoading}
                  className="h-12 w-full bg-brand-navy text-base font-semibold text-white hover:bg-brand-blue"
                >
                  {submitting ? "Creating account…" : "Create account"}
                </Button>
 
                <p className="text-center text-sm text-muted-foreground pb-4">
                  Already have an account?{" "}
                  <Link href="/login" className="font-semibold text-brand-blue hover:underline">
                    Log in
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}