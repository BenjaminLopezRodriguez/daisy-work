import type { Metadata } from "next";

import PayoutsClient from "./payouts-client";

export const metadata: Metadata = { title: "Payouts" };

export default function Page() {
  return <PayoutsClient />;
}
