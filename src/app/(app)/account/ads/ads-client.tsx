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
    setAdvertiserType(worker ? "worker" : "company");
  }

  const pending = create.isPending || update.isPending;
  const canSubmit =
    headline.trim().length >= 3 &&
    ctaUrl.trim().length > 0 &&
    (advertiserType !== "company" || companyName.trim().length >= 2) &&
    !pending;

  const totalImpressions = myAds.reduce((n, a) => n + a.impressionCount, 0);
  const totalClicks = myAds.reduce((n, a) => n + a.clickCount, 0);

  return (
    <AppPage width="form" className="max-w-xl space-y-8">
      <PageHeader
        title={editId ? "Edit ad" : "Advertise"}
        description="Create and manage sponsored listings. Reach shows how often your ads were seen and clicked."
      />

      {myAds.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Ad impressions</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {totalImpressions}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Ad clicks</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {totalClicks}
            </p>
          </div>
        </div>
      ) : null}

      <form
        className="space-y-4 rounded-xl border border-border bg-card p-4"
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
          <p role="alert" className="text-sm text-destructive">
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
          <h2 className="text-sm font-medium text-muted-foreground">
            Your ads
          </h2>
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {myAds.map((ad) => (
              <li key={ad.id} className="flex gap-3 px-4 py-3 text-sm">
                {ad.imageUrl ? (
                  <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-md bg-muted">
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
                  <p className="text-xs text-muted-foreground capitalize">
                    {ad.placement.replace("_", " ")} · {ad.status} ·{" "}
                    {ad.impressionCount} views · {ad.clickCount} clicks
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
