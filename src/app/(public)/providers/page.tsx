import type { Metadata } from "next";

import ProvidersIndex from "./providers-index";

export const metadata: Metadata = {
  title: "Providers",
  description:
    "Browse the people offering services on Daisy.work — what they do, where they work, and what they charge.",
  alternates: { canonical: "/providers" },
  openGraph: {
    title: "Providers on Daisy.work",
    description: "Browse the people offering services on Daisy.work.",
    url: "/providers",
    siteName: "Daisy.work",
  },
};

export default function Page() {
  return <ProvidersIndex />;
}
