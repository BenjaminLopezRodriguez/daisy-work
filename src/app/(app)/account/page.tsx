"use client";

import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";

import { AppPage, PageHeader, WorkStatusBadge } from "@/components/daisy";
import { ImageCropUpload } from "@/components/daisy/uploads/image-crop-upload";
import { RoleSwitchRows } from "@/components/daisy/app-shell/role-switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/domain";
import { useAppSession } from "@/lib/daisy/session";
import { isWorker } from "@/lib/daisy/role";
import { api } from "@/trpc/react";

export default function AccountPage() {
  const { currentUser } = useAppSession();
  const worker = isWorker(currentUser.onboardingChoice);
  const utils = api.useUtils();

  const updateAvatar = api.me.updateAvatar.useMutation({
    onSuccess: async () => {
      await utils.me.get.invalidate();
    },
  });

  const { data: jobs = [], isLoading: jobsLoading } = api.work.list.useQuery();
  const { data: myAds = [], isLoading: adsLoading } = api.ads.mine.useQuery();
  const { data: serviceReach } = api.provider.myReach.useQuery(undefined, {
    enabled: worker,
  });

  const myPostings = jobs.filter((j) => j.requesterId === currentUser.id);
  const adImpressions = myAds.reduce((n, a) => n + a.impressionCount, 0);
  const adClicks = myAds.reduce((n, a) => n + a.clickCount, 0);

  return (
    <AppPage width="form" className="max-w-xl space-y-8">
      <PageHeader
        title="Account"
        description="Edit your profile, postings, and ads — and track how far they reach."
      />

      <ImageCropUpload
        endpoint="profileImage"
        aspect="square"
        label="Profile photo"
        value={currentUser.avatar}
        onChange={(url) => updateAvatar.mutate({ avatarUrl: url })}
      />

      <div className="rounded-xl border border-border bg-card p-4 text-sm">
        <p className="font-medium">{currentUser.name}</p>
        <p className="mt-1 text-muted-foreground">{currentUser.email}</p>
        <div className="mt-3 flex flex-wrap gap-2">
        {worker ? (
          <Button asChild size="sm" variant="outline">
            <Link href="/onboarding/provider">Edit provider profile</Link>
          </Button>
        ) : null}
        {worker ? (
          <Button asChild size="sm" variant="outline">
            <Link href="/services">Manage services</Link>
          </Button>
        ) : null}
        </div>
      </div>

      {/* Role switch — visible and reversible on mobile too. (§5.6) */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Viewing as</h2>
        <RoleSwitchRows onboardingChoice={currentUser.onboardingChoice ?? null} />
      </section>

      {/* Reach */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Reach</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Ad views</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {adsLoading ? "—" : adImpressions}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {adClicks} clicks
            </p>
          </div>
          {worker ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Service views</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {serviceReach?.profileViewCount ?? 0}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {serviceReach?.profileClickCount ?? 0} contact taps
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Your postings</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {jobsLoading ? "—" : myPostings.length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">jobs you own</p>
            </div>
          )}
        </div>
      </section>

      {/* Postings */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium">Your postings</h2>
          <Button asChild size="sm" variant="outline">
            <Link href="/create">New job</Link>
          </Button>
        </div>
        {jobsLoading ? (
          <Skeleton className="h-24 rounded-xl" />
        ) : myPostings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You haven’t posted a job yet.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {myPostings.map((wo) => (
              <li
                key={wo.id}
                className="flex items-start justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{wo.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <WorkStatusBadge status={wo.status} />
                    <span className="tabular-nums">
                      {formatMoney(wo.budgetAmount, wo.currency)}
                    </span>
                    <span>
                      {formatDistanceToNow(wo.createdAt, { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/work/${wo.id}/edit`}>Edit</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Ads */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium">Your ads</h2>
          <Button asChild size="sm" variant="outline">
            <Link href="/account/ads">Manage ads</Link>
          </Button>
        </div>
        {adsLoading ? (
          <Skeleton className="h-24 rounded-xl" />
        ) : myAds.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No ads yet.{" "}
            <Link href="/account/ads" className="text-primary underline">
              Create one
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {myAds.slice(0, 5).map((ad) => (
              <li key={ad.id} className="flex gap-3 px-4 py-3">
                {ad.imageUrl ? (
                  <div className="relative aspect-video w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                    <Image
                      src={ad.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{ad.headline}</p>
                  <p className="text-xs text-muted-foreground">
                    {ad.impressionCount} views · {ad.clickCount} clicks ·{" "}
                    {ad.status}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/account/ads?edit=${ad.id}`}>Edit</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {worker && serviceReach ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium">Your service profile</h2>
            <Button asChild size="sm" variant="outline">
              <Link href="/services">Services</Link>
            </Button>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {serviceReach.coverImageUrl ? (
              <div className="relative aspect-video w-full bg-muted">
                <Image
                  src={serviceReach.coverImageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="576px"
                />
              </div>
            ) : null}
            <div className="p-4 text-sm">
              <p className="font-medium">{serviceReach.headline}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {serviceReach.profileViewCount} profile views ·{" "}
                {serviceReach.profileClickCount} contact taps
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <div className="flex flex-col gap-2">
        <Button asChild variant="outline" className="min-h-11">
          <Link href="/marketplace">Marketplace</Link>
        </Button>
        <Button
          variant="outline"
          className="min-h-11 w-full"
          onClick={() => void signOut({ redirectTo: "/signin" })}
        >
          Sign out
        </Button>
      </div>
    </AppPage>
  );
}
