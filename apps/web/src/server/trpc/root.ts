import { applicationsRouter } from "./routers/applications";
import { organizationsRouter } from "./routers/organizations";
import { profileRouter } from "./routers/profile";
import { router } from "./trpc";

export const appRouter = router({
  applications: applicationsRouter,
  organizations: organizationsRouter,
  profile: profileRouter,
});

export type AppRouter = typeof appRouter;
