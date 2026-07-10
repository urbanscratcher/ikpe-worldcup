import { validator } from "hono/validator";
import * as v from "valibot";
import { enterRequestSchema, type EnterResponse } from "@ikpe-worldcup/shared/schemas/enter";
import { Hono } from "hono";
import type { ApiEnv } from "../env";
import { setAudienceSession } from "../lib/cookies";

const mockEntranceCode = "X4T82Q";
const mockAudienceCodeId = "mock-audience-code-id";

export const enterRoute = new Hono<{ Bindings: ApiEnv }>().post(
  "/",
  validator("json", (value, c) => {
    const result = v.safeParse(enterRequestSchema, value);

    if (!result.success) {
      return c.json({ ok: false, error: "INVALID_INPUT" } satisfies EnterResponse, 400);
    }

    return result.output;
  }),
  (c) => {
    const { code } = c.req.valid("json");
    const normalizedCode = code.trim().toUpperCase();

    if (normalizedCode !== mockEntranceCode) {
      return c.json({ ok: false, error: "INVALID_CODE" } satisfies EnterResponse, 401);
    }

    setAudienceSession(c, mockAudienceCodeId);

    return c.json({ ok: true, audienceCodeId: mockAudienceCodeId } satisfies EnterResponse);
  },
);
