"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import { AppPage, PageHeader } from "@/components/daisy";
import { ImageCropUpload } from "@/components/daisy/uploads/image-crop-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppSession } from "@/lib/daisy/session";
import { isWorker } from "@/lib/daisy/role";
import { formatMoney } from "@/domain";
import { api } from "@/trpc/react";

type Placement = "landing" | "marketplace" | "work_feed";

export default function AccountAdsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const { currentUser } = useAppSession();
  const worker = isWorker(currentUser.onboardingChoice);

  const [advertiserType, setAdvertiserType] = useState<"worker" | "company">(
    worker ? "worker" : "company",
  );
  const [companyName, setCompanyName] = useState("");
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [ctaLabel, setCtaLabel] = useState("Learn more");
  const [ctaUrl, setCtaUrl] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [placement, setPlacement] = useState<Placement>("marketplace");
  const [status, setStatus] = useState<"active" | "paused">("active");
  // Dollars in the form, integer cents on the wire. Money never round-trips
  // through a float.
  const [costPerHire, setCostPerHire] = useState("5");
  const [budget, setBudget] = useState("50");

  const { data: myAds = [], refetch } = api.ads.mine.useQuery();
  const { data: editing } = api.ads.byId.useQuery(
    { id: editId! },
    { enabled: !!editId },
  );

  useEffect(() => {
    if (!editing) return;
    setAdvertiserType(editing.advertiserType);
    setCompanyName(editing.companyName ?? "");
    setHeadline(editing.headline);
    setBody(editing.body);
    setCtaLabel(editing.ctaLabel);
    setCtaUrl(editing.ctaUrl);
    setImageUrl(editing.imageUrl);
    setPlacement(editing.placement);
    setStatus(editing.status);
    setCostPerHire((editing.costPerHireCents / 100).toString());
    setBudget((editing.budgetCents / 100).toString());
  }, [editing]);

  const create = api.ads.create.useMutation({
    onSuccess: async () => {
      resetForm();
      await refetch();
    },
  });

  const update = api.ads.update.useMutation({
    onSuccess: async () => {
      resetForm();
      router.replace("/account/ads");
      await refetch();
    },
  });

  const setAdStatus = api.ads.setStatus.useMutation({
    onSuccess: async () => refetch(),
  });

  function resetForm() {
    setHeadline("");
    setBody("");
    setCompanyName("");
    setCtaUrl("");
    setImageUrl(null);
    setCtaLabel("Learn more");
    setPlacement("marketplace");
    setStatus("active");
    setCostPerHire("5");
    setBudget("50");
    setAdvertiserType(worker ? "worker" : "company");
  }

  const costPerHireCents = Math.round(Number(costPerHire) * 100);
  const budgetCents = Math.round(Number(budget) * 100);
  const budgetCoversAHire =
    Number.isFinite(costPerHireCents) &&
    Number.isFinite(budgetCents) &&
    costPerHireCents >= 100 &&
    budgetCents >= costPerHireCents;

  const pending = create.isPending || update.isPending;
  const canSubmit =
    headline.trim().length >= 3 &&
    ctaUrl.trim().length > 0 &&
    (advertiserType !== "company" || companyName.trim().length >= 2) &&
    budgetCoversAHire &&
    !pending;

  const totalImpressions = myAds.reduce((n, a) => n + a.impressionCount, 0);
  const totalClicks = myAds.reduce((n, a) => n + a.clickCount, 0);
  const totalHires = myAds.reduce((n, a) => n + a.hireCount, 0);
  const totalSpentCents = myAds.reduce((n, a) => n + a.spentCents, 0);

  return (
    <AppPage width="form" className="max-w-xl space-y-8">
      <PageHeader
        title={editId ? "Edit ad" : "Advertise"}
        description="Promote your services. You pay only when an ad leads to an actual hire — views and clicks are free."
      />

      {myAds.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="border-border bg-card rounded-xl border p-4">
            <p className="text-muted-foreground text-xs">Views</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {totalImpressions}
            </p>
          </div>
          <div className="border-border bg-card rounded-xl border p-4">
            <p className="text-muted-foreground text-xs">Clicks</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {totalClicks}
            </p>
          </div>
          {/* The only two numbers that cost anything. */}
          <div className="border-border bg-card rounded-xl border p-4">
            <p className="text-muted-foreground text-xs">Hires</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {totalHires}
            </p>
          </div>
          <div className="border-border bg-card rounded-xl border p-4">
            <p className="text-muted-foreground text-xs">Spent</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {formatMoney(totalSpentCents, "USD")}
            </p>
          </div>
        </div>
      ) : null}

      <form
        className="border-border bg-card space-y-4 rounded-xl border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSubmit) return;
          const payload = {
            advertiserType,
            companyName:
              advertiserType === "company" ? companyName.trim() : undefined,
            headline: headline.trim(),
            body: body.trim(),
            imageUrl: imageUrl,
            ctaLabel: ctaLabel.trim() || "Learn more",
            ctaUrl: ctaUrl.trim(),
            placement,
            costPerHireCents: costPerHireCents,
            budgetCents: budgetCents,
          };
          if (editId) {
            update.mutate({ id: editId, ...payload, status });
          } else {
            create.mutate(payload);
          }
        }}
      >
        <div className="space-y-2">
          <Label>Who is advertising?</Label>
          <Select
            value={advertiserType}
            onValueChange={(v) => {
              if (v === "worker" || v === "company") setAdvertiserType(v);
            }}
            disabled={!!editId}
          >
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="worker">Worker / service provider</SelectItem>
              <SelectItem value="company">Company / brand</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {advertiserType === "company" ? (
          <div className="space-y-2">
            <Label htmlFor="company">Company name</Label>
            <Input
              id="company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Tools Co."
              required
            />
          </div>
        ) : null}

        <ImageCropUpload
          endpoint="serviceImage"
          aspect="video"
          label="Ad creative"
          value={imageUrl}
          onChange={setImageUrl}
        />

        <div className="space-y-2">
          <Label htmlFor="headline">Headline</Label>
          <Input
            id="headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Licensed electrician, panel upgrades"
            required
            maxLength={128}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="body">Short description</Label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="What should people know in one or two lines?"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ctaLabel">Button label</Label>
            <Input
              id="ctaLabel"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              maxLength={64}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="placement">Where it shows</Label>
            <Select
              value={placement}
              onValueChange={(v) => {
                if (
                  v === "landing" ||
                  v === "marketplace" ||
                  v === "work_feed"
                ) {
                  setPlacement(v);
                }
              }}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="landing">Landing page</SelectItem>
                <SelectItem value="marketplace">Marketplace</SelectItem>
                <SelectItem value="work_feed">Work dashboard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Pay-per-hire: the pitch is that views and clicks are free, so the
            pricing has to say so where the numbers are entered. */}
        <fieldset className="border-border bg-card space-y-4 rounded-xl border p-4">
          <legend className="px-1 text-sm font-medium">Budget</legend>
          <p className="text-muted-foreground text-xs">
            You are only charged when someone who clicked your ad actually hires
            you. Views and clicks cost nothing. The fee comes out of that
            job&rsquo;s payout — there is no separate bill.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="costPerHire">Cost per hire</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">$</span>
                <Input
                  id="costPerHire"
                  type="number"
                  inputMode="decimal"
                  min={1}
                  step={1}
                  value={costPerHire}
                  onChange={(e) => setCostPerHire(e.target.value)}
                  className="h-11"
                />
              </div>
              <p className="text-muted-foreground text-xs">
                Higher bids rank higher, but an ad that converts beats one that
                only bids.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Total budget</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">$</span>
                <Input
                  id="budget"
                  type="number"
                  inputMode="decimal"
                  min={1}
                  step={1}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="h-11"
                />
              </div>
              <p className="text-muted-foreground text-xs">
                {budgetCoversAHire
                  ? `Pauses automatically after about ${Math.floor(budgetCents / costPerHireCents)} hires.`
                  : "Must be at least one hire's worth."}
              </p>
            </div>
          </div>
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor="ctaUrl">Link URL</Label>
          <Input
            id="ctaUrl"
            type="text"
            value={ctaUrl}
            onChange={(e) => setCtaUrl(e.target.value)}
            placeholder="https://your-site.com or /onboarding/provider"
            required
          />
        </div>

        {editId ? (
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) => {
                if (v === "active" || v === "paused") setStatus(v);
              }}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {(create.error ?? update.error) ? (
          <p role="alert" className="text-destructive text-sm">
            Couldn’t save the ad. Check the fields and try again.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={!canSubmit} className="min-h-11">
            {pending ? "Saving…" : editId ? "Save changes" : "Publish ad"}
          </Button>
          {editId ? (
            <Button
              type="button"
              variant="ghost"
              className="min-h-11"
              onClick={() => {
                resetForm();
                router.replace("/account/ads");
              }}
            >
              Cancel edit
            </Button>
          ) : null}
        </div>
      </form>

      {myAds.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-muted-foreground text-sm font-medium">
            Your ads
          </h2>
          <ul className="divide-border border-border bg-card divide-y rounded-xl border">
            {myAds.map((ad) => (
              <li key={ad.id} className="flex gap-3 px-4 py-3 text-sm">
                {ad.imageUrl ? (
                  <div className="bg-muted relative aspect-video w-24 shrink-0 overflow-hidden rounded-md">
                    <Image
                      src={ad.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{ad.headline}</p>
                  <p className="text-muted-foreground text-xs capitalize">
                    {ad.placement.replace("_", " ")} · {ad.status} ·{" "}
                    {ad.impressionCount} views · {ad.clickCount} clicks ·{" "}
                    {ad.hireCount} {ad.hireCount === 1 ? "hire" : "hires"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/account/ads?edit=${ad.id}`}>Edit</Link>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={setAdStatus.isPending}
                      onClick={() =>
                        setAdStatus.mutate({
                          id: ad.id,
                          status: ad.status === "active" ? "paused" : "active",
                        })
                      }
                    >
                      {ad.status === "active" ? "Pause" : "Activate"}
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Button asChild variant="ghost" size="sm">
        <Link href="/account">Back to account</Link>
      </Button>
    </AppPage>
  );
}
