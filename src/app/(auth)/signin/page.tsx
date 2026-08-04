import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { auth, signIn } from "@/server/auth";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect("/welcome");

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-1">
          <h1 className="text-xl font-medium">Sign in to Daisy.work</h1>
          <p className="text-sm text-muted-foreground">
            Post work, hire, and get paid.
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            // /welcome asks the one onboarding question, then routes onward.
            await signIn("google", { redirectTo: "/welcome" });
          }}
        >
          <Button type="submit" className="w-full">
            Continue with Google
          </Button>
        </form>
      </div>
    </main>
  );
}
