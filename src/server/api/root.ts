import { adsRouter } from "@/server/api/routers/ads";
import { applicationRouter } from "@/server/api/routers/application";
import { notificationRouter } from "@/server/api/routers/notification";
import { postRouter } from "@/server/api/routers/post";
import { providerRouter } from "@/server/api/routers/provider";
import { servicesRouter } from "@/server/api/routers/services";
import {
  meRouter,
  orchestratorRouter,
  workRouter,
} from "@/server/api/routers/work";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

export const appRouter = createTRPCRouter({
  post: postRouter,
  me: meRouter,
  work: workRouter,
  orchestrator: orchestratorRouter,
  application: applicationRouter,
  provider: providerRouter,
  services: servicesRouter,
  ads: adsRouter,
  notification: notificationRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
