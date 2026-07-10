import { Hono } from "hono";
import type { ApiEnv } from "../env";
import { getAudienceSession } from "../lib/cookies";

export const sessionRoute = new Hono<{ Bindings: ApiEnv }>().get("/", (c) => {
  const audienceCodeId = getAudienceSession(c);

  return c.json(
    audienceCodeId
      ? { entered: true, audienceCodeId }
      : { entered: false, audienceCodeId: null },
  );
});
