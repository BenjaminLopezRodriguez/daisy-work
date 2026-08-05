"use client";

import { useRouter } from "next/navigation";
import { Briefcase, Wrench } from "lucide-react";

import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  {
    choice: "hire" as const,
    icon: Briefcase,
    title: "I need something done",
    body: "Marketplace to post jobs, browse talent, and hire.",
  },
  {
    choice: "provide" as const,
    icon: Wrench,
    title: "I want to find work",
    body: "Work dashboard to browse open jobs and track applications.",
  },
];

export function WelcomeChoice() {
  const router = useRouter();
  const { data: status } = api.provider.status.useQuery();
  const setIntent = api.provider.setIntent.useMutation({
    onSuccess: ({ choice }) => {
      if (choice === "provide") {
        router.push(status?.profile ? "/work" : "/onboarding/provider");
      } else {
        router.push("/home");
      }
      router.refresh();
    },
  });

  return (
    <div className="space-y-3">
      {OPTIONS.map(({ choice, icon: Icon, title, body }) => (
        <button
          key={choice}
          type="button"
          disabled={setIntent.isPending}
          onClick={() => setIntent.mutate({ choice })}
          className={cn(
            "flex w-full items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors",
            "hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            "disabled:pointer-events-none disabled:opacity-60",
          )}
        >
          <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0">
            <span className="block text-sm font-semibold">{title}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {body}
            </span>
          </span>
        </button>
      ))}

      {setIntent.error ? (
        <p role="alert" className="text-center text-xs text-destructive">
          Couldn’t save that. Try again.
        </p>
      ) : null}
    </div>
  );
}
