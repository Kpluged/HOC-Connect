import { applicationsRouter } from "./routers/applications";
import { driversRouter } from "./routers/drivers";
import { fleetRouter } from "./routers/fleet";
import { ordersRouter } from "./routers/orders";
import { organizationsRouter } from "./routers/organizations";
import { profileRouter } from "./routers/profile";
import { shiftsRouter } from "./routers/shifts";
import { router } from "./trpc";

export const appRouter = router({
  applications: applicationsRouter,
  drivers: driversRouter,
  orders: ordersRouter,
  organizations: organizationsRouter,
  profile: profileRouter,
  shifts: shiftsRouter,
  vehicles: fleetRouter,
});

export type AppRouter = typeof appRouter;
