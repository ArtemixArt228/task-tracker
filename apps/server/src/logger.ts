import pino from "pino";

import { version } from "./version";

// JSON lines to stdout; Railway parses `level` and lets you filter by it (e.g. level:error)
export const log = pino({
  base: { version },
  formatters: { level: (label) => ({ level: label }) },
  timestamp: pino.stdTimeFunctions.isoTime,
});
