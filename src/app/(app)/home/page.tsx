import { DashboardScreen } from "@/ribs/dashboard/dashboard.rib";

/**
 * Home for both roles. Providers used to be redirected to /services, which made
 * "Services" mean both "my listings" and "my dashboard". The dashboard now
 * reshapes by role instead.
 */
export default function HomePage() {
  return <DashboardScreen />;
}
