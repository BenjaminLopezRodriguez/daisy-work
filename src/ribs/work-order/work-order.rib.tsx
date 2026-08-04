"use client";

import { useState } from "react";
import { createRib, useRibLifecycle } from "nextjs-ribs";
import Link from "next/link";
import {
  ActivityTimeline,
  ActionStatusBanner,
  AppPage,
  DeliverableCard,
  EvidencePreview,
  GovernanceSummary,
  RequirementRow,
  RiskLevelBadge,
  SectionHeading,
  WorkStatusBadge,
} from "@/components/daisy";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppSession } from "@/lib/daisy/session";
import {
  seedDeliverables,
  seedEvidence,
  seedGovernanceEvents,
  seedRequirements,
  seedSubmissions,
} from "@/server/mocks/seed";
import { formatMoney, type WorkOrder } from "@/domain";
import type { DaisyServices } from "@/server/services";

type Tab = "overview" | "requirements" | "deliverables" | "activity" | "submission";

export const WorkOrderRib = createRib({
  name: "WorkOrder",
  interactor: (deps: {
    services: DaisyServices;
    workOrderId: string;
  }) => {
    const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
    const [tab, setTab] = useState<Tab>("overview");
    const [loading, setLoading] = useState(true);

    useRibLifecycle({
      onAttach: () => {
        void deps.services.workOrders.getById(deps.workOrderId).then((wo) => {
          setWorkOrder(wo);
          setLoading(false);
        });
      },
    });

    return {
      workOrder,
      tab,
      setTab,
      loading,
      workOrderId: deps.workOrderId,
    };
  },
  router: (state) => ({
    overview: state.tab === "overview",
    requirements: state.tab === "requirements",
    deliverables: state.tab === "deliverables",
    activity: state.tab === "activity",
    submission: state.tab === "submission",
  }),
  presenter: (state) => state,
});

export function WorkOrderView() {
  const vm = WorkOrderRib.useViewModel();

  if (vm.loading) {
    return (
      <ActionStatusBanner status="loading" message="Loading Work Order…" />
    );
  }
  if (!vm.workOrder) {
    return (
      <div className="space-y-4">
        <ActionStatusBanner
          status="needs_attention"
          message="Work Order not found."
        />
        <Button asChild variant="outline">
          <Link href="/work">Back to work list</Link>
        </Button>
      </div>
    );
  }

  const wo = vm.workOrder;
  const reqs = seedRequirements.filter((r) => r.workOrderId === wo.id);
  const dels = seedDeliverables.filter((d) => d.workOrderId === wo.id);
  const events = seedGovernanceEvents.filter((e) => e.workOrderId === wo.id);
  const subs = seedSubmissions.filter((s) => s.workOrderId === wo.id);
  const evidence = seedEvidence.filter((e) =>
    subs.some((s) => s.id === e.submissionId),
  );

  const overview = (
    <div className="space-y-4">
      <GovernanceSummary
        riskLevel={wo.riskLevel}
        explanation={
          events[0]?.explanation ??
          "No governance events yet for this Work Order."
        }
      />
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Category</dt>
          <dd>{wo.category}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Mode</dt>
          <dd className="capitalize">{wo.workMode.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Location</dt>
          <dd>{wo.location?.label ?? "Remote / not set"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Due</dt>
          <dd>{wo.dueAt ? wo.dueAt.toLocaleDateString() : "—"}</dd>
        </div>
      </dl>
    </div>
  );

  const requirements = (
    <div>
      {reqs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No requirements listed.</p>
      ) : (
        reqs.map((r) => <RequirementRow key={r.id} requirement={r} />)
      )}
    </div>
  );

  const deliverables = (
    <div>
      {dels.map((d) => (
        <DeliverableCard key={d.id} deliverable={d} />
      ))}
    </div>
  );

  const activity = <ActivityTimeline events={events} />;

  const submission = (
    <div className="space-y-4">
      {subs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No submission yet.</p>
      ) : (
        <>
          <p className="text-sm">{subs[0]?.notes}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {evidence.map((e) => (
              <EvidencePreview key={e.id} evidence={e} />
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <AppPage>
      <Card className="shadow-sm">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap gap-2">
                <RiskLevelBadge level={wo.riskLevel} />
                <WorkStatusBadge status={wo.status} />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                {wo.title}
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground text-pretty">
                {wo.description}
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-3 sm:items-end">
              <p className="text-lg font-semibold tabular-nums">
                {formatMoney(wo.budgetAmount, wo.currency)}
              </p>
              {wo.status === "submitted" ? (
                <Button asChild className="min-h-11">
                  <Link href={`/work/${wo.id}/review`}>Review submission</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="md:hidden">
        <Accordion type="multiple" defaultValue={["overview"]} className="w-full">
          <AccordionItem value="overview">
            <AccordionTrigger>Overview</AccordionTrigger>
            <AccordionContent>{overview}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="requirements">
            <AccordionTrigger>Requirements</AccordionTrigger>
            <AccordionContent>{requirements}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="deliverables">
            <AccordionTrigger>Deliverables</AccordionTrigger>
            <AccordionContent>{deliverables}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="activity">
            <AccordionTrigger>Activity</AccordionTrigger>
            <AccordionContent>{activity}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="submission">
            <AccordionTrigger>Submission</AccordionTrigger>
            <AccordionContent>{submission}</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="hidden md:block">
        <Tabs
          value={vm.tab}
          onValueChange={(v) => vm.setTab(v as Tab)}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="submission">Submission</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">{overview}</TabsContent>
          <TabsContent value="requirements">
            <SectionHeading title="Requirements" />
            {requirements}
          </TabsContent>
          <TabsContent value="deliverables">
            <SectionHeading title="Deliverables" />
            {deliverables}
          </TabsContent>
          <TabsContent value="activity">
            <SectionHeading title="Governance activity" />
            {activity}
          </TabsContent>
          <TabsContent value="submission">
            <SectionHeading title="Submission & evidence" />
            {submission}
          </TabsContent>
        </Tabs>
      </div>
    </AppPage>
  );
}

export function WorkOrderScreen({ workOrderId }: { workOrderId: string }) {
  const session = useAppSession();
  return (
    <WorkOrderRib.Provider
      deps={{ services: session.services, workOrderId }}
    >
      <WorkOrderView />
    </WorkOrderRib.Provider>
  );
}
