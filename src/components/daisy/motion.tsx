import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Page-level enter: soft fade + slight rise. */
export function MotionPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("surface-enter-slow", className)}>{children}</div>;
}

/** Card / panel surface with hover transition. */
export function MotionSurface({
  children,
  className,
  as: Comp = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside";
}) {
  return (
    <Comp className={cn("surface-enter surface-interactive", className)}>
      {children}
    </Comp>
  );
}

/** Staggered list wrapper for calm row entrance. */
export function MotionList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ul className={cn("list-stagger divide-y divide-border", className)}>
      {children}
    </ul>
  );
}
