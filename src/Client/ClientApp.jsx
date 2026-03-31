import { useState, useEffect, useRef, useCallback } from "react";
import {
  ROOMS_DATA, CORRIDORS, CONFETTI_COLORS,
  SESSION_KEY, NICKNAMES,
  pad, isRoomUnlocked,
} from "../shared/constants.js";
import { Header, Leaderboard, Toast, GridBg } from "../shared/components.jsx";
import { useSharedStore } from "../shared/store.js";

// ── 세션 ID 생성 (브라우저당 고유) ─────────────────────────────────────────
function getOrCreateSessionId() {
  let id = localStorage.getItem("math_escape_session_id");
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("math_escape_session_id", id);
  }
  return id;
}

// ── 로그인 / 팀 선택 페이지 ───────────────────────────────────────────────
function LoginPage({ teams, onClaim }) {
  const [error, setError] = useState("");

  const handleTeamSelect = (team) => {
    if (team.takenBy) {
      setError("이미 다른 사람이 선택한 팀입니다.");
      return;
    }
    // 팀 이름을 닉네임으로 사용하여 즉시 입장
    onClaim(team.id, team.name);
  };

  return (
    <div style={{
      position:"fixed", inset:0, background:"#0a0b14", zIndex:1000,
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      padding:20, overflowY:"auto",
    }}>
      <GridBg />
      <div style={{ zIndex:1, width:"100%", maxWidth:640, animation:"modalIn 0.5s ease-out" }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ fontSize:40, marginBottom:10 }}>🗝️</div>
          <h1 style={{ fontFamily:"var(--mono)", letterSpacing:6, color:"#fff", fontSize:24, fontWeight:800, margin:0 }}>
            MATH ESCAPE
          </h1>
          <p style={{ color:"var(--accent2)", fontFamily:"var(--mono)", marginTop:8, fontSize:10, letterSpacing:2 }}>
            참가할 팀을 선택하세요
          </p>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10 }}>
          {teams.map((team) => {
            const taken = Boolean(team.takenBy);
            return (
              <button
                key={team.id}
                disabled={taken}
                onClick={() => handleTeamSelect(team)}
                style={{
                  background: "var(--surface)",
                  border: `1.5px solid ${taken ? "transparent" : "var(--border)"}`,
                  borderRadius:8, padding:"16px 8px", 
                  cursor: taken ? "not-allowed" : "pointer",
                  opacity: taken ? 0.3 : 1,
                  transition:"all 0.2s",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:6,
                }}
                onMouseEnter={e => !taken && (e.currentTarget.style.borderColor = team.color)}
                onMouseLeave={e => !taken && (e.currentTarget.style.borderColor = "var(--border)")}
              >
                {/* 팀 이름 표시 */}
                <span style={{
                  fontFamily:"var(--mono)", fontSize:15, fontWeight: 800,
                  color: taken ? "var(--text2)" : team.color,
                }}>
                  {team.name}
                </span>
                <span style={{ fontSize:9, color:"var(--text2)", fontFamily:"var(--mono)" }}>
                  {taken ? "참가 중" : "선택"}
                </span>
              </button>
            );
          })}
        </div>

        {error && (
          <div style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--accent3)", marginTop:20, textAlign:"center" }}>
            ⚠ {error}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Minimap ───────────────────────────────────────────────────────────────────
function Minimap({ solvedRooms, currentRoomId, onRoomClick }) {
  const MAP_W = 750, MAP_H = 420;
  return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:20, position:"relative", overflow:"hidden" }}>
      <GridBg />
      <div style={{ position:"relative", width:MAP_W, height:MAP_H, maxWidth:"100%" }}>
        <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }}>
          {CORRIDORS.map(([a, b]) => {
            const ra = ROOMS_DATA[a], rb = ROOMS_DATA[b];
            const solved = solvedRooms.includes(a) && solvedRooms.includes(b);
            return (
              <line key={`${a}-${b}`} x1={ra.x} y1={ra.y} x2={rb.x} y2={rb.y}
                stroke={solved ? "rgba(0,255,136,0.25)" : "rgba(42,42,64,0.9)"}
                strokeWidth={2} strokeDasharray={solved ? undefined : "6 4"} />
            );
          })}
        </svg>

        {ROOMS_DATA.map(room => {
          const solved   = solvedRooms.includes(room.id);
          const active   = room.id === currentRoomId;
          const unlocked = isRoomUnlocked(room.id, solvedRooms);
          let border = "var(--border)", bg = "var(--surface)", opacity = 1, cursor = "default", shadow = "none";
          if (solved)        { border="rgba(0,255,136,0.4)"; bg="rgba(0,255,136,0.05)"; }
          else if (active)   { border="var(--accent2)"; bg="rgba(0,212,170,0.08)"; shadow="0 0 24px rgba(0,212,170,0.25)"; }
          else if (unlocked) { border="rgba(108,99,255,0.5)"; cursor="pointer"; }
          else               { opacity=0.45; }

          return (
            <div key={room.id}
              onClick={() => onRoomClick(room.id)}
              style={{ position:"absolute", left:room.x, top:room.y, transform:"translate(-50%,-50%)", cursor: solved ? "default" : cursor, transition:"transform 0.2s" }}
              onMouseEnter={e => { if (unlocked && !solved) e.currentTarget.style.transform="translate(-50%,-50%) scale(1.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform="translate(-50%,-50%)"; }}
            >
              <div style={{ width:100, height:68, borderRadius:8, border:`1.5px solid ${border}`, background:bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4, opacity, boxShadow:shadow, position:"relative", overflow:"hidden", transition:"all 0.3s" }}>
                {solved  && <span style={{ position:"absolute", top:4, right:6, fontSize:12 }}>✅</span>}
                {!unlocked && !solved && <span style={{ position:"absolute", top:4, right:6, fontSize:11, opacity:0.5 }}>🔒</span>}
                <div style={{ fontSize:20 }}>{room.icon}</div>
                <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:1, color:"var(--text2)", textAlign:"center", lineHeight:1.3 }}>{room.label}</div>
                {active && <div style={{ position:"absolute", bottom:0, left:"50%", transform:"translateX(-50%)", width:40, height:2, background:"var(--accent2)", borderRadius:"2px 2px 0 0" }} />}
              </div>
            </div>
          );
        })}

        {/* Player token */}
        {(() => {
          const room = ROOMS_DATA[currentRoomId];
          return (
            <div style={{ position:"absolute", left:room.x, top:room.y - 44, transform:"translate(-50%,-50%)", pointerEvents:"none", zIndex:10, transition:"top 0.5s cubic-bezier(0.4,0,0.2,1), left 0.5s cubic-bezier(0.4,0,0.2,1)" }}>
              <div className="anim-float" style={{ width:28, height:28, borderRadius:"50%", background:"var(--accent)", border:"2px solid white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, boxShadow:"0 0 12px rgba(108,99,255,0.6)" }}>🧑</div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ── ProblemModal ──────────────────────────────────────────────────────────────
function ProblemModal({ room, onClose, onSolve }) {
  const [answer, setAnswer]         = useState("");
  const [hintVisible, setHintVisible] = useState(false);
  const [hintUsed, setHintUsed]     = useState(false);
  const [status, setStatus]         = useState("idle");
  const inputRef = useRef(null);

  useEffect(() => { const t = setTimeout(() => inputRef.current?.focus(), 300); return () => clearTimeout(t); }, []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubmit = () => {
    if (status === "correct") return;
    if (answer.trim() === room.answer) {
      const pts = hintUsed ? Math.max(room.points - 10, 10) : room.points;
      setStatus("correct");
      setTimeout(() => { onClose(); onSolve(room, pts); }, 700);
    } else {
      setStatus("wrong");
      setTimeout(() => setStatus("idle"), 500);
    }
  };

  const inputBorder = status === "correct" ? "1.5px solid var(--green)" : status === "wrong" ? "1.5px solid var(--accent3)" : "1.5px solid var(--border)";

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)" }}>
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, width:680, maxWidth:"95vw", maxHeight:"90vh", overflowY:"auto", padding:"36px 40px", position:"relative", animation:"modalIn 0.3s cubic-bezier(0.4,0,0.2,1)" }}>
        <button onClick={onClose} style={{ position:"absolute", top:20, right:24, background:"none", border:"1px solid var(--border)", color:"var(--text2)", width:32, height:32, borderRadius:4, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>

        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
          <span style={{ fontSize:28 }}>{room.icon}</span>
          <div>
            <div style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:3, color:"var(--accent)", marginBottom:4 }}>
              ROOM {pad(room.id + 1)} · {room.points}pt
            </div>
            <div style={{ fontSize:20, fontWeight:700 }}>{room.label}</div>
          </div>
        </div>

        <div style={{ background:"var(--surface2)", borderRadius:8, padding:"20px 24px", marginBottom:20 }}>
          <p style={{ color:"var(--text)", lineHeight:1.8, whiteSpace:"pre-line", marginBottom:16 }}>{room.problem}</p>
          <div style={{ fontFamily:"var(--mono)", fontSize:20, color:"var(--gold)", textAlign:"center", padding:"12px 0", letterSpacing:2 }}>{room.formula}</div>
        </div>

        <div style={{ display:"flex", gap:12, marginBottom:12 }}>
          <input
            ref={inputRef}
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="답을 입력하세요..."
            style={{ flex:1, background:"var(--bg)", border:inputBorder, padding:"13px 16px", borderRadius:8, color:"var(--text)", fontFamily:"var(--mono)", fontSize:16, outline:"none", transition:"border 0.2s", ...(status === "wrong" ? { animation:"shake 0.4s ease" } : {}) }}
          />
          <button onClick={handleSubmit} style={{ fontFamily:"var(--mono)", fontSize:13, letterSpacing:1, padding:"0 28px", background:"var(--accent)", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", transition:"filter 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.filter="brightness(1.15)"}
            onMouseLeave={e => e.currentTarget.style.filter="brightness(1)"}
          >제출</button>
        </div>

        <button
          onClick={() => { setHintVisible(v => !v); setHintUsed(true); }}
          style={{ fontFamily:"var(--mono)", fontSize:11, letterSpacing:1, padding:"7px 14px", border:"1px solid var(--border)", background:"transparent", color:"var(--text2)", cursor:"pointer", borderRadius:4 }}
        >💡 힌트 {hintUsed ? "(−10pt)" : ""}</button>

        {hintVisible && (
          <div style={{ marginTop:14, padding:"12px 16px", background:"rgba(255,215,0,0.06)", border:"1px solid rgba(255,215,0,0.2)", borderRadius:6, fontFamily:"var(--mono)", fontSize:13, color:"var(--gold)", animation:"slideIn 0.2s ease" }}>
            {room.hint}
          </div>
        )}

        <div style={{ marginTop:14, fontSize:14, fontWeight:500, minHeight:20, color: status === "correct" ? "var(--green)" : status === "wrong" ? "var(--accent3)" : "transparent" }}>
          {status === "correct" ? "🎉 정답입니다!" : status === "wrong" ? "❌ 틀렸습니다. 다시 시도해보세요!" : "."}
        </div>
      </div>
    </div>
  );
}

// ── Celebration ───────────────────────────────────────────────────────────────
function Celebration({ room, pts, totalScore, onClose }) {
  const isLast = room.id === ROOMS_DATA.length - 1;
  const confetti = useRef(Array.from({ length:28 }, (_, i) => ({
    id:i, left:Math.random()*100,
    color:CONFETTI_COLORS[Math.floor(Math.random()*CONFETTI_COLORS.length)],
    size:6+Math.random()*6, round:Math.random()>0.5,
    delay:Math.random()*0.4, dur:0.9+Math.random()*0.8,
  }))).current;

  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(6px)", animation:"modalIn 0.25s ease" }}>
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:16, padding:"44px 52px", textAlign:"center", position:"relative", overflow:"hidden", animation:"celebIn 0.4s cubic-bezier(0.34,1.56,0.64,1)", minWidth:340 }}>
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
          {confetti.map(p => (
            <div key={p.id} style={{ position:"absolute", top:-10, left:`${p.left}%`, width:p.size, height:p.size, borderRadius: p.round?"50%":2, background:p.color, animationName:"confettiFall", animationTimingFunction:"linear", animationFillMode:"forwards", animationDelay:`${p.delay}s`, animationDuration:`${p.dur}s` }} />
          ))}
        </div>
        <div style={{ fontSize:52, marginBottom:10, lineHeight:1 }}>{isLast ? "🏆" : "✅"}</div>
        <div style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:3, color:"var(--accent)", marginBottom:8 }}>ROOM {pad(room.id + 1)} 클리어!</div>
        <div style={{ fontSize:24, fontWeight:700, marginBottom:16 }}>{isLast ? "방탈출 완료!" : `${room.label} 정복!`}</div>
        <div style={{ fontFamily:"var(--mono)", fontSize:40, fontWeight:700, color:"var(--gold)", letterSpacing:2, textShadow:"0 0 24px rgba(255,215,0,0.5)", marginBottom:6, animation:"ptsPop 0.5s 0.2s cubic-bezier(0.34,1.56,0.64,1) both" }}>+{pts}pt</div>
        <div style={{ fontFamily:"var(--mono)", fontSize:13, color:"var(--text2)", marginBottom:28 }}>누적 점수: {totalScore}pt</div>
        <button onClick={onClose} style={{ fontFamily:"var(--mono)", fontSize:13, letterSpacing:1, padding:"12px 32px", background:"var(--accent)", color:"#fff", border:"none", borderRadius:8, cursor:"pointer" }}>
          {isLast ? "🎉 결과 보기" : "→ 계속하기"}
        </button>
      </div>
    </div>
  );
}

// ── ClientApp (메인) ──────────────────────────────────────────────────────────
export default function ClientApp() {
  const { state, claimTeam, solveRoom, moveTeam, setTimerRunning, tickTimer, resetAll } = useSharedStore();

  // 세션 ID (브라우저 탭 고유)
  const sessionId = useRef(getOrCreateSessionId()).current;

  // 내 팀 ID는 localStorage에 저장 (새로고침 유지)
  const [myTeamId, setMyTeamId]   = useState(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    return saved !== null ? Number(saved) : null;
  });
  const [currentRoomId, setCurrentRoomId] = useState(0);
  const [activeRoomId, setActiveRoomId]   = useState(null);
  const [celebration, setCelebration]     = useState(null);
  const [toast, setToast]                 = useState(null);

  // ── 타이머 tick (클라이언트만 담당, 매니저는 관찰만) ─────────────────────
  useEffect(() => {
    const interval = setInterval(tickTimer, 1000);
    return () => clearInterval(interval);
  }, [tickTimer]);

  // ── 서버 리셋 감지 → 로컬 세션 초기화 ────────────────────────────────────
  useEffect(() => {
    if (!state) return;
    if (myTeamId === null) return;
    const myTeam = state.teams[myTeamId];
    if (!myTeam || myTeam.takenBy !== sessionId) {
      localStorage.removeItem(SESSION_KEY);
      setMyTeamId(null);
    }
  }, [state?.resetToken]); // eslint-disable-line

  // ── 정답 처리 — Hook이므로 조건부 return 위에 선언 ───────────────────────
  const handleSolve = useCallback((room, pts) => {
    if (!state) return;
    const myTeam = myTeamId !== null ? state.teams[myTeamId] : null;
    if (!myTeam) return;
    solveRoom(myTeamId, room.id, pts);
    setCelebration({ room, pts, total: (myTeam.score || 0) + pts });
    if (room.id < ROOMS_DATA.length - 1) {
      const next = room.id + 1;
      setCurrentRoomId(next);
      moveTeam(myTeamId, next);
    }
  }, [state, myTeamId, solveRoom, moveTeam]);

  // ── 로딩 ─────────────────────────────────────────────────────────────────
  if (!state) {
    return (
      <div style={{ background:"#0a0b14", height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }}>
        <div style={{ fontFamily:"var(--mono)", letterSpacing:2 }}>연결 중...</div>
      </div>
    );
  }

  const { teams, timerSec, timerRunning } = state;
  const myTeam = myTeamId !== null ? teams[myTeamId] : null;

  // ── 팀 선택 (클레임) ──────────────────────────────────────────────────────
  const handleClaim = (teamId, name) => {
    claimTeam(teamId, name, sessionId);
    localStorage.setItem(SESSION_KEY, String(teamId));
    setMyTeamId(teamId);
  };

  // ── 방 클릭 ───────────────────────────────────────────────────────────────
  const handleRoomClick = (id) => {
    if (!myTeam) return;
    const doneList = myTeam.roomsDone || [];
    if (doneList.includes(id)) { setToast("이미 클리어한 방입니다."); return; }
    if (!isRoomUnlocked(id, doneList)) { setToast("아직 잠겨 있습니다."); return; }
    setActiveRoomId(id);
  };

  // ── 로그인 전 ─────────────────────────────────────────────────────────────
  if (!myTeam) {
    return <LoginPage teams={teams} onClaim={handleClaim} />;
  }

  const activeRoom = activeRoomId !== null ? ROOMS_DATA[activeRoomId] : null;
  const safeTeams  = teams.map(t => ({ ...t, roomsDone: t.roomsDone || [] }));

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:"var(--bg)" }}>
      <Header
        timerSec={timerSec}
        timerRunning={timerRunning}
        onToggleTimer={() => setTimerRunning(!timerRunning)}
        onReset={() => { if (window.confirm("모든 기록을 삭제할까요?")) resetAll(); }}
      />

      <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", flex:1, overflow:"hidden" }}>
        <Leaderboard teams={safeTeams} myTeamId={myTeamId} />

        <div style={{ display:"flex", flexDirection:"column", overflow:"hidden", background:"var(--bg)", position:"relative" }}>
          <div style={{ padding:"16px 24px 0", display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
            <span style={{ fontFamily:"var(--mono)", fontSize:11, letterSpacing:3, color:"var(--text2)" }}>WORLD MAP</span>
            <span style={{
              fontFamily:"var(--mono)", fontSize:12, padding:"4px 12px",
              background:"rgba(0,212,170,0.12)", border:"1px solid rgba(0,212,170,0.3)",
              borderRadius:20, color:"var(--accent2)",
            }}>
              {myTeam.emoji} {myTeam.name} : {myTeam.score || 0} PTS
            </span>
          </div>

          <Minimap solvedRooms={myTeam.roomsDone || []} currentRoomId={currentRoomId} onRoomClick={handleRoomClick} />
        </div>
      </div>

      {activeRoom && (
        <ProblemModal
          room={activeRoom}
          onClose={() => setActiveRoomId(null)}
          onSolve={handleSolve}
        />
      )}
      {celebration && (
        <Celebration
          room={celebration.room}
          pts={celebration.pts}
          totalScore={celebration.total}
          onClose={() => setCelebration(null)}
        />
      )}
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
