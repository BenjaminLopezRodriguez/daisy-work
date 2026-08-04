"use client";

import { LandingRib } from "@/ribs/landing/landing.rib";
import { LandingView } from "@/ribs/landing/landing.view";

export default function MarketingLandingPage() {
  return (
    <LandingRib.Provider deps={{}}>
      <LandingView />
    </LandingRib.Provider>
  );
}
