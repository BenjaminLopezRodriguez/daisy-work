"use client";

import { useRouter } from "next/navigation";
import { Briefcase, Wrench } from "lucide-react";

import { api } from "@/trpc/react";
import { postAuthPath } from "@/lib/daisy/role";
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
      router.push(postAuthPath(choice, Boolean(status?.profile)));
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
            "border-border bg-card flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors",
            "hover:bg-muted/50 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
            "disabled:pointer-events-none disabled:opacity-60",
          )}
        >
          <Icon
            className="text-muted-foreground mt-0.5 size-5 shrink-0"
            aria-hidden
          />
          <span className="min-w-0">
            <span className="block text-sm font-semibold">{title}</span>
            <span className="text-muted-foreground mt-0.5 block text-xs">
              {body}
            </span>
          </span>
        </button>
      ))}

      {setIntent.error ? (
        <p role="alert" className="text-destructive text-center text-xs">
          Couldn’t save that. Try again.
        </p>
      ) : null}
    </div>
  );
}
