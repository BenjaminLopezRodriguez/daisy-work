import { PublicHeader } from "@/components/daisy/public-header";
import { auth } from "@/server/auth";

/**
 * Public shell. Deliberately does NOT mount the signed-in app shell or the
 * session gate — these routes must render for someone who has never signed in.
 */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <PublicHeader signedIn={Boolean(session?.user)} />
      {children}
    </div>
  );
}
