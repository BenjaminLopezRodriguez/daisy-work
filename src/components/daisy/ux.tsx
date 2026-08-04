"use client";

import { AlertCircle, Check, CheckCircle2, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/** Async / interaction feedback states (Doherty Threshold). */
export type ActionStatus =
  | "idle"
  | "loading"
  | "saving"
  | "saved"
  | "succeeded"
  | "failed"
  | "needs_attention";

const STATUS_COPY: Record<
  Exclude<ActionStatus, "idle">,
  { label: string; tone: string }
> = {
  loading: {
    label: "Working…",
    tone: "border-border bg-muted text-muted-foreground",
  },
  saving: {
    label: "Saving…",
    tone: "border-border bg-muted text-muted-foreground",
  },
  saved: {
    label: "Saved",
    tone: "border-primary/30 bg-primary/10 text-primary",
  },
  succeeded: {
    label: "Succeeded",
    tone: "border-primary/30 bg-primary/10 text-primary",
  },
  failed: {
    label: "Something went wrong",
    tone: "border-destructive/40 bg-destructive/10 text-destructive",
  },
  needs_attention: {
    label: "Needs attention",
    tone: "border-accent/50 bg-accent/30 text-accent-foreground",
  },
};

export function ActionStatusBanner({
  status,
  message,
  className,
}: {
  status: ActionStatus;
  message?: string;
  className?: string;
}) {
  if (status === "idle") return null;
  const meta = STATUS_COPY[status];
  const showSpinner = status === "loading" || status === "saving";
  const showOk = status === "saved" || status === "succeeded";
  const showErr = status === "failed" || status === "needs_attention";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm",
        meta.tone,
        className,
      )}
    >
      {showSpinner ? (
        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
      ) : null}
      {showOk ? (
        <CheckCircle2 className="size-4 shrink-0" aria-hidden />
      ) : null}
      {showErr ? (
        <AlertCircle className="size-4 shrink-0" aria-hidden />
      ) : null}
      <span>{message ?? meta.label}</span>
    </div>
  );
}

/** Label-above field with helper / error beside the control. */
export function FormField({
  id,
  label,
  required,
  optional,
  helper,
  error,
  children,
  className,
}: {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  helper?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  const describedBy = [
    helper ? `${id}-helper` : null,
    error ? `${id}-error` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? (
          <span className="ml-1 text-destructive" aria-hidden>
            *
          </span>
        ) : null}
        {optional ? (
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
            Optional
          </span>
        ) : null}
        {required ? <span className="sr-only"> (required)</span> : null}
      </Label>
      <div
        className="[&_input]:min-h-11 [&_textarea]:min-h-[7.5rem] [&_[data-slot=select-trigger]]:min-h-11 [&_[data-slot=select-trigger]]:w-full"
        {...(describedBy ? { "data-describedby": describedBy } : {})}
      >
        {children}
      </div>
      {helper && !error ? (
        <p id={`${id}-helper`} className="text-sm text-muted-foreground">
          {helper}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Visible reason when a primary action is disabled. */
export function DisabledReason({
  show,
  children,
}: {
  show: boolean;
  children: ReactNode;
}) {
  if (!show) return null;
  return (
    <p className="text-sm text-muted-foreground" role="status">
      {children}
    </p>
  );
}

/** Single primary action cluster — one primary emphasis per decision area. */
export function ActionCluster({
  primary,
  secondary,
  tertiary,
  destructive,
  className,
}: {
  primary?: ReactNode;
  secondary?: ReactNode;
  tertiary?: ReactNode;
  destructive?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center",
        className,
      )}
    >
      {primary}
      {secondary}
      {tertiary}
      {destructive ? (
        <div className="sm:ml-auto sm:border-l sm:border-border sm:pl-3">
          {destructive}
        </div>
      ) : null}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground text-pretty md:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </header>
  );
}

export function StepProgress({
  steps,
  currentIndex,
}: {
  steps: readonly string[];
  currentIndex: number;
}) {
  const pct = Math.round(((currentIndex + 1) / steps.length) * 100);
  const currentLabel = steps[currentIndex] ?? "";

  return (
    <div className="surface-fade space-y-3" aria-label="Progress">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <p className="font-medium">
          Step {currentIndex + 1} of {steps.length}
          <span className="text-muted-foreground"> · {currentLabel}</span>
        </p>
        <p className="tabular-nums text-muted-foreground">{pct}%</p>
      </div>

      <Progress value={pct} className="h-2" aria-label={`Progress ${pct}%`} />

      <ol className="flex items-start justify-between gap-1">
        {steps.map((label, i) => {
          const current = i === currentIndex;
          const done = i < currentIndex;
          return (
            <li
              key={label}
              className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
              aria-current={current ? "step" : undefined}
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-xs font-semibold tabular-nums ring-2 ring-background transition-[background-color,color,transform] duration-200 ease-out",
                  current && "scale-105 bg-primary text-primary-foreground",
                  done && !current && "bg-primary/15 text-primary",
                  !current && !done && "bg-muted text-muted-foreground",
                )}
              >
                {done && !current ? (
                  <Check className="size-4" aria-hidden />
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={cn(
                  "hidden max-w-full truncate text-center text-[11px] sm:block",
                  current
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
