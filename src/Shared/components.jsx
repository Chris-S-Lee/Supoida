import { useEffect, useRef, useState } from "react";
import { ROOMS_DATA, pad, formatTime, btnStyle } from "./constants.js";

// ── Toast ─────────────────────────────────────────────────────────────────────
export function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2200); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{
      position:"fixed", bottom:32, left:"50%", transform:"translateX(-50%)",
      background:"var(--surface)", border:"1px solid var(--border)", borderRadius:6,
      padding:"10px 20px", fontSize:13, zIndex:300, color:"var(--text)",
      fontFamily:"var(--mono)", whiteSpace:"nowrap", animation:"fadeInUp 0.3s ease",
    }}>{msg}</div>
  );
}

// ── GridBg (오타 수정됨) ───────────────────────────────────────────
export function GridBg() {
  return (
    <div style={{
      position: "absolute", 
      inset: 0, 
      pointerEvents: "none",
      backgroundImage: "linear-gradient(rgba(108,99,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(108,99,255,0.03) 1px, transparent 1px)",
      backgroundSize: "40px 40px",
    }} />
  );
}

// ── Header ───────────────────────────────────────────────────────────────────
export function Header({ timerSec, timerRunning, isAdmin, onToggleTimer, onStart1550 }) {
  return (
    <header style={{
      padding: "15px 25px", background: "var(--surface)", borderBottom: "1px solid var(--border)",
      display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100
    }}>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--accent)" }}>
          {isAdmin ? "ADMIN PANEL" : "MATH ESCAPE"}
        </h2>
        <div style={{ fontSize: 10, color: "var(--text2)", fontFamily: "var(--mono)" }}>
          {isAdmin ? "CONTROL MODE" : "LIVE STATUS"}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        <div style={{ 
          display: "flex", 
          flexDirection: "column", // 세로로 배치 (버튼이 위, 시계가 아래)
          alignItems: "flex-end", 
          gap: "4px" 
        }}>
          {/* 관리자일 때만 시계 위에 버튼 노출 */}
          {isAdmin && (
            <button 
              onClick={timerSec > 0 ? () => onToggleTimer(!timerRunning) : onStart1550}
              style={{
                background: timerRunning ? "rgba(255, 77, 77, 0.1)" : "rgba(0, 255, 136, 0.1)",
                border: `1px solid ${timerRunning ? "#ff4d4d" : "#00ff88"}`,
                color: timerRunning ? "#ff4d4d" : "#00ff88",
                borderRadius: "4px", padding: "2px 8px",
                cursor: "pointer", fontSize: "10px", fontWeight: "bold",
                transition: "all 0.2s"
              }}
            >
              {timerRunning ? "PAUSE ┃┃" : "START ▶"}
            </button>
          )}

          {/* 시계 숫자 (위치 유지) */}
          <div style={{ 
            fontSize: 28, fontFamily: "var(--mono)", fontWeight: 800, 
            color: timerSec < 300 ? "#ff4d4d" : "var(--text)",
            display: "flex", alignItems: "center", gap: "8px"
          }}>
            <span style={{ fontSize: 16, opacity: 0.4 }}>⏳</span>
            {Math.floor(timerSec / 60)}:{String(timerSec % 60).padStart(2, '0')}
          </div>
        </div>
      </div>
    </header>
  );
}

// ── Leaderboard (순위 교차 검증 + 공동 순위 로직 강화) ──────────────
export function Leaderboard({ teams, myTeamId = null }) {
  const [prevRanks, setPrevRanks] = useState({}); 
  const [diffs, setDiffs] = useState({});         
  const total = ROOMS_DATA.length;
  const ROW_H = 50; 

  // 1. 현재 순위 계산 (공동 순위 로직: 점수가 같으면 같은 순위)
  const sorted = [...teams].sort((a, b) => {
    const bCount = b.roomsDone?.length ?? 0;
    const aCount = a.roomsDone?.length ?? 0;
    return bCount - aCount;
  });

  let lastCount = -1;
  let lastRank = 0;
  const rankedTeams = sorted.map((team, index) => {
    const currentCount = team.roomsDone?.length ?? 0;
    if (currentCount !== lastCount) {
      lastRank = index + 1;
      lastCount = currentCount;
    }
    return { ...team, rank: lastRank };
  });

  // 2. 순위 변동 감지 (상대 팀과 비교하여 '순위 숫자'가 변했을 때만)
  useEffect(() => {
    const newDiffs = { ...diffs };
    let hasUpdate = false;

    rankedTeams.forEach((team) => {
      const oldRank = prevRanks[team.id];
      const newRank = team.rank;

      // 이전 기록이 있고, 실제로 순위 숫자(Rank)가 변한 경우 (상대를 추월하거나 추월당함)
      if (oldRank !== undefined && oldRank !== newRank) {
        // 숫자가 작아지면(예: 3위 -> 1위) UP, 커지면 DOWN
        const direction = newRank < oldRank ? "UP" : "DOWN";
        newDiffs[team.id] = direction;
        hasUpdate = true;

        // 5초 후 화살표 제거
        setTimeout(() => {
          setDiffs(curr => {
            const copy = { ...curr };
            delete copy[team.id];
            return copy;
          });
        }, 5000);
      }
    });

    // 현재 계산된 순위들을 다음 비교를 위해 저장
    const nextRanks = {};
    rankedTeams.forEach(t => { nextRanks[t.id] = t.rank; });
    setPrevRanks(nextRanks);

    if (hasUpdate) setDiffs(newDiffs);
  }, [teams]);

  return (
    <aside style={{
      width: 300, flexShrink: 0, background: "var(--surface)",
      borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      <div style={{
        padding: "12px 20px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
      }}>
        <div className="live-dot" />
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: 3, color: "var(--text2)" }}>LIVE STANDINGS</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
        {rankedTeams.map((team, i) => {
          const isMe = team.id === myTeamId;
          const solvedCount = team.roomsDone?.length ?? 0;
          const diff = diffs[team.id];

          return (
            <div key={team.id} style={{
              position: "absolute", left: 0, right: 0, 
              top: 8 + i * ROW_H,
              transition: "top 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
              display: "flex", alignItems: "center", 
              padding: "6px 18px", gap: 12,
              background: isMe ? "rgba(108,99,255,0.08)" : "transparent",
            }}>
              {/* 순위 영역: 변동 시 화살표, 아닐 시 숫자 */}
              <div style={{ 
                width: 32, display: "flex", justifyContent: "center", 
                fontFamily: "var(--mono)", fontSize: 16, fontWeight: 800 
              }}>
                {diff === "UP" ? (
                  <span style={{ color: "#00ff88", filter: "drop-shadow(0 0 5px #00ff88)", animation: "ptsPop 0.4s ease" }}>▲</span>
                ) : diff === "DOWN" ? (
                  <span style={{ color: "#ff4d4d", filter: "drop-shadow(0 0 5px #ff4d4d)", animation: "ptsPop 0.4s ease" }}>▼</span>
                ) : (
                  <span style={{ color: isMe ? "var(--accent)" : "var(--text2)" }}>{team.rank}</span>
                )}
              </div>

              {/* 팀 정보 & 3/7 진행도 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: team.color }}>
                  {team.name || `팀 ${team.id + 1}`}
                </div>
                {/* 진행도 바 */}
                <div style={{ flex: 1, height: 3, background: "var(--surface3)", borderRadius: 2, marginTop: 6 }}>
                  <div style={{ height: "100%", background: team.color, width: `${(solvedCount/total)*100}%`, transition: "width 1s" }} />
                </div>
              </div>

              {/* 포인트(점수)가 있던 자리에 진행도(분수) 표시 */}
              <div style={{ 
                fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, 
                color: solvedCount === total ? "var(--green)" : "var(--text)", 
                textAlign: "right", minWidth: 45 
              }}>
                {solvedCount}/{total}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}