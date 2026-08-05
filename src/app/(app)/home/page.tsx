import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import { DashboardScreen } from "@/ribs/dashboard/dashboard.rib";

/** Customer hub — workers land on their services instead. */
export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    const { choice } = await api.provider.status();
    if (choice === "provide") redirect("/services");
  }

  return <DashboardScreen />;
}
