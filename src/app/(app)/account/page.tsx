"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

import { AppPage, PageHeader } from "@/components/daisy";
import { Button } from "@/components/ui/button";
import { useAppSession } from "@/lib/daisy/session";

export default function AccountPage() {
  const { currentUser } = useAppSession();

  return (
    <AppPage width="form" className="max-w-xl space-y-6">
      <PageHeader title="Account" description="You’re signed in as:" />
      <div className="rounded-xl border border-border bg-card p-4 text-sm">
        <p className="font-medium">{currentUser.name}</p>
        <p className="mt-1 text-muted-foreground">{currentUser.email}</p>
      </div>
      <Button asChild variant="outline" className="min-h-11">
        <Link href="/work">Your jobs</Link>
      </Button>
      <Button
        variant="outline"
        className="min-h-11 w-full"
        onClick={() => void signOut({ redirectTo: "/signin" })}
      >
        Sign out
      </Button>
    </AppPage>
  );
}
