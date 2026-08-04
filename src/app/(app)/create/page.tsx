import { Suspense } from "react";

import { CreateWorkScreen } from "@/ribs/create-work/create-work.rib";

export default function CreatePage() {
  return (
    <Suspense fallback={null}>
      <CreateWorkScreen />
    </Suspense>
  );
}
