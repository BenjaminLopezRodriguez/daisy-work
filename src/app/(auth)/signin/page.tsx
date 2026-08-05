import { redirect } from "next/navigation";
import { Briefcase, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { auth, signIn } from "@/server/auth";
import { api } from "@/trpc/server";
import { postAuthPath } from "@/lib/daisy/role";

/** Only same-origin paths may be returned to. */
function safeNext(next: string | undefined): string | null {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNext((await searchParams).next);

  async function signInAsWorker() {
    "use server";
    await signIn("google", { redirectTo: next ?? "/welcome?intent=provide" });
  }

  async function signInAsCustomer() {
    "use server";
    await signIn("google", { redirectTo: next ?? "/welcome?intent=hire" });
  }

  const session = await auth();
  if (session?.user) {
    if (next) redirect(next);
    const { choice, profile } = await api.provider.status();
    if (choice === "hire" || choice === "provide") {
      redirect(postAuthPath(choice, profile !== null));
    }
    redirect("/welcome");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-medium">Sign in to Daisy.work</h1>
          <p className="text-sm text-muted-foreground">
            Pick how you&apos;re using Daisy today.
          </p>
        </div>

        <div className="space-y-3">
          <form action={signInAsWorker}>
            <Button
              type="submit"
              variant="outline"
              className="h-auto w-full justify-start gap-3 px-4 py-3 text-left"
            >
              <Wrench className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">Find work</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Browse jobs, apply, and manage your work dashboard.
                </span>
              </span>
            </Button>
          </form>

          <form action={signInAsCustomer}>
            <Button
              type="submit"
              className="h-auto w-full justify-start gap-3 px-4 py-3 text-left"
            >
              <Briefcase className="size-5 shrink-0 opacity-90" aria-hidden />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">Hire someone</span>
                <span className="mt-0.5 block text-xs opacity-90">
                  Post jobs, browse the marketplace, and pick who does the work.
                </span>
              </span>
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
