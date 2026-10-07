import pino from "pino";

import { ENV } from "./env.server";

// JSON lines to stdout; Railway parses `level` and lets you filter by it (e.g. level:error)
export const log = pino({
  base: { version: ENV.APP_VERSION ?? "dev" },
  formatters: { level: (label) => ({ level: label }) },
  timestamp: pino.stdTimeFunctions.isoTime,
});
