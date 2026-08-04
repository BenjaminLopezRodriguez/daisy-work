"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { toast } from "sonner";

import { AppPage, EmptyState, PageHeader } from "@/components/daisy";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type InboxKind = "message" | "invite" | "alert";

type InboxItem = {
  id: string;
  kind: InboxKind;
  from: string;
  subject: string;
  preview: string;
  body: string;
  unread: boolean;
  createdAt: string;
};

const MOCK_INBOX: InboxItem[] = [
  {
    id: "in_1",
    kind: "alert",
    from: "Daisy",
    subject: "Submission ready for review",
    preview: "Storefront photo evidence needs your decision.",
    body: "Maya Chen submitted photo evidence. Approve, request changes, or open the Work Order.",
    unread: true,
    createdAt: "Today",
  },
  {
    id: "in_2",
    kind: "invite",
    from: "Northline Retail",
    subject: "Assignment invite",
    preview: "You’re invited to a panel inspection job.",
    body: "Review requirements and accept or decline from Work.",
    unread: true,
    createdAt: "Yesterday",
  },
  {
    id: "in_3",
    kind: "message",
    from: "Jordan Lee",
    subject: "Clarifying entrance photos",
    preview: "Do alley doors count as public entrances?",
    body: "Before I reshoot, can you confirm whether alley service doors count?",
    unread: false,
    createdAt: "Mon",
  },
];

function filterByTab(items: InboxItem[], tab: string) {
  if (tab === "all") return items;
  if (tab === "messages") return items.filter((i) => i.kind === "message");
  if (tab === "invites") return items.filter((i) => i.kind === "invite");
  return items.filter((i) => i.kind === "alert");
}

export default function InboxPage() {
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(MOCK_INBOX[0]?.id ?? "");
  const [reply, setReply] = useState("");

  const filtered = useMemo(() => {
    let list = filterByTab(MOCK_INBOX, tab);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (i) =>
          i.subject.toLowerCase().includes(q) ||
          i.from.toLowerCase().includes(q),
      );
    }
    return list;
  }, [tab, query]);

  const selected =
    filtered.find((i) => i.id === selectedId) ?? filtered[0] ?? null;

  return (
    <AppPage width="form" className="max-w-3xl">
      <PageHeader
        title="Inbox"
        description="Messages, invites, and updates."
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <TabsList className="overflow-x-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="invites">Requests</TabsTrigger>
            <TabsTrigger value="alerts">Updates</TabsTrigger>
          </TabsList>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="min-h-11 sm:max-w-xs"
            aria-label="Search inbox"
          />
        </div>

        <TabsContent value={tab} className="mt-0">
          {filtered.length === 0 ? (
            <EmptyState
              title="Nothing here"
              description="When people reply or invite you, it shows up here."
              icon={Inbox}
              action={
                <Button asChild variant="outline">
                  <Link href="/work">Browse work</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:grid-cols-[minmax(14rem,18rem)_minmax(0,1fr)]">
              <ul className="list-stagger divide-y divide-border border-b lg:border-r lg:border-b-0">
                {filtered.map((item) => {
                  const active = selected?.id === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        className={cn(
                          "surface-interactive flex w-full min-h-14 gap-3 px-4 py-3 text-left outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring",
                          active && "bg-muted/60",
                        )}
                      >
                        <Avatar className="size-9">
                          <AvatarFallback>
                            {item.from.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {item.subject}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {item.from} · {item.createdAt}
                          </p>
                        </div>
                        {item.unread ? <Badge>New</Badge> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="surface-fade flex min-h-[16rem] flex-col p-4 sm:p-5">
                {selected ? (
                  <>
                    <div className="space-y-2">
                      <h2 className="text-lg font-semibold tracking-tight">
                        {selected.subject}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        From {selected.from}
                      </p>
                      <Separator />
                      <p className="text-sm text-pretty">{selected.body}</p>
                    </div>
                    {selected.kind === "message" ? (
                      <div className="mt-auto space-y-2 border-t border-border pt-4">
                        <Textarea
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          placeholder="Write a reply…"
                          className="min-h-20"
                          aria-label="Reply"
                        />
                        <Button
                          type="button"
                          className="min-h-11"
                          disabled={reply.trim().length === 0}
                          onClick={() => {
                            toast.success("Reply sent", {
                              description: "Messaging is mocked in this demo.",
                            });
                            setReply("");
                          }}
                        >
                          Reply
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-auto pt-4">
                        <Button asChild className="min-h-11">
                          <Link href="/work">Open related work</Link>
                        </Button>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppPage>
  );
}
