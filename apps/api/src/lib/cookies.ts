import { getCookie, setCookie } from "hono/cookie";
import type { Context } from "hono";
import type { ApiEnv } from "../env";

const audienceSessionCookie = "audience_session";

/**
 * mock 단계에서 사용하는 관객 세션 쿠키를 심습니다.
 *
 * httpOnly 쿠키는 브라우저 JavaScript가 직접 읽을 수 없습니다.
 * 그래서 권한 판단을 클라이언트 상태가 아니라 서버가 받은 쿠키 기준으로 하게 됩니다.
 */
export function setAudienceSession(c: Context<{ Bindings: ApiEnv }>, audienceCodeId: string) {
  const isProduction = c.env.APP_ENV === "production";

  setCookie(c, audienceSessionCookie, audienceCodeId, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "Lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export function getAudienceSession(c: Context<{ Bindings: ApiEnv }>) {
  return getCookie(c, audienceSessionCookie) ?? null;
}
