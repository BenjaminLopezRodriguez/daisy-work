"use client";

import { createRib, useRibLifecycle } from "nextjs-ribs";

export const LandingRib = createRib({
  name: "Landing",
  interactor: (_deps: Record<string, never>) => {
    useRibLifecycle({});
    return {
      primaryHref: "/create",
      secondaryHref: "/work",
      homeHref: "/home",
    };
  },
  presenter: (state) => state,
});
