import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { appRouter } from "@task-tracker/api/routers/index";
import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";

import { createContext } from "./context";
import { ENV } from "./env.server";
import { log } from "./logger";
import { db } from "./services";
import { version } from "./version";

const app = new Hono();

app.use(requestId());
app.use(async (c, next) => {
  const start = performance.now();
  await next();
  const status = c.res.status;
  log[status >= 500 ? "error" : "info"](
    {
      requestId: c.get("requestId"),
      method: c.req.method,
      path: c.req.path,
      status,
      ms: Math.round(performance.now() - start),
    },
    "request",
  );
});
app.use(
  "/*",
  cors({
    origin: ENV.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
  }),
);

export const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
  interceptors: [
    onError((error) => {
      log.error({ err: error }, "procedure failed");
    }),
  ],
});

export const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      log.error({ err: error }, "procedure failed");
    }),
  ],
});

app.use("/*", async (c, next) => {
  const context = await createContext({ context: c });

  const rpcResult = await rpcHandler.handle(c.req.raw, {
    prefix: "/rpc",
    context: context,
  });

  if (rpcResult.matched) {
    return c.newResponse(rpcResult.response.body, rpcResult.response);
  }

  const apiResult = await apiHandler.handle(c.req.raw, {
    prefix: "/api-reference",
    context: context,
  });

  if (apiResult.matched) {
    return c.newResponse(apiResult.response.body, apiResult.response);
  }

  await next();
});

app.get("/", (c) => {
  return c.text("OK");
});

app.get("/health", async (c) => {
  await db.execute(sql`select 1`);
  return c.json({ status: "ok", db: "ok", version });
});

app.onError((err, c) => {
  log.error({ err, requestId: c.get("requestId"), path: c.req.path }, "unhandled error");
  return c.json({ status: "error" }, 500);
});

log.info({ port: Number(process.env.PORT ?? 3000) }, "server started");

export default app;
