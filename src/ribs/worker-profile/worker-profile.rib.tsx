"use client";

import { createRib, useRibLifecycle } from "nextjs-ribs";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

import {
  AppPage,
  CredentialCard,
  PageSection,
  SectionHeading,
  StatCard,
} from "@/components/daisy";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppSession } from "@/lib/daisy/session";
import {
  MAYA_USER_ID,
  MAYA_WORKER_PROFILE_ID,
  seedCredentials,
  seedUsers,
  seedWorkerProfiles,
  seedWorkOrders,
} from "@/server/mocks/seed";

export const WorkerProfileRib = createRib({
  name: "WorkerProfile",
  interactor: (deps: { userId: string }) => {
    useRibLifecycle({});
    const user =
      seedUsers.find((u) => u.id === deps.userId) ??
      seedUsers.find((u) => u.id === MAYA_USER_ID)!;
    const profile =
      seedWorkerProfiles.find((p) => p.userId === user.id) ??
      seedWorkerProfiles.find((p) => p.id === MAYA_WORKER_PROFILE_ID)!;
    const credentials = seedCredentials.filter(
      (c) => c.workerProfileId === profile.id,
    );
    const recentWork = seedWorkOrders
      .filter((w) => w.assigneeId === user.id || w.requesterId === user.id)
      .slice(0, 3);
    return { user, profile, credentials, recentWork };
  },
  presenter: (state) => state,
});

export function WorkerProfileView() {
  const vm = WorkerProfileRib.useViewModel();
  const initials = vm.user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

  return (
    <AppPage width="profile">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <Avatar className="size-16 shrink-0 rounded-full sm:size-20">
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-2">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight break-words sm:text-3xl">
                {vm.user.name}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground text-pretty sm:text-base">
                {vm.profile.headline}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Available</Badge>
              <Badge variant="outline" className="capitalize">
                {vm.user.identityStatus}
              </Badge>
              <span className="text-xs text-muted-foreground sm:text-sm">
                {vm.profile.serviceAreas.slice(0, 2).join(" · ")}
              </span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button asChild className="min-h-11">
            <Link href="/create">Post work</Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-11"
                aria-label="More profile actions"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/organization">Organization</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/home#settings">Settings</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatCard label="Completed" value={String(vm.profile.completedJobs)} />
        <StatCard
          label="Rating"
          value={
            vm.profile.rating != null ? vm.profile.rating.toFixed(1) : "—"
          }
        />
        <StatCard
          label="Credentials"
          value={String(vm.credentials.length)}
        />
      </div>

      <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(14rem,18rem)_minmax(0,1fr)]">
        <aside className="hidden min-w-0 space-y-4 lg:block">
          <PageSection>
            <SectionHeading title="Service areas" />
            <ul className="space-y-1 text-sm text-muted-foreground">
              {vm.profile.serviceAreas.map((area) => (
                <li key={area}>{area}</li>
              ))}
            </ul>
          </PageSection>
          <PageSection>
            <SectionHeading title="Skills" />
            <div className="flex flex-wrap gap-1.5">
              {vm.profile.skills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </PageSection>
        </aside>

        <div className="min-w-0">
          <Tabs defaultValue="about" className="space-y-4">
            <TabsList className="overflow-x-auto">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="credentials">Credentials</TabsTrigger>
              <TabsTrigger value="work">Recent work</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="space-y-4">
              <PageSection>
                <SectionHeading title="Bio" />
                <p className="max-w-3xl text-sm text-muted-foreground text-pretty">
                  {vm.profile.biography}
                </p>
              </PageSection>
              <PageSection className="lg:hidden">
                <SectionHeading title="Skills & areas" />
                <div className="flex flex-wrap gap-1.5">
                  {vm.profile.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {vm.profile.serviceAreas.join(" · ")}
                </p>
              </PageSection>
            </TabsContent>

            <TabsContent value="credentials" className="space-y-3">
              <SectionHeading
                title="Credentials"
                description="Statuses are mocked — not real verification."
              />
              {vm.credentials.map((c) => (
                <CredentialCard key={c.id} credential={c} />
              ))}
            </TabsContent>

            <TabsContent value="work" className="space-y-3">
              {vm.recentWork.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent work.</p>
              ) : (
                vm.recentWork.map((wo) => (
                  <Link
                    key={wo.id}
                    href={`/work/${wo.id}`}
                    className="block min-w-0 rounded-xl border border-border bg-card p-4 shadow-sm outline-none transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <p className="font-medium break-words">{wo.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {wo.description}
                    </p>
                  </Link>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppPage>
  );
}

export function WorkerProfileScreen({ userId }: { userId?: string }) {
  const session = useAppSession();
  return (
    <WorkerProfileRib.Provider
      deps={{ userId: userId ?? session.currentUser.id }}
    >
      <WorkerProfileView />
    </WorkerProfileRib.Provider>
  );
}
