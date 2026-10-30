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

export default function Loginpage() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <LoginCard />

      <div className="flex items-center justify-center bg-background p-6 sm:p-10">
        <Card className="w-full max-w-md border-none bg-transparent shadow-none">
          <CardHeader className="space-y-4 p-0">
            <CardTitle className="text-4xl font-black tracking-[-0.06em] text-brand-navy">
              Log in to Bazaar
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Use the role switcher to explore every prototype experience.
            </CardDescription>
            <CardAction className="pt-2">
              <Button variant="outline" className="text-brand-navy">
                Sign Up
              </Button>
            </CardAction>
          </CardHeader>

          <CardContent className="space-y-6 p-0 pt-6">
            <div className="grid gap-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-brand-navy"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                className="h-12 rounded-lg border border-border bg-white text-base placeholder:text-muted-foreground"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-brand-navy"
                >
                  Password
                </label>
                <a
                  href="#"
                  className="text-sm text-brand-blue hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Your password"
                required
                className="h-12 rounded-lg border border-border bg-white text-base placeholder:text-muted-foreground"
              />
            </div>
          </CardContent>

          <CardFooter className="mt-2 flex-col gap-4 p-0 pt-4">
            <Button className="h-12 w-full bg-brand-navy text-base font-semibold text-white hover:bg-brand-blue">
              Log in
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              New to Bazaar?{" "}
              <a
                href="#"
                className="font-semibold text-brand-blue hover:underline"
              >
                Create an account
              </a>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
