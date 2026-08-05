"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  title: string;
  body: string;
  href: string;
  createdAt: Date;
};

function NotificationList({
  items,
  loading,
  onNavigate,
}: {
  items: Notification[];
  loading: boolean;
  onNavigate: () => void;
}) {
  if (loading) {
    return (
      <ul className="divide-border divide-y" aria-busy>
        {[0, 1, 2].map((i) => (
          <li key={i} className="space-y-2 px-4 py-3">
            <div className="bg-muted h-3.5 w-2/3 animate-pulse rounded" />
            <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
          </li>
        ))}
      </ul>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground px-4 py-8 text-center text-sm">
        Nothing yet. Applications, requests and updates land here.
      </p>
    );
  }

  return (
    <ul className="divide-border divide-y">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={item.href}
            onClick={onNavigate}
            className="hover:bg-muted/50 focus-visible:ring-nav-focus block min-h-14 px-4 py-3 focus-visible:ring-2 focus-visible:outline-none"
          >
            <p className="text-sm font-medium">{item.title}</p>
            {item.body ? (
              <p className="text-muted-foreground mt-0.5 text-xs">
                {item.body}
              </p>
            ) : null}
            <p className="text-muted-foreground mt-1 text-[0.6875rem]">
              {formatDistanceToNow(item.createdAt, { addSuffix: true })}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * Bell beside the avatar. Opening it marks everything read — the badge answers
 * "is there anything new", and looking is the answer. (§5.5, badge never pulses)
 */
export function NotificationBell({ className }: { className?: string }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const utils = api.useUtils();

  const unread = api.notification.unreadCount.useQuery(undefined, {
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  const list = api.notification.list.useQuery(undefined, { enabled: open });
  const markAllRead = api.notification.markAllRead.useMutation({
    onSuccess: () => utils.notification.unreadCount.invalidate(),
  });

  const count = unread.data ?? 0;

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next && count > 0) markAllRead.mutate();
  }

  const trigger = (
    <button
      type="button"
      aria-label={
        count > 0 ? `Notifications, ${count} unread` : "Notifications"
      }
      className={cn(
        "text-nav-ink hover:bg-sidebar-accent focus-visible:ring-nav-focus relative flex size-11 shrink-0 items-center justify-center rounded-md outline-none focus-visible:ring-2",
        className,
      )}
    >
      <Bell className="size-5" aria-hidden />
      {count > 0 ? (
        <span
          aria-hidden
          className="bg-nav-active absolute top-2 right-2 size-1.5 rounded-full"
        />
      ) : null}
    </button>
  );

  const body = (
    <NotificationList
      items={list.data ?? []}
      loading={list.isPending}
      onNavigate={() => setOpen(false)}
    />
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="max-h-[85dvh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>Notifications</DrawerTitle>
            <DrawerDescription className="sr-only">
              Recent activity on your requests and listings
            </DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto pb-[env(safe-area-inset-bottom,0px)]">
            {body}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        className="max-h-[70dvh] w-80 overflow-y-auto p-0"
      >
        <p className="border-border border-b px-4 py-3 text-sm font-semibold">
          Notifications
        </p>
        {body}
      </PopoverContent>
    </Popover>
  );
}
