import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daisy.work — Work, properly coordinated",
  description:
    "Assign work, verify completion, and pay under rules that match the job.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
