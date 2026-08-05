"use client";

import { useEffect, useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Copy link, or hand off to the OS share sheet when there is one. A listing
 * nobody can pass to a friend only ever gets the traffic we send it.
 */
export function ShareRow({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  // Read on the client only — the server has no navigator, and the icon must
  // not differ between the server render and hydration.
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare(typeof navigator.share === "function"), []);

  async function share() {
    const url = window.location.href;
    // navigator.share is the better affordance on mobile and simply absent on
    // most desktops — feature-detect rather than sniff.
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Cancelled or blocked; fall through to copy.
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="min-h-11 gap-1.5 sm:min-h-9"
      onClick={() => void share()}
    >
      {copied ? (
        <Check className="size-4" aria-hidden />
      ) : canShare ? (
        <Share2 className="size-4" aria-hidden />
      ) : (
        <Link2 className="size-4" aria-hidden />
      )}
      {copied ? "Link copied" : "Share"}
    </Button>
  );
}
