import { Hono } from "hono";
import type { ApiEnv } from "./env";
import { enterRoute } from "./routes/enter";
import { healthRoute } from "./routes/health";
import { sessionRoute } from "./routes/session";

export const app = new Hono<{ Bindings: ApiEnv }>()
  .route("/api/health", healthRoute)
  .route("/api/enter", enterRoute)
  .route("/api/session", sessionRoute);

export type AppType = typeof app;
