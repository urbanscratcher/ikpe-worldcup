import { Hono } from "hono";
import type { ApiEnv } from "../env";

export const healthRoute = new Hono<{ Bindings: ApiEnv }>().get("/", (c) => {
  return c.json({
    ok: true,
    service: "ikpe-worldcup-api",
    env: c.env.APP_ENV ?? "local",
  });
});
