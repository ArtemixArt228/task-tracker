import { ENV } from "./env.server";

// APP_VERSION wins if set; on Railway fall back to the deployed commit
export const version = ENV.APP_VERSION || ENV.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) || "dev";
