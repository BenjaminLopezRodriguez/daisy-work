"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

import { AppPage, EmptyState, PageHeader } from "@/components/daisy";
import { ImageCropUpload } from "@/components/daisy/uploads/image-crop-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/domain";
import { api } from "@/trpc/react";

function toCents(input: string): number {
  const dollars = Number(input.trim());
  if (!Number.isFinite(dollars) || dollars < 0) return 0;
  return Math.round(dollars * 100);
}

type AiField = "title" | "description" | "price" | "tags";

function AiMark() {
  return (
    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
      From Daisy · review
    </span>
  );
}

export default function ServicesPage() {
  const utils = api.useUtils();
  const { data: profileStatus } = api.provider.status.useQuery();
  const { data: mine = [], isLoading } = api.services.mine.useQuery();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [tags, setTags] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [hint, setHint] = useState("");
  const [aiFilled, setAiFilled] = useState<Partial<Record<AiField, boolean>>>(
    {},
  );
  const [priceBasis, setPriceBasis] = useState<{
    medianCents: number;
    sampleSize: number;
  } | null>(null);
  const [draftNote, setDraftNote] = useState("");

  const suggest = api.services.suggest.useMutation();

  function clearAi(field: AiField) {
    setAiFilled((prev) => (prev[field] ? { ...prev, [field]: false } : prev));
  }

  async function runSuggest() {
    const trimmed = hint.trim();
    if (trimmed.length < 3 || trimmed.length > 500 || suggest.isPending) return;
    const toastId = toast.loading("Drafting your listing…");
    setDraftNote("Daisy is drafting your listing…");
    try {
      const s = await suggest.mutateAsync({ hint: trimmed });
      if (!s) {
        setDraftNote("Daisy couldn’t draft this right now — fill it in below.");
        toast.error("Daisy couldn’t draft this right now", {
          id: toastId,
          description: "Fill the form in below — nothing was changed.",
        });
        return;
      }
      const next: Partial<Record<AiField, boolean>> = {};
      const kept: string[] = [];
      if (title.trim()) kept.push("title");
      else {
        setTitle(s.title);
        next.title = true;
      }
      if (description.trim()) kept.push("description");
      else {
        setDescription(s.description);
        next.description = true;
      }
      if (price.trim()) kept.push("price");
      else {
        setPrice((s.priceCents / 100).toString());
        next.price = true;
        setPriceBasis(s.priceBasis);
      }
      if (tags.trim()) kept.push("tags");
      else if (s.tags.length) {
        setTags(s.tags.join(", "));
        next.tags = true;
      }
      setAiFilled((prev) => ({ ...prev, ...next }));
      setDraftNote(
        kept.length
          ? `Draft ready. Kept what you already typed: ${kept.join(", ")}.`
          : "Draft ready. Every field is editable — nothing is saved yet.",
      );
      toast.success("Draft ready", {
        id: toastId,
        description: kept.length
          ? `Filled the empty fields. Kept your ${kept.join(", ")}.`
          : "Review it, edit anything, then publish.",
      });
    } catch {
      setDraftNote("Daisy couldn’t draft this right now — fill it in below.");
      toast.error("Daisy couldn’t draft this right now", {
        id: toastId,
        description: "Fill the form in below — nothing was changed.",
      });
    }
  }

  const upsert = api.services.upsert.useMutation({
    onSuccess: async () => {
      resetForm();
      await utils.services.mine.invalidate();
    },
  });

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setPrice("");
    setTags("");
    setCoverImageUrl(null);
    setFormOpen(false);
    setHint("");
    setAiFilled({});
    setPriceBasis(null);
    setDraftNote("");
  }

  function startEdit(s: (typeof mine)[number]) {
    setEditingId(s.id);
    setTitle(s.title);
    setDescription(s.description);
    setPrice((s.priceCents / 100).toString());
    setTags(s.tags.join(", "));
    setCoverImageUrl(s.coverImageUrl);
    setFormOpen(true);
    setHint("");
    setAiFilled({});
    setPriceBasis(null);
    setDraftNote("");
  }

  const hasProfile = !!profileStatus?.profile;
  const canSubmit = title.trim().length >= 3 && !upsert.isPending;

  return (
    <AppPage width="form" className="max-w-xl space-y-8">
      <PageHeader
        title="Your services"
        description="List what you offer. Customers find these when they describe a need."
        actions={
          hasProfile ? (
            <Button
              type="button"
              className="min-h-11"
              onClick={() => {
                resetForm();
                setFormOpen(true);
              }}
            >
              Add service
            </Button>
          ) : null
        }
      />

      {!hasProfile ? (
        <EmptyState
          title="Set up your profile first"
          description="You need a provider profile before listing services."
          action={
            <Button asChild>
              <Link href="/onboarding/provider">Create profile</Link>
            </Button>
          }
        />
      ) : null}

      {formOpen && hasProfile ? (
        <form
          className="space-y-4 rounded-xl border border-border bg-card p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;
            upsert.mutate({
              id: editingId ?? undefined,
              title: title.trim(),
              description: description.trim(),
              priceCents: toCents(price),
              coverImageUrl,
              tags: tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
                .slice(0, 12),
              status: "active",
            });
          }}
        >
          <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
            <Label htmlFor="hint">
              Describe what you do — Daisy drafts the listing
            </Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="hint"
                value={hint}
                maxLength={500}
                onChange={(e) => setHint(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void runSuggest();
                  }
                }}
                placeholder="I replace kitchen faucets, same day, in Oakland"
                aria-describedby="hint-help"
              />
              <Button
                type="button"
                variant="outline"
                className="min-h-11 shrink-0"
                aria-busy={suggest.isPending}
                disabled={hint.trim().length < 3 || suggest.isPending}
                onClick={() => void runSuggest()}
              >
                {suggest.isPending ? "Drafting…" : "Draft with Daisy"}
              </Button>
            </div>
            <p id="hint-help" className="text-xs text-muted-foreground">
              Optional. Fills only fields you’ve left empty — nothing is saved
              until you publish.
            </p>
            <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
              {draftNote}
            </p>
          </div>

          <ImageCropUpload
            endpoint="serviceImage"
            aspect="video"
            label="Service photo"
            value={coverImageUrl}
            onChange={setCoverImageUrl}
          />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="title">Service title</Label>
              {aiFilled.title ? <AiMark /> : null}
            </div>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                clearAi("title");
              }}
              placeholder="Kitchen faucet replacement"
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="description">What’s included</Label>
              {aiFilled.description ? <AiMark /> : null}
            </div>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                clearAi("description");
              }}
              rows={4}
              placeholder="Parts, labor, cleanup. Same-day if booked before noon."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="price">Package price (USD)</Label>
                {aiFilled.price ? <AiMark /> : null}
              </div>
              <Input
                id="price"
                inputMode="decimal"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  clearAi("price");
                }}
                placeholder="150"
                aria-describedby={aiFilled.price ? "price-basis" : undefined}
              />
              {aiFilled.price ? (
                <p id="price-basis" className="text-xs text-muted-foreground">
                  {priceBasis
                    ? `Median of ${priceBasis.sampleSize} similar listing${
                        priceBasis.sampleSize === 1 ? "" : "s"
                      }: ${formatMoney(priceBasis.medianCents, "USD")}`
                    : "No similar listings yet — this is a starting point."}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="tags">Tags</Label>
                {aiFilled.tags ? <AiMark /> : null}
              </div>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => {
                  setTags(e.target.value);
                  clearAi("tags");
                }}
                placeholder="plumbing, faucet"
              />
            </div>
          </div>
          {upsert.error ? (
            <p className="text-sm text-destructive">{upsert.error.message}</p>
          ) : null}
          <div className="flex gap-2">
            <Button type="submit" disabled={!canSubmit} className="min-h-11">
              {upsert.isPending
                ? "Saving…"
                : editingId
                  ? "Save changes"
                  : "Publish service"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-11"
              onClick={resetForm}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {isLoading ? (
        <Skeleton className="h-32 rounded-xl" />
      ) : mine.length === 0 && !formOpen ? (
        <EmptyState
          title="No services listed"
          description="Add a packaged service so customers can request you directly."
          action={
            hasProfile ? (
              <Button type="button" onClick={() => setFormOpen(true)}>
                Add your first service
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-3">
          {mine.map((s) => (
            <li
              key={s.id}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              {s.coverImageUrl ? (
                <div className="relative aspect-video w-full bg-muted">
                  <Image
                    src={s.coverImageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="576px"
                  />
                </div>
              ) : null}
              <div className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium">{s.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatMoney(s.priceCents, "USD")} · {s.viewCount} views ·{" "}
                    {s.clickCount} requests · {s.status}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => startEdit(s)}
                >
                  Edit
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppPage>
  );
}
