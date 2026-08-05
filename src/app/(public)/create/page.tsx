import { Suspense } from "react";

import { CreateWorkScreen } from "@/ribs/create-work/create-work.rib";
import { auth } from "@/server/auth";

export default async function CreatePage() {
  const session = await auth();

  return (
    <Suspense fallback={null}>
      <CreateWorkScreen signedIn={session?.user != null} />
    </Suspense>
  );
}
