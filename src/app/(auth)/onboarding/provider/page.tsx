import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import { ProviderProfileForm } from "./provider-profile-form";

export default async function ProviderOnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const { profile } = await api.provider.status();

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6 sm:py-16">
      <div className="space-y-1">
        <h1 className="text-xl font-medium">
          {profile ? "Edit your profile" : "Set up your provider profile"}
        </h1>
        <p className="text-sm text-muted-foreground">
          This is what people see when you apply to their job. You can change it
          any time.
        </p>
      </div>
      <ProviderProfileForm
        initial={
          profile
            ? {
                headline: profile.headline,
                biography: profile.biography,
                serviceAreas: profile.serviceAreas,
                workModes: profile.workModes,
                hourlyRateCents: profile.hourlyRate,
                location: profile.location ?? "",
              }
            : null
        }
      />
    </main>
  );
}
