import { AppSessionProvider } from "@/lib/daisy/session";
import { AppRootProvider } from "@/ribs/app-root/app-root.rib";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppSessionProvider>
      <AppRootProvider>{children}</AppRootProvider>
    </AppSessionProvider>
  );
}
