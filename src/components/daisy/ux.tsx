"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

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
          <span className="text-destructive ml-1" aria-hidden>
            *
          </span>
        ) : null}
        {optional ? (
          <span className="text-muted-foreground ml-1.5 text-xs font-normal">
            Optional
          </span>
        ) : null}
        {required ? <span className="sr-only"> (required)</span> : null}
      </Label>
      <div
        className="[&_[data-slot=select-trigger]]:min-h-11 [&_[data-slot=select-trigger]]:w-full [&_input]:min-h-11 [&_textarea]:min-h-[7.5rem]"
        {...(describedBy ? { "data-describedby": describedBy } : {})}
      >
        {children}
      </div>
      {helper && !error ? (
        <p id={`${id}-helper`} className="text-muted-foreground text-sm">
          {helper}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </div>
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
        <p className="text-muted-foreground tabular-nums">{pct}%</p>
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
                  "ring-background flex size-8 items-center justify-center rounded-full text-xs font-semibold tabular-nums ring-2 transition-[background-color,color,transform] duration-200 ease-out",
                  current && "bg-primary text-primary-foreground scale-105",
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
                    ? "text-foreground font-medium"
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
