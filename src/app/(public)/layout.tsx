import { PublicHeader } from "@/components/daisy/public-header";
import { AppSessionProvider } from "@/lib/daisy/session";
import { AppRootProvider } from "@/ribs/app-root/app-root.rib";
import { auth } from "@/server/auth";

/**
 * Routes anyone can reach. Signed-in visitors still get the full app shell and
 * nav — moving a route here must not cost them their navigation — while
 * signed-out visitors get the marketing header instead of a sign-in wall.
 */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session?.user) {
    return (
      <AppSessionProvider>
        <AppRootProvider>{children}</AppRootProvider>
      </AppSessionProvider>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-dvh">
      <PublicHeader signedIn={false} />
      {children}
    </div>
  );
}
