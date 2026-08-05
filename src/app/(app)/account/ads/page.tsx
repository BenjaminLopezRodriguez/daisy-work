import { Suspense } from "react";

import AccountAdsPage from "./ads-client";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-muted-foreground">Loading…</div>
      }
    >
      <AccountAdsPage />
    </Suspense>
  );
}
