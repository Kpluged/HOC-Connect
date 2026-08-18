import { applicationsRouter } from "./routers/applications";
import { driversRouter } from "./routers/drivers";
import { energyRouter } from "./routers/energy";
import { fleetRouter } from "./routers/fleet";
import { maintenanceRouter } from "./routers/maintenance";
import { ordersRouter } from "./routers/orders";
import { organizationsRouter } from "./routers/organizations";
import { profileRouter } from "./routers/profile";
import { shiftsRouter } from "./routers/shifts";
import { tripsRouter } from "./routers/trips";
import { router } from "./trpc";

export const appRouter = router({
  applications: applicationsRouter,
  drivers: driversRouter,
  energy: energyRouter,
  maintenance: maintenanceRouter,
  orders: ordersRouter,
  organizations: organizationsRouter,
  profile: profileRouter,
  shifts: shiftsRouter,
  trips: tripsRouter,
  vehicles: fleetRouter,
});

export type AppRouter = typeof appRouter;
