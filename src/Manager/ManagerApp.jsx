import { useState, useCallback } from "react";
import { ROOMS_DATA, INIT_TEAMS } from "../shared/constants.js"; // INIT_TEAMS 추가
import { Header, Leaderboard, Toast } from "../shared/components.jsx";
import { useSharedStore } from "../shared/store.js";

const EMOJIS = ["🌟","🔥","💎","⚡","🌊","🍀","🎯","🚀","FOX","🐉","🎪","🔮"];

// ── 관리자 전용 액션 버튼 컴포넌트 ──────────────────────────────────────────
function AdminActionPanel({ team, onOverride, totalRooms }) {
  const sendAlert = (msg, type = "info") => {
    // onOverride를 통해 팀 데이터에 alert 필드를 심어 학생에게 전달
    onOverride(team.id, { 
      alert: { msg, type, ts: Date.now() } 
    });
  };

  const actionBtnStyle = (color) => ({
    padding: "6px 4px", fontSize: "10px", fontFamily: "var(--mono)",
    background: "transparent", border: `1px solid ${color}`, color: color,
    borderRadius: "4px", cursor: "pointer", transition: "all 0.2s",
    flex: "1 1 30%"
  });

  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)", display: "flex", flexWrap: "wrap", gap: 6 }}>
      {/* 1. 부정행위 경고 */}
      <button style={actionBtnStyle("#ff4d4d")} onClick={() => sendAlert("🚨 부정행위가 감지되었습니다! 주의하세요.", "warn")}>
        ⚠️ 부정 경고
      </button>

      {/* 2-4. 단계별 힌트 제공 */}
      <button style={actionBtnStyle("var(--green)")} onClick={() => sendAlert(`💡 [초급 힌트] ${ROOMS_DATA[team.currentRoom]?.label}: 문제의 조건을 다시 확인해보세요.`, "hint")}>
        🌱 초급 힌트
      </button>
      <button style={actionBtnStyle("var(--gold)")} onClick={() => sendAlert(`💡 [중급 힌트] ${ROOMS_DATA[team.currentRoom]?.label}: 공식의 순서를 바꿔보세요.`, "hint")}>
        🌿 중급 힌트
      </button>
      <button style={actionBtnStyle("var(--orange)")} onClick={() => sendAlert(`💡 [고급 힌트] ${ROOMS_DATA[team.currentRoom]?.label}: 정답은 ${ROOMS_DATA[team.currentRoom]?.answer.slice(0,1)}... 로 시작합니다.`, "hint")}>
        🌳 고급 힌트
      </button>

      {/* 5. 문제 초기화 (해당 문제만 미완료 상태로 변경) */}
      <button style={actionBtnStyle("var(--text2)")} onClick={() => {
        if(window.confirm("이 팀이 풀고 있는 현재 문제를 초기화할까요?")) {
          const newDone = (team.roomsDone || []).filter(id => id !== team.currentRoom);
          onOverride(team.id, { roomsDone: newDone });
          sendAlert("🔄 관리자가 현재 문제를 초기화했습니다. 다시 풀어보세요!");
        }
      }}>
        🔄 문제 초기화
      </button>

      {/* 6. 비밀번호 1개 제공 (랜덤) */}
      <button style={actionBtnStyle("var(--accent)")} onClick={() => {
        const remaining = ROOMS_DATA.filter(r => !(team.roomsDone || []).includes(r.id));
        if (remaining.length > 0) {
          const randomRoom = remaining[Math.floor(Math.random() * remaining.length)];
          const newDone = [...(team.roomsDone || []), randomRoom.id];
          onOverride(team.id, { roomsDone: newDone });
          sendAlert(`🔑 관리자가 보너스 비밀번호(${randomRoom.id + 1}번)를 해제했습니다!`, "success");
        }
      }}>
        🔑 비번 제공
      </button>
    </div>
  );
}

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

      {/* 실시간 관리자 액션 패널 추가 */}
      <AdminActionPanel team={team} onOverride={onOverride} totalRooms={total} />

      {/* <details style={{ marginTop:12 }}>
        <summary style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:1, color:"var(--text2)", cursor:"pointer", userSelect:"none", padding:"4px 0" }}>
          ⚙ 고급 수동 조정
        </summary>
        <div style={{ marginTop:10, display:"flex", gap:8, flexWrap:"wrap" }}>
          <button
            onClick={() => {
              const nextId = team.roomsDone?.length ?? 0;
              if (nextId < ROOMS_DATA.length) onOverride(team.id, { roomsDone:[...(team.roomsDone||[]), nextId], score: (team.score||0) + ROOMS_DATA[nextId].points, currentRoom:nextId });
            }}
            disabled={(team.roomsDone?.length ?? 0) >= ROOMS_DATA.length}
            style={{ ...smallBtn, opacity: (team.roomsDone?.length ?? 0) >= ROOMS_DATA.length ? 0.4 : 1 }}
          >+ 강제 클리어</button>
          <button
            onClick={() => onOverride(team.id, { ...INIT_TEAMS.find(t => t.id === team.id), name: team.name, emoji: team.emoji, takenBy: team.takenBy })}
            style={{ ...smallBtn, borderColor:"rgba(255,149,0,0.4)", color:"var(--orange)" }}
          >↺ 팀 초기화</button>
        </div>
      </details> */}
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
  // 1. 모든 훅은 반드시 최상단에 위치해야 합니다.
  const { state,updateTeamScore,resetAll,setTimerRunning,tickTimer,overrideTeam } = useSharedStore();
  const [toast, setToast] = useState(null);

  const handleUpdateScore = useCallback((teamId, amt) => {
    updateTeamScore(teamId, amt); // 상단에서 가져온 이름과 일치시킴
  }, [updateTeamScore]);

  const handleOverride = useCallback((teamId, newValues) => {
    if (overrideTeam) {
      overrideTeam(teamId, newValues);
      setToast("팀 정보가 수정되었습니다.");
    }
  }, [overrideTeam]);

  const handleReset = useCallback(() => {
    if (window.confirm("정말로 리셋하시겠습니까? 팀 이름은 유지됩니다.")) {
      resetAll();
      setToast("리셋 완료");
    }
  }, [resetAll]);

  // 2. 모든 훅 선언이 끝난 후에 조건부 렌더링을 합니다.
  if (!state) return <div style={{color:"white", padding:20}}>로딩 중...</div>;

  const { teams, timerSec, timerRunning } = state;
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  const safeTeams = teams.map(t => ({ ...t, roomsDone: t.roomsDone || [] }));
  const sortedTeams = [...teams].sort((a, b) => (b.score || 0) - (a.score || 0));

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
                    {/* <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--text2)", marginTop:2 }}>{room.points}pt</div> */}
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
