"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingView() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" className="text-base font-semibold tracking-tight">
          Daisy<span className="text-primary">.work</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/home">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/create">Post a job</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-16 sm:px-6 sm:py-24">
        <section className="space-y-5 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Hire people for real work.
          </h1>
          <p className="mx-auto max-w-xl text-base text-muted-foreground text-pretty sm:text-lg">
            Post a job in plain language. Daisy drafts the listing. Pay when
            the work is done.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="min-h-11">
              <Link href="/create">Post a job</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="min-h-11">
              <Link href="/work">Find work</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-6 text-left sm:grid-cols-3">
          {[
            {
              title: "Describe",
              body: "Tell Daisy what you need in a sentence or two.",
            },
            {
              title: "Review",
              body: "Edit the draft title, budget, and deliverables.",
            },
            {
              title: "Hire",
              body: "Publish the job and pay when you approve the work.",
            },
          ].map((step) => (
            <div key={step.title} className="space-y-2">
              <h2 className="text-sm font-semibold">{step.title}</h2>
              <p className="text-sm text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-4 py-8 text-center text-xs text-muted-foreground sm:px-6">
        © {new Date().getFullYear()} Daisy.work
      </footer>
    </div>
  );
}
