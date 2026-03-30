import { useEffect, useRef, useState } from "react";
import { ROOMS_DATA, MY_TEAM_ID, pad, formatTime, btnStyle } from "./constants.js";

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

// ── Leaderboard ──────────────────────────────────────────────────────────────
export function Leaderboard({ teams }) {
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  const total = ROOMS_DATA.length;
  const prevRankRef = useRef({});
  const [rankChanges, setRankChanges] = useState({});
  const ROW_H = 78;

  useEffect(() => {
    const newRankMap = {}, changes = {};
    sorted.forEach((team, i) => {
      const oldRank = prevRankRef.current[team.id];
      if (oldRank !== undefined && oldRank !== i + 1)
        changes[team.id] = oldRank > i + 1 ? "up" : "down";
      newRankMap[team.id] = i + 1;
    });
    prevRankRef.current = newRankMap;
    if (Object.keys(changes).length) {
      setRankChanges(changes);
      setTimeout(() => setRankChanges({}), 1400);
    }
  }, [teams]); // eslint-disable-line

  return (
    <aside style={{
      width:300, flexShrink:0, background:"var(--surface)",
      borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", overflow:"hidden",
    }}>
      <div style={{
        padding:"16px 20px", borderBottom:"1px solid var(--border)",
        display:"flex", alignItems:"center", gap:10, flexShrink:0,
      }}>
        <div className="live-dot" />
        <span style={{ fontFamily:"var(--mono)", fontSize:11, letterSpacing:3, color:"var(--text2)" }}>실시간 순위</span>
      </div>

      <div style={{ flex:1, overflowY:"auto", position:"relative", minHeight: sorted.length * ROW_H + 16 }}>
        {sorted.map((team, i) => {
          const change = rankChanges[team.id];
          const pct = Math.round((team.roomsDone.length / total) * 100);
          const isMe = team.id === MY_TEAM_ID;
          const curRoom = ROOMS_DATA[team.currentRoom];

          return (
            <div key={team.id} style={{
              position:"absolute", left:0, right:0, top: 8 + i * ROW_H,
              transition:"top 0.55s cubic-bezier(0.4,0,0.2,1)",
              display:"flex", alignItems:"center", padding:"10px 20px", gap:12,
              background: isMe ? "rgba(108,99,255,0.08)" : "transparent",
              ...(change === "up"   ? { animation:"flashUp 1.2s ease forwards" }   : {}),
              ...(change === "down" ? { animation:"flashDown 1.2s ease forwards" } : {}),
            }}>
              {isMe && <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3, background:"var(--accent)", borderRadius:"0 2px 2px 0" }} />}

              <span style={{
                fontSize:9, fontWeight:700, minWidth:14, textAlign:"center",
                color: change === "up" ? "#00e676" : change === "down" ? "#ff5252" : "transparent",
                animation: change === "up" ? "arrowUp 0.6s ease" : change === "down" ? "arrowDown 0.6s ease" : "none",
                flexShrink:0,
              }}>{change === "down" ? "▼" : "▲"}</span>

              <div style={{ fontFamily:"var(--mono)", fontSize:13, fontWeight:700, minWidth:28, color:"var(--text2)" }}>
                #{i + 1}
              </div>

              <div style={{ width:32, height:32, borderRadius:6, flexShrink:0, background: team.color + "22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>
                {team.emoji}
              </div>

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {team.name}
                  {isMe && <span style={{ color:"var(--accent)", fontSize:10, marginLeft:4 }}>(나)</span>}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
                  <div style={{ flex:1, height:4, background:"var(--surface2)", borderRadius:2, overflow:"hidden" }}>
                    <div style={{ height:"100%", borderRadius:2, background:team.color, width:`${pct}%`, transition:"width 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
                  </div>
                  <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text2)", whiteSpace:"nowrap" }}>
                    {team.roomsDone.length}/{total}
                  </span>
                </div>
                <div style={{ marginTop:3 }}>
                  <span style={{
                    fontFamily:"var(--mono)", fontSize:9, letterSpacing:1, padding:"2px 7px",
                    borderRadius:3, background: team.color + "18", color:team.color, border:`1px solid ${team.color}44`,
                  }}>{curRoom ? curRoom.topic : "—"}</span>
                </div>
              </div>

              <div style={{ fontFamily:"var(--mono)", fontSize:14, fontWeight:700, minWidth:44, textAlign:"right", color:"var(--accent2)" }}>
                {team.score}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
