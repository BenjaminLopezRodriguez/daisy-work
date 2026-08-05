import { Suspense } from "react";

import AccountAdsPage from "./ads-client";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground p-6 text-sm">Loading…</div>
      }
    >
      <AccountAdsPage />
    </Suspense>
  );
}
