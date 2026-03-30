import { useState, useEffect, useRef, useCallback } from "react";
import { ROOMS_DATA, CORRIDORS, MY_TEAM_ID, CONFETTI_COLORS, pad, isRoomUnlocked } from "../shared/constants.js";
import { Header, Leaderboard, Toast, GridBg } from "../shared/components.jsx";
import { useSharedStore } from "../shared/store.js";

// ── 1. 로그인 전용 페이지 ──────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [name, setName] = useState("");

  const handleStart = () => {
    if (name.trim()) onLogin(name.trim());
  };

  return (
    <div style={{ 
      position: "fixed", inset: 0, background: "#0a0b14", zIndex: 1000,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" 
    }}>
      <GridBg />
      <div style={{ textAlign: "center", zIndex: 1, animation: "modalIn 0.6s ease-out" }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🗝️</div>
        <h1 style={{ 
          fontFamily: "var(--mono)", letterSpacing: 8, color: "#fff", 
          margin: "0 0 10px 0", fontSize: 42, fontWeight: 800 
        }}>MATH ESCAPE</h1>
        <p style={{ color: "var(--accent2)", fontFamily: "var(--mono)", marginBottom: 40, fontSize: 14 }}>
          READY TO SOLVE THE PUZZLE?
        </p>
        
        <div style={{ display: "flex", gap: 12, background: "rgba(255,255,255,0.05)", padding: 20, borderRadius: 16, border: "1px solid var(--border)" }}>
          <input 
            autoFocus
            value={name} 
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStart()}
            placeholder="팀 이름을 입력하세요..." 
            style={{ 
              background: "var(--bg)", border: "1px solid var(--border)", 
              padding: "15px 20px", borderRadius: 8, color: "#fff", 
              fontFamily: "var(--mono)", outline: "none", width: 280, fontSize: 16
            }} 
          />
          <button 
            onClick={handleStart}
            style={{ 
              background: "var(--accent)", color: "#fff", border: "none", 
              padding: "0 30px", borderRadius: 8, cursor: "pointer", 
              fontWeight: 700, fontSize: 16, transition: "0.2s"
            }}
            onMouseEnter={e => e.target.style.filter = "brightness(1.2)"}
            onMouseLeave={e => e.target.style.filter = "brightness(1)"}
          >
            START
          </button>
        </div>
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
  const [answer, setAnswer] = useState("");
  const [hintVisible, setHintVisible] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [status, setStatus] = useState("idle");
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

        <div style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:2, color:"var(--accent)", marginBottom:8 }}>ROOM {pad(room.id + 1)} — {room.topic}</div>
        <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:4 }}>
          <div style={{ fontSize:22, fontWeight:700 }}>{room.label}</div>
          <span style={{ fontFamily:"var(--mono)", fontSize:11, padding:"3px 10px", background:"rgba(255,215,0,0.1)", border:"1px solid rgba(255,215,0,0.3)", borderRadius:3, color:"var(--gold)" }}>★ {room.points}pt</span>
          <span style={{ display:"flex", gap:3 }}>
            {Array.from({ length:5 }, (_, i) => (
              <span key={i} style={{ width:6, height:6, borderRadius:"50%", display:"inline-block", background: i < room.diff ? "var(--accent3)" : "var(--border)" }} />
            ))}
          </span>
        </div>
        <div style={{ fontFamily:"var(--mono)", fontSize:13, color:"var(--text2)", marginBottom:28 }}>난이도 {"★".repeat(room.diff)}{"☆".repeat(5 - room.diff)} · 예상 {room.diff * 2}분</div>

        <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:8, padding:24, marginBottom:24 }}>
          <div style={{ fontSize:16, lineHeight:1.8, whiteSpace:"pre-line" }}>{room.problem}</div>
          <div style={{ fontFamily:"var(--mono)", fontSize:22, fontWeight:700, textAlign:"center", padding:"16px 0", color:"var(--accent2)", letterSpacing:2 }}>{room.formula}</div>
        </div>

        <div style={{ marginBottom:24 }}>
          <button onClick={() => { setHintVisible(v => !v); setHintUsed(true); }} style={{ fontFamily:"var(--mono)", fontSize:11, letterSpacing:1, color:"var(--text2)", background:"none", border:"1px solid var(--border)", padding:"7px 14px", borderRadius:4, cursor:"pointer" }}>
            💡 힌트 보기 (−10pt)
          </button>
          {hintVisible && (
            <div style={{ marginTop:12, padding:"14px 16px", background:"rgba(255,149,0,0.07)", border:"1px solid rgba(255,149,0,0.25)", borderRadius:6, fontSize:13, color:"var(--orange)", lineHeight:1.6 }}>
              {room.hint}
            </div>
          )}
        </div>

        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <input ref={inputRef} value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="정답 입력"
            style={{ flex:1, border:inputBorder, borderRadius:6, padding:"12px 16px", fontFamily:"var(--mono)", fontSize:20, color:"var(--text)", outline:"none", letterSpacing:3, textAlign:"center", transition:"border-color 0.2s", animation: status === "wrong" ? "shake 0.4s ease" : "none", background: status === "correct" ? "rgba(0,255,136,0.05)" : "var(--bg)" }} />
          <button onClick={handleSubmit} style={{ padding:"12px 28px", background:"var(--accent)", color:"#fff", border:"none", borderRadius:6, fontFamily:"var(--mono)", fontSize:13, letterSpacing:1, cursor:"pointer", whiteSpace:"nowrap" }}>제출 →</button>
        </div>
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

// ── 2. 메인 게임 페이지 ──────────────────────────────────────────────
export default function ClientApp() {
  // 1. 모든 Hook은 무조건 최상단!
  const { state, solveRoom, moveTeam, setTimerRunning, updateTeamName, resetAll } = useSharedStore();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState(0);
  const [activeRoomId, setActiveRoomId]     = useState(null);
  const [celebration, setCelebration]       = useState(null);
  const [toast, setToast]                   = useState(null);

  // 2. 로그인 상태 체크 useEffect
  // 외부 변수(myTeam)를 참조하지 않고 state에서 직접 찾아 에러를 방지합니다.
  useEffect(() => {
    if (state && state.teams) {
      const found = state.teams.find(t => t.id === MY_TEAM_ID);
      if (found && found.name !== "우리 팀" && found.name !== "") {
        setIsLoggedIn(true);
      }
    }
  }, [state]);

  // 3. 로딩 처리 (Hook 선언이 끝난 직후)
  if (!state) {
    return (
      <div style={{ background: "#0a0b14", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        <div style={{ fontFamily: "var(--mono)" }}>데이터베이스 연결 중...</div>
      </div>
    );
  }
  
  // 4. 데이터 안전하게 추출
  const { teams, timerSec, timerRunning } = state;
  const myTeam = teams?.find(t => t.id === MY_TEAM_ID);

  // myTeam이 없거나 초기화 중일 때를 위한 방어막
  if (!myTeam) return null;

  // 5. 이벤트 핸들러
  const handleLogin = (name) => {
    updateTeamName(MY_TEAM_ID, name);
    setIsLoggedIn(true);
  };

  const handleRoomClick = (id) => {
    // .includes 에러 방지: roomsDone이 없으면 빈 배열로 취급
    const doneList = myTeam.roomsDone || [];
    if (doneList.includes(id)) {
      setToast("이미 클리어한 방입니다.");
      return;
    }
    setActiveRoomId(id);
  };

  const handleSolve = (answer) => {
    const room = ROOMS_DATA[activeRoomId];
    if (answer.trim() === room.answer) {
      solveRoom(MY_TEAM_ID, activeRoomId, room.points);
      setCelebration({ room, pts: room.points, total: (myTeam.score || 0) + room.points });
      setActiveRoomId(null);
      if (activeRoomId < ROOMS_DATA.length - 1) {
        setCurrentRoomId(activeRoomId + 1);
        moveTeam(MY_TEAM_ID, activeRoomId + 1);
      }
    } else {
      setToast("오답입니다! 다시 생각해보세요.");
    }
  };

  // 6. 조건부 렌더링 (로그인)
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const activeRoom = activeRoomId !== null ? ROOMS_DATA[activeRoomId] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg)" }}>
      <Header 
        timerSec={timerSec} 
        timerRunning={timerRunning} 
        onToggleTimer={() => setTimerRunning(!timerRunning)} 
        onReset={() => confirm("모든 기록을 삭제할까요?") && resetAll()}
      />

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", flex: 1, overflow: "hidden" }}>
        {/* Leaderboard 내부에서 발생하는 .length 에러 방지를 위해 데이터를 안전하게 가공해서 넘김 */}
        <Leaderboard teams={teams.map(t => ({...t, roomsDone: t.roomsDone || []}))} />

        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg)", position: "relative" }}>
          <div style={{ padding: "16px 24px 0", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: 3, color: "var(--text2)" }}>WORLD MAP</span>
            <span style={{ 
              fontFamily: "var(--mono)", fontSize: 12, padding: "4px 12px", 
              background: "rgba(0,212,170,0.12)", border: "1px solid rgba(0,212,170,0.3)", 
              borderRadius: 20, color: "var(--accent2)" 
            }}>
              {myTeam.name} : {myTeam.score || 0} PTS
            </span>
          </div>

          {/* Minimap 에러 방지 */}
          <Minimap solvedRooms={myTeam.roomsDone || []} currentRoomId={currentRoomId} onRoomClick={handleRoomClick} />
        </div>
      </div>

      {activeRoom && <ProblemModal room={activeRoom} onClose={() => setActiveRoomId(null)} onSolve={handleSolve} />}
      {celebration && <Celebration room={celebration.room} pts={celebration.pts} totalScore={celebration.total} onClose={() => setCelebration(null)} />}
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  );
}