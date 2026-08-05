"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  AppPage,
  EmptyState,
  PageHeader,
  WorkStatusBadge,
} from "@/components/daisy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/react";

export function WorkOrderEditScreen({ workOrderId }: { workOrderId: string }) {
  const router = useRouter();
  const {
    data: wo,
    isLoading,
    isError,
  } = api.work.byId.useQuery({
    id: workOrderId,
  });
  const me = api.me.get.useQuery();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [budgetDollars, setBudgetDollars] = useState("");

  useEffect(() => {
    if (!wo) return;
    setTitle(wo.title);
    setDescription(wo.description);
    setCategory(wo.category);
    setBudgetDollars((wo.budgetAmount / 100).toString());
  }, [wo]);

  const update = api.work.update.useMutation({
    onSuccess: () => {
      router.push(`/work/${workOrderId}`);
      router.refresh();
    },
  });

  const cancel = api.work.cancel.useMutation({
    onSuccess: () => {
      router.push("/account");
      router.refresh();
    },
  });

  if (isLoading) {
    return (
      <AppPage width="form" className="max-w-2xl space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40 rounded-xl" />
      </AppPage>
    );
  }

  if (isError || !wo) {
    return (
      <AppPage width="form" className="max-w-2xl">
        <EmptyState
          title="Job not found"
          description="It may have been removed or the link is wrong."
          action={
            <Button asChild variant="outline">
              <Link href="/account">Back to account</Link>
            </Button>
          }
        />
      </AppPage>
    );
  }

  if (me.data && wo.requesterId !== me.data.id) {
    return (
      <AppPage width="form" className="max-w-2xl">
        <EmptyState
          title="You can’t edit this job"
          description="Only the poster can change job details."
          action={
            <Button asChild variant="outline">
              <Link href={`/work/${wo.id}`}>View job</Link>
            </Button>
          }
        />
      </AppPage>
    );
  }

  const canSave =
    title.trim().length >= 3 &&
    description.trim().length >= 3 &&
    !update.isPending;

  return (
    <AppPage width="form" className="max-w-2xl space-y-6">
      <PageHeader
        title="Edit posting"
        description="Update the details customers and workers see."
        actions={<WorkStatusBadge status={wo.status} />}
      />

      <form
        className="border-border bg-card space-y-4 rounded-xl border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSave) return;
          const dollars = Number(budgetDollars);
          update.mutate({
            workOrderId: wo.id,
            title: title.trim(),
            description: description.trim(),
            category: category.trim() || wo.category,
            budgetAmount: Number.isFinite(dollars)
              ? Math.round(dollars * 100)
              : undefined,
          });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={512}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            maxLength={128}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="budget">Budget (USD)</Label>
          <Input
            id="budget"
            inputMode="decimal"
            value={budgetDollars}
            onChange={(e) => setBudgetDollars(e.target.value)}
          />
        </div>

        {update.error ? (
          <p role="alert" className="text-destructive text-sm">
            {update.error.message}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={!canSave} className="min-h-11">
            {update.isPending ? "Saving…" : "Save changes"}
          </Button>
          <Button asChild type="button" variant="outline" className="min-h-11">
            <Link href={`/work/${wo.id}`}>Cancel</Link>
          </Button>
          {wo.status !== "cancelled" ? (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive min-h-11"
              disabled={cancel.isPending}
              onClick={() => {
                if (confirm("Cancel this job posting?")) {
                  cancel.mutate({ workOrderId: wo.id });
                }
              }}
            >
              Cancel posting
            </Button>
          ) : null}
        </div>
      </form>
    </AppPage>
  );
}
