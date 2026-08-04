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

export function PageSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn("space-y-3", className)}>{children}</section>;
}

export function SectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-3",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function ContentGrid({
  children,
  className,
  cols = 2,
}: {
  children: ReactNode;
  className?: string;
  cols?: 2 | 3 | 4;
}) {
  return (
    <div
      className={cn(
        "grid min-w-0 gap-3",
        cols === 2 && "grid-cols-2",
        cols === 3 && "grid-cols-2 lg:grid-cols-3",
        cols === 4 && "grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DetailRail({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "hidden min-w-0 space-y-4 lg:block lg:w-72 xl:w-80 shrink-0",
        className,
      )}
    >
      {children}
    </aside>
  );
}

export function MobileStickyActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom,0px))] z-[var(--app-z-sticky)] border-t border-border bg-card/95 px-4 py-3 backdrop-blur md:static md:bottom-auto md:z-auto md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none",
        className,
      )}
    >
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2">
        {children}
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-xl border border-border bg-card px-3 py-3 shadow-sm sm:px-4",
        className,
      )}
    >
      <p className="truncate text-xs font-medium text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums tracking-tight sm:text-xl">
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function WorkCardGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid min-w-0 gap-3 sm:gap-4",
        "grid-cols-1",
        "min-[720px]:grid-cols-2",
        "xl:grid-cols-2 2xl:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}
