import * as v from "valibot";

/**
 * `/enter` 화면에서 API로 보내는 입장 코드 요청의 런타임 검증 규칙입니다.
 *
 * TypeScript 타입은 개발 중 실수를 줄여주지만, 실제 사용자가 보낸 JSON이
 * 올바른지는 실행 중에 다시 확인해야 합니다. Valibot schema는 그 역할을 합니다.
 */
export const enterRequestSchema = v.object({
  /**
   * 행사 팔찌나 QR에 적힌 입장 코드입니다.
   *
   * - `trim()`은 사용자가 앞뒤 공백을 붙여도 제거합니다.
   * - `minLength(4)`는 너무 짧은 입력을 거절합니다.
   * - `maxLength(32)`는 비정상적으로 긴 입력을 막습니다.
   */
  code: v.pipe(v.string(), v.trim(), v.minLength(4), v.maxLength(32)),
});

/**
 * schema에서 뽑은 TypeScript 타입입니다.
 *
 * schema를 바꾸면 타입도 같이 바뀌므로 web과 api의 입력 규칙이 어긋날 가능성이 줄어듭니다.
 */
export type EnterRequest = v.InferOutput<typeof enterRequestSchema>;

/**
 * mock `/api/enter`가 반환하는 응답입니다.
 *
 * 지금은 Supabase를 붙이기 전이라 `X4T82Q`만 성공시키지만,
 * 나중에도 화면은 이 응답 모양을 기준으로 유지할 수 있습니다.
 */
export type EnterResponse =
  | {
      ok: true;
      audienceCodeId: string;
    }
  | {
      ok: false;
      error: "INVALID_INPUT" | "INVALID_CODE" | "BLOCKED_CODE";
    };
