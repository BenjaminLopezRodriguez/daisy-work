import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import { WelcomeChoice } from "./welcome-choice";

/** Asked once, right after first sign-in. */
export default async function WelcomePage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  // Already answered — don't ask twice.
  const { choice } = await api.provider.status();
  if (choice === "provide") redirect("/account");
  if (choice === "hire") redirect("/home");

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-medium">Welcome to Daisy.work</h1>
          <p className="text-sm text-muted-foreground">
            What brings you here? You can do both — this just sets up your first
            screen.
          </p>
        </div>
        <WelcomeChoice />
      </div>
    </main>
  );
}
