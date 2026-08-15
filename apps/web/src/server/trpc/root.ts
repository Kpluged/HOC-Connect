import { applicationsRouter } from "./routers/applications";
import { fleetRouter } from "./routers/fleet";
import { ordersRouter } from "./routers/orders";
import { organizationsRouter } from "./routers/organizations";
import { profileRouter } from "./routers/profile";
import { router } from "./trpc";

export const appRouter = router({
  applications: applicationsRouter,
  orders: ordersRouter,
  organizations: organizationsRouter,
  profile: profileRouter,
  vehicles: fleetRouter,
});

export type AppRouter = typeof appRouter;
