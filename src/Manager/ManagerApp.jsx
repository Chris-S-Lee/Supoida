import { useState, useCallback } from "react";
import { ROOMS_DATA, INIT_TEAMS, pad, formatTime, btnStyle } from "../shared/constants.js";
import { Header, Leaderboard, Toast } from "../shared/components.jsx";
import { useSharedStore } from "../shared/store.js";

const EMOJIS = ["🌟","🔥","💎","⚡","🌊","🍀","🎯","🚀","🦊","🐉","🎪","🔮"];

function TeamCard({ team, rank, onNameChange, onEmojiChange, onOverride }) {
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput]     = useState(team.name || "");
  const [showEmoji, setShowEmoji]     = useState(false);
  const total = ROOMS_DATA.length;
  const pct   = Math.round(((team.roomsDone?.length ?? 0) / total) * 100);
  const displayName = team.name || `팀 ${team.id + 1}`;

  const commitName = () => {
    setEditingName(false);
    if (nameInput.trim()) onNameChange(team.id, nameInput.trim());
    else setNameInput(team.name || "");
  };

  return (
    <div style={{
      background:"var(--surface)", border:`1px solid ${team.color}33`,
      borderRadius:12, padding:20, position:"relative", overflow:"hidden",
    }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background: team.color, borderRadius:"12px 12px 0 0" }} />

      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
        <div style={{
          width:32, height:32, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center",
          fontFamily:"var(--mono)", fontSize:13, fontWeight:700, color:team.color,
          background: team.color + "22", flexShrink:0,
        }}>#{rank}</div>

        <div style={{ position:"relative" }}>
          <button onClick={() => setShowEmoji(v => !v)} style={{
            fontSize:22, background:"none", border:"1px solid var(--border)", borderRadius:8,
            width:44, height:44, cursor:"pointer", lineHeight:1,
          }}>{team.emoji}</button>
          {showEmoji && (
            <div style={{
              position:"absolute", top:48, left:0, zIndex:50,
              background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:8,
              padding:8, display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:4,
              animation:"slideIn 0.2s ease",
            }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => { onEmojiChange(team.id, e); setShowEmoji(false); }} style={{
                  fontSize:18, background:"none", border:"none", borderRadius:4,
                  cursor:"pointer", padding:4, lineHeight:1,
                }}>{e}</button>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          {editingName ? (
            <input
              autoFocus
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onBlur={commitName}
              onKeyDown={e => { if (e.key === "Enter") commitName(); if (e.key === "Escape") { setEditingName(false); setNameInput(team.name || ""); } }}
              style={{
                width:"100%", background:"var(--bg)", border:"1.5px solid var(--accent)",
                borderRadius:6, padding:"6px 10px", color:"var(--text)", fontSize:15,
                fontWeight:600, fontFamily:"var(--sans)", outline:"none",
              }}
            />
          ) : (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:15, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                {displayName}
              </span>
              {team.takenBy && <span style={{ fontSize:10, color:"var(--green)", fontFamily:"var(--mono)" }}>● 접속 중</span>}
              <button onClick={() => { setEditingName(true); setNameInput(team.name || ""); }} style={{
                background:"none", border:"1px solid var(--border)", borderRadius:4,
                color:"var(--text2)", cursor:"pointer", fontSize:10, padding:"2px 8px",
                fontFamily:"var(--mono)", letterSpacing:1, flexShrink:0,
              }}>✎ 편집</button>
            </div>
          )}
        </div>

        <div style={{ fontFamily:"var(--mono)", fontSize:20, fontWeight:700, color:"var(--accent2)", flexShrink:0 }}>
          {team.score}pt
        </div>
      </div>

      <div style={{ marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
          <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text2)", letterSpacing:1 }}>진행도</span>
          <span style={{ fontFamily:"var(--mono)", fontSize:10, color:team.color }}>{team.roomsDone?.length ?? 0}/{total} 방 ({pct}%)</span>
        </div>
        <div style={{ height:6, background:"var(--surface2)", borderRadius:3, overflow:"hidden" }}>
          <div style={{ height:"100%", background:team.color, width:`${pct}%`, borderRadius:3, transition:"width 0.6s ease" }} />
        </div>
      </div>

      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
        {ROOMS_DATA.map(room => {
          const done    = team.roomsDone?.includes(room.id);
          const current = team.currentRoom === room.id;
          return (
            <div key={room.id} style={{
              display:"flex", alignItems:"center", gap:4,
              padding:"3px 8px", borderRadius:4,
              background: done ? team.color + "22" : current ? "rgba(108,99,255,0.12)" : "var(--surface2)",
              border: `1px solid ${done ? team.color + "55" : current ? "rgba(108,99,255,0.4)" : "var(--border)"}`,
              fontSize:11, fontFamily:"var(--mono)", color: done ? team.color : current ? "var(--accent)" : "var(--text2)",
              transition:"all 0.3s",
            }}>
              <span style={{ fontSize:12 }}>{room.icon}</span>
              {room.label}
              {done    && <span style={{ fontSize:10 }}>✓</span>}
              {current && !done && <span style={{ fontSize:8, animation:"livepulse 1.5s infinite" }}>●</span>}
            </div>
          );
        })}
      </div>

      <details style={{ marginTop:4 }}>
        <summary style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:1, color:"var(--text2)", cursor:"pointer", userSelect:"none", padding:"4px 0" }}>
          ⚙ 수동 조정
        </summary>
        <div style={{ marginTop:10, display:"flex", gap:8, flexWrap:"wrap" }}>
          <button
            onClick={() => {
              const nextId = team.roomsDone?.length ?? 0;
              if (nextId < ROOMS_DATA.length) onOverride(team.id, { roomsDone:[...(team.roomsDone||[]), nextId], score: (team.score||0) + ROOMS_DATA[nextId].points, currentRoom:nextId });
            }}
            disabled={(team.roomsDone?.length ?? 0) >= ROOMS_DATA.length}
            style={{ ...smallBtn, opacity: (team.roomsDone?.length ?? 0) >= ROOMS_DATA.length ? 0.4 : 1 }}
          >+ 다음 방 클리어</button>
          <button
            onClick={() => {
              if (!team.roomsDone?.length) return;
              const prev = team.roomsDone.slice(0, -1);
              const lastRoom = team.roomsDone[team.roomsDone.length - 1];
              onOverride(team.id, { roomsDone:prev, score: Math.max(0, (team.score||0) - ROOMS_DATA[lastRoom].points), currentRoom: prev.length > 0 ? prev[prev.length-1] : 0 });
            }}
            disabled={!(team.roomsDone?.length)}
            style={{ ...smallBtn, borderColor:"rgba(255,107,107,0.4)", color:"var(--accent3)", opacity: !(team.roomsDone?.length) ? 0.4 : 1 }}
          >− 마지막 방 취소</button>
          <button
            onClick={() => onOverride(team.id, { ...INIT_TEAMS.find(t => t.id === team.id), name: team.name, emoji: team.emoji, takenBy: team.takenBy })}
            style={{ ...smallBtn, borderColor:"rgba(255,149,0,0.4)", color:"var(--orange)" }}
          >↺ 팀 리셋</button>
        </div>
      </details>
    </div>
  );
}

const smallBtn = {
  fontFamily:"var(--mono)", fontSize:10, letterSpacing:1, padding:"5px 12px",
  background:"none", border:"1px solid var(--border)", borderRadius:4,
  color:"var(--text2)", cursor:"pointer",
};

function GameStats({ teams }) {
  const total = ROOMS_DATA.length;
  const totalSolved = teams.reduce((s, t) => s + (t.roomsDone?.length ?? 0), 0);
  const leader = [...teams].sort((a,b) => b.score - a.score)[0];
  const avgPct  = Math.round(teams.reduce((s,t) => s + (t.roomsDone?.length ?? 0)/total*100, 0) / teams.length);
  const online  = teams.filter(t => t.takenBy).length;

  const statCard = (label, value, color="var(--accent2)") => (
    <div style={{ background:"var(--surface2)", borderRadius:8, padding:"14px 16px", flex:1, minWidth:120 }}>
      <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:2, color:"var(--text2)", marginBottom:6 }}>{label}</div>
      <div style={{ fontFamily:"var(--mono)", fontSize:22, fontWeight:700, color }}>{value}</div>
    </div>
  );

  return (
    <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
      {statCard("접속 팀", `${online}/${teams.length}`, "var(--green)")}
      {statCard("총 클리어", totalSolved)}
      {statCard("평균 진행도", `${avgPct}%`, "var(--accent)")}
      {statCard("1위 팀", leader?.name || "—", leader?.color ?? "var(--text)")}
      {statCard("1위 점수", `${leader?.score ?? 0}pt`, "var(--gold)")}
    </div>
  );
}

export default function ManagerApp() {
  const { state, updateTeamName, updateTeamEmoji, setTimerRunning, resetAll, overrideTeam } = useSharedStore();
  const [toast, setToast] = useState(null);

  if (!state) {
    return (
      <div style={{ background:"#0a0b14", height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }}>
        <div style={{ fontFamily:"var(--mono)" }}>연결 중...</div>
      </div>
    );
  }

  const { teams, timerSec, timerRunning } = state;
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  const safeTeams = teams.map(t => ({ ...t, roomsDone: t.roomsDone || [] }));

  const handleReset = () => {
    if (!window.confirm("전체 게임을 리셋하시겠습니까?\n(모든 팀의 진행상황과 세션이 초기화됩니다)")) return;
    resetAll();
    setToast("게임이 리셋되었습니다.");
  };

  const handleOverride = useCallback((teamId, patch) => {
    overrideTeam(teamId, patch);
    setToast("팀 정보가 업데이트되었습니다.");
  }, [overrideTeam]);

  return (
    <>
      <Header
        timerSec={timerSec}
        timerRunning={timerRunning}
        onToggleTimer={() => setTimerRunning(!timerRunning)}
        onReset={handleReset}
        rightSlot={
          <>
            <span style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:2, padding:"5px 12px", background:"rgba(108,99,255,0.15)", border:"1px solid rgba(108,99,255,0.4)", borderRadius:4, color:"var(--accent)" }}>
              ⚙ MANAGER
            </span>
            <a href="/" style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:1, padding:"6px 14px", border:"1px solid var(--border)", borderRadius:4, color:"var(--text2)", textDecoration:"none" }}>
              ← 클라이언트
            </a>
          </>
        }
      />

      <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", flex:1, overflow:"hidden" }}>
        {/* myTeamId=null → 매니저는 "나" 표시 없음 */}
        <Leaderboard teams={safeTeams} myTeamId={null} />

        <div style={{ flex:1, overflowY:"auto", background:"var(--bg)", padding:24, display:"flex", flexDirection:"column", gap:20 }}>

          <section>
            <div style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:3, color:"var(--text2)", marginBottom:12 }}>GAME STATS</div>
            <GameStats teams={safeTeams} />
          </section>

          <section>
            <div style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:3, color:"var(--text2)", marginBottom:12 }}>TEAM MANAGEMENT</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(360px, 1fr))", gap:14 }}>
              {sorted.map((team, i) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  rank={i + 1}
                  onNameChange={(id, name) => { updateTeamName(id, name); setToast("팀 이름이 변경되었습니다."); }}
                  onEmojiChange={(id, emoji) => { updateTeamEmoji(id, emoji); }}
                  onOverride={handleOverride}
                />
              ))}
            </div>
          </section>

          <section>
            <div style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:3, color:"var(--text2)", marginBottom:12 }}>ROOM OVERVIEW</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:10 }}>
              {ROOMS_DATA.map(room => {
                const cleared = safeTeams.filter(t => t.roomsDone.includes(room.id)).length;
                const here    = safeTeams.filter(t => t.currentRoom === room.id && !t.roomsDone.includes(room.id)).length;
                const pct = Math.round(cleared / teams.length * 100);
                return (
                  <div key={room.id} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:"12px 10px", textAlign:"center" }}>
                    <div style={{ fontSize:22, marginBottom:4 }}>{room.icon}</div>
                    <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--text2)", marginBottom:8, lineHeight:1.4 }}>{room.label}</div>
                    <div style={{ height:4, background:"var(--surface2)", borderRadius:2, overflow:"hidden", marginBottom:8 }}>
                      <div style={{ height:"100%", background:"var(--accent2)", width:`${pct}%`, borderRadius:2, transition:"width 0.6s" }} />
                    </div>
                    <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--accent2)", fontWeight:700 }}>{cleared}/{teams.length}</div>
                    {here > 0 && <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--orange)", marginTop:4 }}>⬤ {here}팀 도전중</div>}
                    <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--text2)", marginTop:2 }}>{room.points}pt</div>
                  </div>
                );
              })}
            </div>
          </section>

        </div>
      </div>

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </>
  );
}
