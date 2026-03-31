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

// ── GridBg ───────────────────────────────────────────────────────────────────
export function GridBg() {
  return (
    <div style={{
      position:"absolute", inset:0, pointerEvents:"none",
      backgroundImage:"linear-gradient(rgba(108,99,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(108,99,255,0.03) 1px,transparent 1px)",
      backgroundSize:"40px 40px",
    }} />
  );
}

// ── Header ───────────────────────────────────────────────────────────────────
export function Header({ timerSec, timerRunning, onToggleTimer, onReset, rightSlot }) {
  const urgent = timerSec < 300;
  return (
    <header style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"12px 24px", background:"var(--surface)",
      borderBottom:"1px solid var(--border)", zIndex:10, flexShrink:0,
    }}>
      <div style={{ fontFamily:"var(--mono)", fontSize:18, fontWeight:700, letterSpacing:2, color:"var(--accent)" }}>
        MATH<span style={{ color:"var(--accent2)" }}>_</span>ESCAPE
      </div>
      <div style={{
        fontFamily:"var(--mono)", fontSize:28, fontWeight:700,
        color: urgent ? "var(--accent3)" : "var(--gold)",
        letterSpacing:4, textShadow: urgent ? "none" : "0 0 20px rgba(255,215,0,0.4)",
        ...(urgent ? { animation:"pulse 1s infinite" } : {}),
      }}>
        {formatTime(timerSec)}
      </div>
      <div style={{ display:"flex", gap:12, alignItems:"center" }}>
        {rightSlot}
        <button onClick={onToggleTimer} style={btnStyle}>{timerRunning ? "⏸ 일시정지" : "▶ 재개"}</button>
        <button onClick={onReset}       style={btnStyle}>↺ 리셋</button>
      </div>
    </header>
  );
}

// ── Leaderboard ──────────────────────────────────────────────
export function Leaderboard({ teams, myTeamId = null }) {
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  const total = ROOMS_DATA.length;
  
  // 행간 너비를 줄이기 위해 높이 값을 78에서 50으로 조정
  const ROW_H = 50; 

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
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: 3, color: "var(--text2)" }}>실시간 순위</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", position: "relative", minHeight: sorted.length * ROW_H + 16 }}>
        {sorted.map((team, i) => {
          const pct = Math.round(((team.roomsDone?.length ?? 0) / total) * 100);
          const isMe = team.id === myTeamId;
          const curRoom = ROOMS_DATA[team.currentRoom];
          // 팀 이름이 없을 경우 기본값 표시
          const displayName = team.name || `팀 ${team.id + 1}`; 

          return (
            <div key={team.id} style={{
              position: "absolute", left: 0, right: 0, 
              top: 8 + i * ROW_H, // 간격 조정 적용
              transition: "top 0.55s cubic-bezier(0.4,0,0.2,1)",
              display: "flex", alignItems: "center", 
              padding: "6px 20px", // 세로 패딩 축소
              gap: 10,
              background: isMe ? "rgba(108,99,255,0.08)" : "transparent",
            }}>
              {isMe && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "var(--accent)", borderRadius: "0 2px 2px 0" }} />}

              {/* 순위 */}
              <div style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, minWidth: 24, color: "var(--text2)" }}>
                #{i + 1}
              </div>

              {/* 팀 아이콘/이름 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: team.color }}>
                  {displayName}
                  {isMe && <span style={{ color: "var(--accent)", fontSize: 10, marginLeft: 4 }}>(나)</span>}
                </div>
                {/* 진행바 (간격을 위해 높이 축소) */}
                <div style={{ height: 3, background: "var(--surface2)", borderRadius: 2, overflow: "hidden", marginTop: 4 }}>
                  <div style={{ height: "100%", background: team.color, width: `${pct}%`, transition: "width 0.8s" }} />
                </div>
              </div>

              {/* 점수 */}
              <div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, minWidth: 40, textAlign: "right", color: "var(--accent2)" }}>
                {team.score}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}