import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { workOrderStatusLabel, type WorkOrderStatus } from "@/domain";

export { FormField, StepProgress } from "./ux";

export { AppPage, PageHeader } from "./layout/primitives";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border bg-card px-5 py-8 shadow-sm">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="max-w-md text-sm text-muted-foreground text-pretty">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}

export function WorkStatusBadge({ status }: { status: WorkOrderStatus }) {
  return (
    <Badge variant="secondary" className="font-normal">
      {workOrderStatusLabel(status)}
    </Badge>
  );
}
