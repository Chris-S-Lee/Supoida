import { useState, useCallback } from "react";
import { ROOMS_DATA, INIT_TEAMS } from "../shared/constants.js";
import { Header, Leaderboard, Toast } from "../shared/components.jsx";
import { useSharedStore } from "../shared/store.js";

const EMOJIS = ["🌟","🔥","💎","⚡","🌊","🍀","🎯","🚀","FOX","🐉","🎪","🔮"];

// ── AdminActionPanel ──────────────────────────────────────────
function AdminActionPanel({ team, onOverride, setToast }) {
  const sendHint = (level) => {
    const targetId = window.prompt("힌트를 줄 문제 번호를 입력하세요 (1~6):", team.currentRoom+1);
    if (!targetId) return;
    const idx = parseInt(targetId)-1;
    if (ROOMS_DATA[idx]) {
      const room = ROOMS_DATA[idx];
      const levelMap = { "초":"basic", "중":"mid", "고":"advanced" };
      const key = levelMap[level];
      const hintData = room.hints?.[key];
      if (!hintData) { setToast(`${level}급 힌트 데이터가 없습니다.`); return; }
      const newHint = { level:key, text:hintData.text, image:hintData.image||null, roomLabel:room.label, ts:Date.now() };
      const currentHints = team.hints || [];
      onOverride(team.id, { lastHint:newHint, hints:[...currentHints, newHint] });
      setToast(`${team.name} 팀에게 ${level}급 힌트를 전송했습니다.`);
    }
  };

  const actionBtnStyle = (color) => ({
    padding:"6px 4px", fontSize:"10px", fontFamily:"var(--mono)",
    background:"transparent", border:`1px solid ${color}`, color, borderRadius:"4px",
    cursor:"pointer", transition:"all 0.2s", flex:"1 1 30%"
  });

  const isPhase2 = Boolean(team.phase2);

  return (
    <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid var(--border)", display:"flex", flexWrap:"wrap", gap:6 }}>
      {/* 공습경보 / 파트2 버튼 */}
      <button
        style={{
          ...actionBtnStyle(isPhase2 ? "#00ff88" : "#ff4d4d"),
          flex:"1 1 100%",
          fontWeight:900,
          letterSpacing:2,
          fontSize:11,
          background: isPhase2 ? "rgba(0,255,136,0.08)" : "rgba(255,77,77,0.08)",
        }}
        onClick={() => {
          if (isPhase2) {
            if (window.confirm(`${team.name} 팀의 파트2를 해제하시겠습니까?`))
              onOverride(team.id, { phase2: false });
          } else {
            if (window.confirm(`${team.name} 팀에게 공습경보를 발동하고 파트2를 시작하시겠습니까?`))
              onOverride(team.id, { phase2: true });
          }
        }}
      >
        {isPhase2 ? "✅ PART2 진행중 (클릭=해제)" : "🚨 공습경보 발동 → PART 2"}
      </button>

      {/* 부정 경고 */}
      <button style={actionBtnStyle("#ff4d4d")} onClick={() => {
        const freezeTime = Date.now()+(3*60*1000);
        onOverride(team.id, { freezeUntil:freezeTime, alert:{ msg:"🚨 부정행위 감지로 3분간 활동이 정지됩니다.", type:"warn", ts:Date.now() } });
      }}>⚠️ 부정 경고</button>

      {/* 힌트 버튼 */}
      <button style={actionBtnStyle("var(--green)")} onClick={() => sendHint("초")}>🌱 초급</button>
      <button style={actionBtnStyle("var(--gold)")} onClick={() => sendHint("중")}>🌿 중급</button>
      <button style={actionBtnStyle("var(--orange)")} onClick={() => sendHint("고")}>🌳 고급</button>

      {/* 문제 초기화 */}
      <button style={actionBtnStyle("var(--text2)")} onClick={() => {
        const targetId = window.prompt("초기화할 문제 번호(1~6):");
        const idx = parseInt(targetId)-1;
        if (ROOMS_DATA[idx]) {
          const newDone = (team.roomsDone||[]).filter(id => id!==idx);
          onOverride(team.id, { roomsDone:newDone });
          setToast(`${targetId}번 문제 초기화 완료`);
        }
      }}>🔄 초기화</button>

      {/* 비번 제공 */}
      <button style={actionBtnStyle("var(--accent)")} onClick={() => {
        const targetId = window.prompt("비번 공개할 문제 번호(1~6):");
        const idx = parseInt(targetId)-1;
        if (ROOMS_DATA[idx]) {
          const newDone = Array.from(new Set([...(team.roomsDone||[]), idx]));
          onOverride(team.id, { roomsDone:newDone });
          setToast(`${targetId}번 정답 처리 완료`);
        }
      }}>🔑 비번 제공</button>
    </div>
  );
}

// ── TeamCard ──────────────────────────────────────────────────
function TeamCard({ team, rank, onNameChange, onEmojiChange, onOverride, setToast }) {
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(team.name||"");
  const [showEmoji, setShowEmoji] = useState(false);
  const total = ROOMS_DATA.length;
  const pct = Math.round(((team.roomsDone?.length??0)/total)*100);

  const commitName = () => {
    setEditingName(false);
    if (nameInput.trim()) onNameChange(team.id, nameInput.trim());
    else setNameInput(team.name||"");
  };

  const p2done = team.solvedP2?.length || 0;

  return (
    <div style={{ background:"var(--surface)", border:`1px solid ${team.color}33`, borderRadius:12, padding:20, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:team.color, borderRadius:"12px 12px 0 0" }} />

      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
        <div style={{ width:32, height:32, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--mono)", fontSize:13, fontWeight:700, color:team.color, background:team.color+"22", flexShrink:0 }}>#{rank}</div>

        <div style={{ position:"relative" }}>
          <button onClick={() => setShowEmoji(v=>!v)} style={{ fontSize:22, background:"none", border:"1px solid var(--border)", borderRadius:8, width:44, height:44, cursor:"pointer", lineHeight:1 }}>{team.emoji}</button>
          {showEmoji && (
            <div style={{ position:"absolute", top:48, left:0, zIndex:50, background:"var(--surface3)", border:"1px solid var(--border)", borderRadius:8, padding:8, display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:4, animation:"slideIn 0.2s ease" }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => { onEmojiChange(team.id,e); setShowEmoji(false); }} style={{ fontSize:18, background:"none", border:"none", borderRadius:4, cursor:"pointer", padding:4, lineHeight:1 }}>{e}</button>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          {editingName ? (
            <input autoFocus value={nameInput} onChange={e=>setNameInput(e.target.value)}
              onBlur={commitName} onKeyDown={e=>{ if(e.key==="Enter")commitName(); if(e.key==="Escape"){setEditingName(false);setNameInput(team.name||"");} }}
              style={{ width:"100%", background:"var(--bg)", border:"1.5px solid var(--accent)", borderRadius:6, padding:"6px 10px", color:"var(--text)", fontSize:15, fontWeight:600, fontFamily:"var(--sans)", outline:"none" }}
            />
          ) : (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:16, fontWeight:700, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{team.name||`팀 ${team.id+1}`}</span>
              <button onClick={() => setEditingName(true)} style={{ fontSize:12, background:"none", border:"none", color:"var(--text2)", cursor:"pointer", flexShrink:0 }}>✏️</button>
            </div>
          )}
          <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--text2)", marginTop:4 }}>
            {team.takenBy ? "🟢 접속중" : "⚫ 오프라인"}
          </div>
        </div>
      </div>

      {/* 진행도 바 (파트1) */}
      <div style={{ marginBottom:8 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
          <span style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--text2)" }}>PART 1</span>
          <span style={{ fontFamily:"var(--mono)", fontSize:9, color:team.color }}>{team.roomsDone?.length??0}/{total}</span>
        </div>
        <div style={{ height:4, background:"var(--surface3)", borderRadius:2 }}>
          <div style={{ height:"100%", background:team.color, width:`${pct}%`, borderRadius:2, transition:"width 0.6s" }} />
        </div>
      </div>

      {/* 파트2 진행도 */}
      {team.phase2 && (
        <div style={{ marginBottom:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <span style={{ fontFamily:"var(--mono)", fontSize:9, color:"#ff4d4d" }}>PART 2 🚨</span>
            <span style={{ fontFamily:"var(--mono)", fontSize:9, color:"#ff4d4d" }}>{p2done}/3</span>
          </div>
          <div style={{ height:4, background:"var(--surface3)", borderRadius:2 }}>
            <div style={{ height:"100%", background:"#ff4d4d", width:`${(p2done/3)*100}%`, borderRadius:2, transition:"width 0.6s" }} />
          </div>
        </div>
      )}

      <AdminActionPanel team={team} onOverride={onOverride} setToast={setToast} />
    </div>
  );
}

function GameStats({ teams }) {
  const total = ROOMS_DATA.length;
  const totalSolved = teams.reduce((s,t) => s+(t.roomsDone?.length??0), 0);
  const leader = [...teams].sort((a,b) => b.score-a.score)[0];
  const avgPct = Math.round(teams.reduce((s,t) => s+(t.roomsDone?.length??0)/total*100, 0)/teams.length);
  const online = teams.filter(t=>t.takenBy).length;
  const phase2count = teams.filter(t=>t.phase2).length;

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
      {statCard("1위 팀", leader?.name||"—", leader?.color??"var(--text)")}
      {statCard("PART2 팀", `${phase2count}/${teams.length}`, "#ff4d4d")}
    </div>
  );
}

export default function ManagerApp() {
  const { state, updateTeamScore, resetAll, setTimerRunning, setTimerSeconds, tickTimer, overrideTeam, startTimerToTarget } = useSharedStore();
  const [toast, setToast] = useState(null);
  const [inputMin, setInputMin] = useState(80);

  const handleOverride = useCallback((teamId, newValues) => {
    if (overrideTeam) {
      overrideTeam(teamId, newValues);
      setToast("팀 정보가 수정되었습니다.");
    }
  }, [overrideTeam]);

  if (!state) return <div style={{color:"white", padding:20}}>로딩 중...</div>;

  const { teams, timerSec, timerRunning } = state;
  const sorted = [...teams].sort((a,b) => b.score-a.score);
  const safeTeams = teams.map(t => ({ ...t, roomsDone:t.roomsDone||[] }));

  // 일괄 공습경보 버튼
  const handleAllPhase2 = () => {
    if (!window.confirm("모든 팀에게 공습경보를 발동하고 파트2를 시작하시겠습니까?")) return;
    teams.forEach(t => overrideTeam(t.id, { phase2:true }));
    setToast("전체 팀 파트2 시작!");
  };

  return (
    <>
      <Header
        timerSec={state?.timerSec||0}
        timerRunning={state?.timerRunning||false}
        isAdmin={true}
        onToggleTimer={() => setTimerRunning(!state.timerRunning)}
      />

      <section style={{ padding:"20px", background:"var(--surface)", margin:"10px", borderRadius:"8px" }}>
        <h3 style={{ color:"#fff", marginBottom:"10px" }}>타이머 수동 설정</h3>
        <div style={{ display:"flex", gap:"10px", alignItems:"center", flexWrap:"wrap" }}>
          <input type="number" value={inputMin} onChange={e=>setInputMin(e.target.value)}
            style={{ width:"60px", padding:"8px", borderRadius:"4px", border:"1px solid var(--border)", background:"#000", color:"#fff" }}
          />
          <span style={{ color:"#fff" }}>분으로</span>
          <button onClick={() => setTimerSeconds(inputMin*60)} style={{ padding:"8px 16px", background:"var(--accent)", color:"#fff", border:"none", borderRadius:"4px", cursor:"pointer" }}>설정 적용</button>
          <button onClick={() => setTimerSeconds(10*60)} style={{ fontSize:"11px" }}>10분</button>
          <button onClick={() => setTimerSeconds(30*60)} style={{ fontSize:"11px" }}>30분</button>
          <button onClick={() => setTimerSeconds(60*60)} style={{ fontSize:"11px" }}>60분</button>

          {/* 전체 파트2 버튼 */}
          <button onClick={handleAllPhase2} style={{ padding:"8px 16px", background:"rgba(255,77,77,0.15)", border:"1px solid #ff4d4d", color:"#ff4d4d", borderRadius:"4px", cursor:"pointer", fontSize:12, fontWeight:900, letterSpacing:1, marginLeft:"auto" }}>
            🚨 전체 공습경보 발동
          </button>
          <button onClick={resetAll} style={{ padding:"6px 12px", background:"transparent", color:"var(--text2)", border:"1px solid var(--border)", borderRadius:"4px", cursor:"pointer", fontSize:"11px" }}>
            🔄 전체 데이터 리셋
          </button>
        </div>
      </section>

      <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", flex:1, overflow:"hidden" }}>
        <Leaderboard teams={safeTeams} myTeamId={null} />

        <div style={{ flex:1, overflowY:"auto", background:"var(--bg)", padding:24, display:"flex", flexDirection:"column", gap:20 }}>

          <section>
            <div style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:3, color:"var(--text2)", marginBottom:12 }}>GAME STATS</div>
            <GameStats teams={safeTeams} />
          </section>

          <section>
            <div style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:3, color:"var(--text2)", marginBottom:12 }}>TEAM MANAGEMENT</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(360px,1fr))", gap:14 }}>
              {sorted.map((team,i) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  rank={i+1}
                  onNameChange={(id,name) => { overrideTeam(id,{name}); setToast("팀 이름이 변경되었습니다."); }}
                  onEmojiChange={(id,emoji) => { overrideTeam(id,{emoji}); }}
                  onOverride={handleOverride}
                  setToast={setToast}
                />
              ))}
            </div>
          </section>

          <section>
            <div style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:3, color:"var(--text2)", marginBottom:12 }}>ROOM OVERVIEW</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:10 }}>
              {ROOMS_DATA.map(room => {
                const cleared = safeTeams.filter(t=>t.roomsDone.includes(room.id)).length;
                const here = safeTeams.filter(t=>t.currentRoom===room.id&&!t.roomsDone.includes(room.id)).length;
                const pct = Math.round(cleared/teams.length*100);
                return (
                  <div key={room.id} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:"12px 10px", textAlign:"center" }}>
                    <div style={{ fontSize:22, marginBottom:4 }}>{room.icon}</div>
                    <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--text2)", marginBottom:8, lineHeight:1.4 }}>{room.label}</div>
                    <div style={{ height:4, background:"var(--surface3)", borderRadius:2, overflow:"hidden", marginBottom:8 }}>
                      <div style={{ height:"100%", background:"var(--accent2)", width:`${pct}%`, borderRadius:2, transition:"width 0.6s" }} />
                    </div>
                    <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--accent2)", fontWeight:700 }}>{cleared}/{teams.length}</div>
                    {here>0 && <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--orange)", marginTop:4 }}>⬤ {here}팀 도전중</div>}
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
