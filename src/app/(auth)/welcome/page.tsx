import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import { postAuthPath, type OnboardingChoice } from "@/lib/daisy/role";
import { WelcomeChoice } from "./welcome-choice";

function parseIntent(raw: string | undefined): OnboardingChoice | null {
  if (raw === "hire" || raw === "provide") return raw;
  return null;
}

/** Asked once, right after first sign-in — or skipped when intent is in the URL. */
export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string; switch?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const params = await searchParams;
  const intentFromUrl = parseIntent(params.intent);
  const switching = params.switch === "1";

  const status = await api.provider.status();
  const { choice, profile } = status;

  if (!switching && (choice === "hire" || choice === "provide")) {
    redirect(postAuthPath(choice, profile !== null));
  }

  if (intentFromUrl && !switching) {
    await api.provider.setIntent({ choice: intentFromUrl });
    redirect(postAuthPath(intentFromUrl, profile !== null));
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-medium">Welcome to Daisy.work</h1>
          <p className="text-muted-foreground text-sm">
            What brings you here? Workers get a work dashboard; customers get
            the marketplace to post and hire.
          </p>
        </div>
        <WelcomeChoice />
      </div>
    </main>
  );
}
