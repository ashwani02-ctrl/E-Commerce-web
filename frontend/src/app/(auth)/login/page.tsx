"use client"
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
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { homePathForRole, useAuth } from "@/providers/AuthProvider";
import { validateEmail } from "@/lib/validation";
import { ApiError, errorMessage } from "@/lib/api";
import Link from "next/link";

const getSafeNext = (): string | null => {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
};

export default function Loginpage() {
  const router = useRouter();
  const {user, isLoading, login} = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if(!isLoading && user){
      router.replace(getSafeNext() ?? homePathForRole(user.role));
    }
  }, [isLoading, user, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if(submitting) return;

    setFormError("");

    const found: Record<string, string> = {};
    const emailError = validateEmail(email);
    if(emailError) found.email = emailError;
    if(!password) found.password = "Enter your password";
    
    setErrors(found);
    if(Object.keys(found).length > 0) return ;

    setSubmitting(true);
    try{
      await login(email.trim(), password);
    } catch (err){
      if(err instanceof ApiError && err.status === 400 && Object.keys(err.fieldErrors).length > 0){
        setErrors(err.fieldErrors);
      }else{
        setFormError(errorMessage(err));
      }
    }finally{
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
                Log in to Bazaar
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Use the role switcher to explore every prototype experience.
              </CardDescription>
              <CardAction className="pt-2"></CardAction>
            </CardHeader>

            <CardContent className="space-y-6 p-0 pt-6">
              {formError && (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" >
                  {formError}
                </p>
              )}
              <div className="grid gap-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-brand-navy"
                >
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
                  required
                  className="h-12 rounded-lg border border-border bg-white text-base placeholder:text-muted-foreground"
                />
                {errors.email && (
                    <p id="email-error" role="alert" className="text-sm text-red-600">
                      {errors.email}
                    </p>
                  )}
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-brand-navy"
                  >
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-sm text-brand-blue hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  className="h-12 rounded-lg border border-border bg-white text-base placeholder:text-muted-foreground"
                />
                {errors.password && (
                    <p id="password-error" role="alert" className="text-sm text-red-600">
                      {errors.password}
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
                {submitting ? "Logging in..." : "Log in"} 
              </Button>

              <p className="text-center text-sm text-muted-foreground pb-4">
                New to Bazaar?{" "}
                <a
                  href="/register"
                  className="font-semibold text-brand-blue hover:underline"
                >
                  Create an account
                </a>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
