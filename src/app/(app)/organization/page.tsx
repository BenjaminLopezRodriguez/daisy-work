"use client";

import Link from "next/link";
import { Building2, Shield, Users, Wallet } from "lucide-react";

import {
  AppPage,
  PageHeader,
  PageSection,
  SectionHeading,
  StatCard,
  VerificationBadge,
} from "@/components/daisy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { seedOrganizations, seedUsers } from "@/server/mocks/seed";

export default function OrganizationPage() {
  const org = seedOrganizations[0]!;
  const members = seedUsers.slice(0, 4);

  return (
    <AppPage>
      <PageHeader
        title={org.name}
        description="Organization policies, members, and billing for this demo."
        actions={<VerificationBadge />}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="capitalize">
          {org.verificationStatus}
        </Badge>
        <Badge variant="outline" className="capitalize">
          Billing: {org.billingStatus.replaceAll("_", " ")}
        </Badge>
        <span className="text-sm text-muted-foreground">/{org.slug}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Members" value={String(members.length)} hint="Demo roster" />
        <StatCard label="Plan" value="Ops" hint="Mocked plan tier" />
        <StatCard
          label="Billing"
          value={
            org.billingStatus === "active"
              ? "Active"
              : org.billingStatus.replaceAll("_", " ")
          }
        />
        <StatCard label="Policies" value="3" hint="Active governance defaults" />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <PageSection>
            <SectionHeading title="Recent activity" />
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Building2 className="size-4" aria-hidden />
                  Organization ready
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Northline Retail is seeded for demos. Post work under this org
                from the create flow when org scoping is enabled.
              </CardContent>
            </Card>
          </PageSection>
        </TabsContent>

        <TabsContent value="members" className="space-y-3">
          {members.map((user) => (
            <div
              key={user.id}
              className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
            >
              <div>
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/profile/${user.id}`}>
                  <Users className="size-3.5" aria-hidden />
                  Profile
                </Link>
              </Button>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="billing">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="size-4" aria-hidden />
                Billing status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p className="capitalize">
                Status: {org.billingStatus.replaceAll("_", " ")}
              </p>
              <p>Invoices and payment methods stay mocked in this build.</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/payments">View payments</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-3">
          {[
            "Require photo evidence for on-site L1 jobs",
            "License check before L4 assignment",
            "Escrow authorization before publish over $100",
          ].map((policy) => (
            <div
              key={policy}
              className="flex gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <Shield className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <p className="text-sm">{policy}</p>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </AppPage>
  );
}
