import { applicationsRouter } from "./routers/applications";
import { ordersRouter } from "./routers/orders";
import { organizationsRouter } from "./routers/organizations";
import { profileRouter } from "./routers/profile";
import { router } from "./trpc";

export const appRouter = router({
  applications: applicationsRouter,
  orders: ordersRouter,
  organizations: organizationsRouter,
  profile: profileRouter,
});

export type AppRouter = typeof appRouter;
