import { useEffect, useState } from "react";
import { Link } from "react-router";
import { apiGet } from "../lib/api";

type SessionResponse = {
  entered: boolean;
  audienceCodeId: string | null;
};

export function AudiencePage() {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<SessionResponse>("/api/session")
      .then(setSession)
      .catch(() => setError("입장 상태를 확인하지 못했습니다."));
  }, []);

  return (
    <main className="screen">
      <header className="stack">
        <p className="eyebrow">IKPE WORLDCUP</p>
        <h1>관객 홈</h1>
        <p className="muted">현재 경기, 투표, 결과가 여기에 표시됩니다.</p>
      </header>

      <section className="panel">
        {error ? <p className="danger">{error}</p> : null}
        {!session && !error ? <p className="muted">입장 상태 확인 중...</p> : null}
        {session?.entered ? (
          <div className="stack">
            <strong>입장 완료</strong>
            <p className="muted">이제 투표 화면을 볼 수 있습니다.</p>
          </div>
        ) : null}
        {session && !session.entered ? (
          <div className="stack">
            <strong>입장 코드가 필요합니다.</strong>
            <Link className="button" to="/enter">
              입장 코드 입력
            </Link>
          </div>
        ) : null}
      </section>

      <nav className="quick-nav" aria-label="운영 화면 바로가기">
        <Link to="/register">참가자</Link>
        <Link to="/admin">관리자</Link>
        <Link to="/host">사회자</Link>
        <Link to="/sound">사운드</Link>
      </nav>
    </main>
  );
}
