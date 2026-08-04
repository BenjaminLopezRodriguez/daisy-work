"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";

import {
  AppPage,
  EmptyState,
  PageHeader,
  WorkOrderCard,
} from "@/components/daisy";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { seedWorkOrders, seedUsers, seedWorkerProfiles } from "@/server/mocks/seed";
import { WorkerSummary } from "@/components/daisy";

export default function SavedPage() {
  const [tab, setTab] = useState("work");

  const savedWork = useMemo(
    () => seedWorkOrders.filter((w) => w.status !== "draft").slice(0, 3),
    [],
  );
  const savedWorkers = useMemo(() => {
    return seedWorkerProfiles.slice(0, 2).map((profile) => {
      const user = seedUsers.find((u) => u.id === profile.userId);
      return { profile, name: user?.name ?? "Worker" };
    });
  }, []);

  return (
    <AppPage>
      <PageHeader
        title="Saved"
        description="Work Orders, people, and searches you want to revisit."
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="work">Work</TabsTrigger>
          <TabsTrigger value="workers">Workers</TabsTrigger>
          <TabsTrigger value="searches">Searches</TabsTrigger>
        </TabsList>

        <TabsContent value="work" className="space-y-3">
          {savedWork.length === 0 ? (
            <EmptyState
              title="Nothing saved yet"
              description="Save published jobs from the work list so you can reopen them quickly."
              icon={Bookmark}
              action={
                <Button asChild>
                  <Link href="/work">Browse work</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {savedWork.map((wo) => (
                <WorkOrderCard
                  key={wo.id}
                  workOrder={wo}
                  href={`/work/${wo.id}`}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="workers" className="space-y-3">
          {savedWorkers.map(({ profile, name }) => (
            <div
              key={profile.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <WorkerSummary profile={profile} name={name} />
              <Button asChild size="sm" variant="outline" className="mt-3">
                <Link href={`/profile/${profile.userId}`}>View profile</Link>
              </Button>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="searches">
          <EmptyState
            title="No saved searches"
            description="When you save a filter set from Work, it will appear here for one-tap reuse."
            icon={Bookmark}
            action={
              <Button asChild variant="outline">
                <Link href="/work">Open work filters</Link>
              </Button>
            }
          />
        </TabsContent>
      </Tabs>
    </AppPage>
  );
}
