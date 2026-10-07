import type { RouterClient } from "@orpc/server";

import { publicProcedure } from "../index";
import { taskRouter } from "./task";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  task: taskRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
