"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { ImageCropUpload } from "@/components/daisy/uploads/image-crop-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";

type WorkMode = "remote" | "local" | "on_site" | "hybrid";

const WORK_MODES: { value: WorkMode; label: string }[] = [
  { value: "remote", label: "Remote" },
  { value: "local", label: "Local" },
  { value: "on_site", label: "On site" },
  { value: "hybrid", label: "Hybrid" },
];

export type ProviderProfileInitial = {
  headline: string;
  biography: string;
  serviceAreas: string[];
  workModes: WorkMode[];
  hourlyRateCents: number | null;
  location: string;
  coverImageUrl: string | null;
  avatarUrl: string | null;
};

/** Dollars in the input, integer cents in the database. */
function toCents(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const dollars = Number(trimmed);
  if (!Number.isFinite(dollars) || dollars < 0) return null;
  return Math.round(dollars * 100);
}

export function ProviderProfileForm({
  initial,
  initialAvatarUrl,
}: {
  initial: ProviderProfileInitial | null;
  initialAvatarUrl?: string | null;
}) {
  const router = useRouter();
  const utils = api.useUtils();
  const [headline, setHeadline] = useState(initial?.headline ?? "");
  const [biography, setBiography] = useState(initial?.biography ?? "");
  const [services, setServices] = useState(
    initial?.serviceAreas.join(", ") ?? "",
  );
  const [workModes, setWorkModes] = useState<WorkMode[]>(
    initial?.workModes ?? ["remote"],
  );
  const [rate, setRate] = useState(
    initial?.hourlyRateCents != null
      ? (initial.hourlyRateCents / 100).toString()
      : "",
  );
  const [location, setLocation] = useState(initial?.location ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    initial?.coverImageUrl ?? null,
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    initial?.avatarUrl ?? initialAvatarUrl ?? null,
  );

  const save = api.provider.upsertProfile.useMutation({
    onSuccess: () => {
      router.push("/services");
      router.refresh();
    },
  });

  const updateAvatar = api.me.updateAvatar.useMutation({
    onSuccess: async () => {
      await utils.me.get.invalidate();
    },
  });

  const toggleMode = (mode: WorkMode) =>
    setWorkModes((current) =>
      current.includes(mode)
        ? current.filter((m) => m !== mode)
        : [...current, mode],
    );

  const headlineValid = headline.trim().length >= 3;
  const canSubmit = headlineValid && workModes.length > 0 && !save.isPending;

  return (
    <form
      className="mt-8 space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        save.mutate({
          headline: headline.trim(),
          biography: biography.trim(),
          serviceAreas: services
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 12),
          workModes,
          hourlyRateCents: toCents(rate),
          location: location.trim() || undefined,
          coverImageUrl,
        });
      }}
    >
      <ImageCropUpload
        endpoint="profileImage"
        aspect="square"
        label="Profile photo"
        value={avatarUrl}
        onChange={(url) => {
          setAvatarUrl(url);
          updateAvatar.mutate({ avatarUrl: url });
        }}
      />

      <ImageCropUpload
        endpoint="serviceImage"
        aspect="video"
        label="Service photo"
        value={coverImageUrl}
        onChange={setCoverImageUrl}
      />

      <div className="space-y-2">
        <Label htmlFor="headline">What do you do?</Label>
        <Input
          id="headline"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Licensed electrician, residential panels and rewiring"
          maxLength={256}
          required
        />
        <p className="text-xs text-muted-foreground">
          One line. This is the first thing a poster reads.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="biography">About your work</Label>
        <Textarea
          id="biography"
          value={biography}
          onChange={(e) => setBiography(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Years of experience, the kind of jobs you take, anything a client should know."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="services">Services you offer</Label>
        <Input
          id="services"
          value={services}
          onChange={(e) => setServices(e.target.value)}
          placeholder="panel upgrades, EV chargers, lighting"
        />
        <p className="text-xs text-muted-foreground">
          Separate with commas. Up to 12.
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">How you work</legend>
        <div className="flex flex-wrap gap-2">
          {WORK_MODES.map(({ value, label }) => {
            const active = workModes.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleMode(value)}
                aria-pressed={active}
                className={cn(
                  "min-h-10 rounded-full border px-4 text-sm font-medium transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
        {workModes.length === 0 ? (
          <p className="text-xs text-destructive">Pick at least one.</p>
        ) : null}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rate">Hourly rate</Label>
          <Input
            id="rate"
            inputMode="decimal"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="65"
          />
          <p className="text-xs text-muted-foreground">
            USD per hour. Leave blank if it depends on the job.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Where you’re based</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Sacramento, CA"
            maxLength={256}
          />
        </div>
      </div>

      {save.error ? (
        <p role="alert" className="text-sm text-destructive">
          Couldn’t save your profile. Check the fields and try again.
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!canSubmit} className="min-h-10">
          {save.isPending
            ? "Saving…"
            : initial
              ? "Save changes"
              : "Create profile"}
        </Button>
        <Button
          asChild
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-10"
        >
          <Link href="/services">Skip for now</Link>
        </Button>
      </div>
    </form>
  );
}
