import { createDb } from "@task-tracker/db";

import { ENV } from "./env.server";

export const db = createDb(ENV);
