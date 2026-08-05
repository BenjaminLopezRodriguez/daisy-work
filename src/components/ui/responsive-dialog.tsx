"use client";

import type { ComponentProps } from "react";

import * as D from "@/components/ui/dialog";
import * as Dr from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

/**
 * A dialog on desktop, a bottom drawer below 768px.
 *
 * Centred dialogs are the wrong primitive on a phone: a tall one is taller than
 * the viewport, and because it is centred with a -50% translate, the overflow
 * goes off the *top* of the screen where nothing can scroll it back. A drawer
 * is anchored to the bottom edge, so it can only ever grow toward the thumb.
 *
 * Exports are named after the dialog parts so a call site switches by changing
 * one import line.
 */

export function Dialog(props: ComponentProps<typeof D.Dialog>) {
  const isMobile = useIsMobile();
  return isMobile ? <Dr.Drawer {...props} /> : <D.Dialog {...props} />;
}

export function DialogTrigger(props: ComponentProps<typeof D.DialogTrigger>) {
  const isMobile = useIsMobile();
  return isMobile ? (
    <Dr.DrawerTrigger {...props} />
  ) : (
    <D.DialogTrigger {...props} />
  );
}

export function DialogClose(props: ComponentProps<typeof D.DialogClose>) {
  const isMobile = useIsMobile();
  return isMobile ? (
    <Dr.DrawerClose {...props} />
  ) : (
    <D.DialogClose {...props} />
  );
}

export function DialogContent({
  className,
  children,
  ...props
}: ComponentProps<typeof D.DialogContent>) {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      // `className` is deliberately dropped: it carries desktop width caps
      // (`sm:max-w-md`) that would squeeze a full-width drawer at 640–767px.
      <Dr.DrawerContent
        {...props}
        className="max-h-[90dvh] pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="overflow-y-auto px-4 pb-4">{children}</div>
      </Dr.DrawerContent>
    );
  }
  return (
    <D.DialogContent className={className} {...props}>
      {children}
    </D.DialogContent>
  );
}

export function DialogHeader({
  className,
  ...props
}: ComponentProps<typeof D.DialogHeader>) {
  const isMobile = useIsMobile();
  return isMobile ? (
    <Dr.DrawerHeader className={cn("px-0 text-left", className)} {...props} />
  ) : (
    <D.DialogHeader className={className} {...props} />
  );
}

export function DialogFooter({
  className,
  ...props
}: ComponentProps<typeof D.DialogFooter>) {
  const isMobile = useIsMobile();
  return isMobile ? (
    // Full-width stacked buttons, thumb-sized, in the drawer's own footer.
    <Dr.DrawerFooter
      className={cn("flex-col gap-2 px-0 [&_button]:min-h-11", className)}
      {...props}
    />
  ) : (
    <D.DialogFooter className={className} {...props} />
  );
}

export function DialogTitle(props: ComponentProps<typeof D.DialogTitle>) {
  const isMobile = useIsMobile();
  return isMobile ? (
    <Dr.DrawerTitle {...props} />
  ) : (
    <D.DialogTitle {...props} />
  );
}

export function DialogDescription(
  props: ComponentProps<typeof D.DialogDescription>,
) {
  const isMobile = useIsMobile();
  return isMobile ? (
    <Dr.DrawerDescription {...props} />
  ) : (
    <D.DialogDescription {...props} />
  );
}
