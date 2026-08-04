import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function AppPage({
  children,
  className,
  width = "app",
}: {
  children: ReactNode;
  className?: string;
  width?: "app" | "form" | "dense" | "profile" | "full";
}) {
  const max =
    width === "form"
      ? "max-w-3xl"
      : width === "dense"
        ? "max-w-[1600px]"
        : width === "profile"
          ? "max-w-6xl"
          : width === "full"
            ? "max-w-none"
            : "max-w-[1440px]";

  return (
    <div
      className={cn(
        "surface-enter-slow mx-auto w-full min-w-0 space-y-8",
        max,
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  action,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** @deprecated use actions */
  action?: ReactNode;
  className?: string;
}) {
  const trailing = actions ?? action;
  return (
    <header
      className={cn(
        "surface-fade flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight break-words text-balance sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground text-pretty sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {trailing ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{trailing}</div>
      ) : null}
    </header>
  );
}
