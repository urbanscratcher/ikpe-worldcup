import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router";
import type { EnterResponse } from "@ikpe-worldcup/shared";
import { apiGet, apiPost } from "../lib/api";

type HealthResponse = {
  ok: boolean;
  service: string;
  env: string;
};

export function EnterPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [health, setHealth] = useState<string>("확인 전");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function checkApi() {
    try {
      const result = await apiGet<HealthResponse>("/api/health");
      setHealth(result.ok ? `API OK (${result.env})` : "API 응답 이상");
    } catch {
      setHealth("API 연결 실패");
    }
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await apiPost<EnterResponse, { code: string }>("/api/enter", { code });

      if (result.ok) {
        setMessage("입장 성공. 관객 홈으로 이동합니다.");
        navigate("/");
        return;
      }

      setMessage("입장 코드가 올바르지 않습니다.");
    } catch {
      setMessage("입장 코드가 올바르지 않습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="screen">
      <header className="stack">
        <p className="eyebrow">BATTLE VOTE</p>
        <h1>입장 코드</h1>
        <p className="muted">팔찌나 QR에 적힌 코드를 입력하세요. 지금은 테스트 코드 X4T82Q만 성공합니다.</p>
      </header>

      <form className="stack panel" onSubmit={submitCode}>
        <label className="field">
          <span>코드</span>
          <input
            autoCapitalize="characters"
            autoComplete="one-time-code"
            inputMode="text"
            placeholder="X4T82Q"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
        </label>
        <button className="button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "확인 중..." : "입장"}
        </button>
        {message ? <p className="muted">{message}</p> : null}
      </form>

      <section className="panel stack">
        <strong>API 상태</strong>
        <p className="muted">{health}</p>
        <button className="secondary-button" type="button" onClick={checkApi}>
          API 상태 확인
        </button>
      </section>
    </main>
  );
}
