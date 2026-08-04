"use client";

import Link from "next/link";
import {
  BadgeCheck,
  Camera,
  ClipboardCheck,
  FileSearch,
  Hammer,
  Lock,
  MapPin,
  Menu,
  Shield,
  Sparkles,
  Wallet,
} from "lucide-react";

import {
  RiskLevelBadge,
  WorkStatusBadge,
  VerificationBadge,
} from "@/components/daisy";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatMoney, RiskLevel, WorkOrderStatus } from "@/domain";
import { LandingRib } from "./landing.rib";

const previewWork = {
  title: "Verify storefront operating hours",
  risk: RiskLevel.L1,
  status: WorkOrderStatus.Published,
  amount: 2400,
  currency: "USD",
};

export function LandingView() {
  const vm = LandingRib.useViewModel();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            Daisy<span className="text-primary">.work</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <Link href="/work" className="hover:text-primary">
              Find work
            </Link>
            <Link href="/create" className="hover:text-primary">
              Hire
            </Link>
            <a href="#how-it-works" className="hover:text-primary">
              How it works
            </a>
            <a href="#safety" className="hover:text-primary">
              Safety
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden min-h-11 sm:inline-flex"
            >
              <Link href={vm.homeHref}>Sign in</Link>
            </Button>
            <Button asChild size="sm" className="hidden min-h-11 sm:inline-flex">
              <Link href={vm.primaryHref}>Post work</Link>
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-11 md:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="flex flex-col gap-4">
                <SheetHeader className="text-left">
                  <SheetTitle>
                    Daisy<span className="text-primary">.work</span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1">
                  {[
                    { href: "/work", label: "Find work" },
                    { href: "/create", label: "Hire" },
                    { href: "#how-it-works", label: "How it works" },
                    { href: "#safety", label: "Safety" },
                    { href: vm.homeHref, label: "Sign in" },
                  ].map((item) => (
                    <SheetClose asChild key={item.label}>
                      <Link
                        href={item.href}
                        className="flex min-h-12 items-center rounded-lg px-3 text-sm font-medium hover:bg-muted"
                      >
                        {item.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
                <SheetClose asChild>
                  <Button asChild className="min-h-12 w-full">
                    <Link href={vm.primaryHref}>Post work</Link>
                  </Button>
                </SheetClose>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-2 md:items-center md:px-6 md:py-20">
            <div className="space-y-6">
              <p className="text-sm font-semibold tracking-[0.12em] text-primary uppercase">
                Work coordination infrastructure
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl lg:text-6xl">
                Work, properly coordinated.
              </h1>
              <p className="max-w-xl text-base text-muted-foreground text-pretty sm:text-lg">
                Daisy helps people, businesses, and agents assign work, verify
                that it was completed, and pay under rules that match the job.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button asChild size="lg" className="min-h-12 w-full sm:w-auto">
                  <Link href={vm.primaryHref}>Post work</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="min-h-12 w-full sm:w-auto"
                >
                  <Link href={vm.secondaryHref}>Find work</Link>
                </Button>
              </div>
            </div>

            <article className="rounded-2xl border border-border bg-card p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Work Order preview
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight">
                    {previewWork.title}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <RiskLevelBadge level={previewWork.risk} />
                  <WorkStatusBadge status={previewWork.status} />
                </div>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">Payment</dt>
                  <dd className="font-semibold tabular-nums">
                    {formatMoney(previewWork.amount)} fixed
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Evidence</dt>
                  <dd className="font-semibold">3 photos required</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Location</dt>
                  <dd className="font-semibold">Verified locality</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Time</dt>
                  <dd className="font-semibold tabular-nums">~20 minutes</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Governance</dt>
                  <dd className="font-semibold">
                    Low-risk digital/field verification
                  </dd>
                </div>
              </dl>
              <Button asChild className="mt-5">
                <Link href="/work/wo_storefront_photo">View work</Link>
              </Button>
            </article>
          </div>
        </section>

        <section className="border-b border-border bg-card">
          <div className="mx-auto flex max-w-6xl flex-wrap gap-x-8 gap-y-4 px-4 py-8 md:px-6">
            {[
              { icon: BadgeCheck, label: "Verified identities" },
              { icon: Shield, label: "Credential-aware assignments" },
              { icon: Camera, label: "Structured evidence" },
              { icon: Wallet, label: "Protected payments" },
              { icon: ClipboardCheck, label: "Auditable decisions" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex min-w-[10rem] flex-1 items-center gap-2 text-sm font-medium"
              >
                <item.icon className="size-4 text-primary" aria-hidden />
                {item.label}
              </div>
            ))}
          </div>
        </section>

        <section className="border-b border-border px-4 py-16 md:px-6">
          <div className="mx-auto max-w-6xl space-y-10">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                One platform, many kinds of work
              </h2>
              <p className="max-w-2xl text-muted-foreground">
                Daisy applies the right level of verification, contracting, and
                oversight for the work being performed.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {(
                [
                  {
                    title: "Digital tasks",
                    risk: RiskLevel.L1,
                    body: "Photos, data entry, and lightweight checks with basic identity, clear deliverables, and fast payout.",
                  },
                  {
                    title: "Professional projects",
                    risk: RiskLevel.L2,
                    body: "Design, research, and skilled remote work with milestones, revision policy, and escrow-style authorization.",
                  },
                  {
                    title: "Local services",
                    risk: RiskLevel.L3,
                    body: "Cleaning, delivery, and field visits with location, scheduling, and before-and-after evidence.",
                  },
                  {
                    title: "Regulated work",
                    risk: RiskLevel.L4,
                    body: "Licensed trades with credentials, insurance, signed scope, change orders, and human review when needed.",
                  },
                ] as const
              ).map((card) => (
                <article
                  key={card.title}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xl font-semibold">{card.title}</h3>
                    <RiskLevelBadge level={card.risk} />
                  </div>
                  <p className="mt-3 text-muted-foreground text-pretty">
                    {card.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="border-b border-border bg-card px-4 py-16 md:px-6"
        >
          <div className="mx-auto max-w-6xl space-y-10">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              From request to completion
            </h2>
            <ol className="grid gap-4 md:grid-cols-4">
              {[
                {
                  step: "1",
                  title: "Describe the work",
                  body: "Say what needs doing in plain language.",
                },
                {
                  step: "2",
                  title: "Daisy structures requirements",
                  body: "Risk, credentials, and evidence are proposed for edit.",
                },
                {
                  step: "3",
                  title: "A person or agent completes it",
                  body: "Assignees work under explicit permissions and scope.",
                },
                {
                  step: "4",
                  title: "Evidence reviewed, payment released",
                  body: "Acceptance rules decide when funds can move.",
                },
              ].map((item) => (
                <li
                  key={item.step}
                  className="rounded-2xl border border-border bg-background p-5"
                >
                  <p className="text-sm font-semibold text-primary">
                    Step {item.step}
                  </p>
                  <h3 className="mt-2 font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="safety"
          className="border-b border-border px-4 py-16 md:px-6"
        >
          <div className="mx-auto max-w-6xl space-y-10">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Simple when it can be. Rigorous when it must be.
              </h2>
              <p className="max-w-2xl text-muted-foreground">
                Governance strengthens as risk increases — without forcing every
                job through the same workflow.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <article className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-2">
                  <Camera className="size-5 text-primary" aria-hidden />
                  <h3 className="text-lg font-semibold">Photo verification</h3>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li>Basic identity</li>
                  <li>Three geotagged photos</li>
                  <li>Automated evidence checks (mocked)</li>
                  <li>Fast approval</li>
                </ul>
              </article>
              <article className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-2">
                  <Hammer className="size-5 text-primary" aria-hidden />
                  <h3 className="text-lg font-semibold">
                    Electrical installation
                  </h3>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li>Verified contractor identity</li>
                  <li>Relevant active license</li>
                  <li>Insurance evidence</li>
                  <li>Signed scope and milestone review</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-card px-4 py-16 md:px-6">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
                Agents
              </p>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Agents can send work. Daisy keeps them accountable.
              </h2>
              <p className="max-w-2xl text-muted-foreground">
                Agents receive explicit permissions. Every important action is
                logged. High-impact decisions can require human review. Workers
                can understand why requirements were imposed.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Lock, label: "Explicit permissions" },
                { icon: FileSearch, label: "Auditable actions" },
                { icon: Sparkles, label: "Human review gates" },
                { icon: MapPin, label: "Explainable requirements" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 text-sm font-medium"
                >
                  <item.icon className="size-4 text-primary" aria-hidden />
                  {item.label}
                </div>
              ))}
            </div>
            <VerificationBadge label="Agents assist — humans decide" />
          </div>
        </section>

        <section className="px-4 py-16 md:px-6">
          <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-primary px-6 py-12 text-primary-foreground md:px-10">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              Give work a clear path from request to completion.
            </h2>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="bg-card text-foreground hover:bg-card/90"
              >
                <Link href={vm.primaryHref}>Post work</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link href={vm.secondaryHref}>Explore work</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer id="footer" className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-6 md:px-6">
          <div className="md:col-span-2">
            <p className="text-lg font-semibold">
              Daisy<span className="text-primary">.work</span>
            </p>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Infrastructure for assigning, governing, completing, verifying,
              and paying for work.
            </p>
          </div>
          {[
            { title: "Product", links: ["Work Orders", "Governance", "Payments"] },
            { title: "Company", links: ["About", "Careers", "Contact"] },
            {
              title: "Trust and safety",
              links: ["Safety", "Credentials", "Disputes"],
            },
            { title: "Legal", links: ["Terms", "Privacy", "Cookies"] },
            { title: "Developers", links: ["API", "Agents", "Status"] },
          ].map((group) => (
            <div key={group.title}>
              <p className="text-sm font-semibold">{group.title}</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {group.links.map((link) => (
                  <li key={link}>{link}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground md:px-6">
          Accessibility · Mock verification disclaimers apply to this preview
          build.
        </div>
      </footer>
    </div>
  );
}
