import { rescanOldestCleanLinks } from "./admin/review";
import { createDb } from "./db/client";
import type { AppEnv } from "./env";

export const scheduled = async (
  _controller: ScheduledController,
  env: AppEnv,
  _ctx: ExecutionContext,
) => {
  await rescanOldestCleanLinks({
    db: createDb(env.DB),
    env,
    limit: 25,
  });
};
