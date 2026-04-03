import { useState, useEffect, useRef, useCallback } from "react";
import {
  ROOMS_DATA, CONFETTI_COLORS,
  SESSION_KEY,
  pad,
} from "../shared/constants.js";
import { Header, Leaderboard, Toast, GridBg } from "../shared/components.jsx";
import { useSharedStore } from "../shared/store.js";

// ── 세션 ID ────────────────────────────────────────────────────────────────
function getOrCreateSessionId() {
  let id = localStorage.getItem("math_escape_session_id");
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("math_escape_session_id", id);
  }
  return id;
}

// ── 로그인 / 팀 선택 ────────────────────────────────────────────────────────
function LoginPage({ teams, onClaim }) {
  const [error, setError] = useState("");

  return (
    <div style={{
      position:"fixed", inset:0, background:"#0a0b14", zIndex:1000,
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      padding:20, overflowY:"auto",
    }}>
      <GridBg />
      <div style={{ zIndex:1, width:"100%", maxWidth:600, animation:"modalIn 0.5s ease-out" }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ fontSize:36, marginBottom:10 }}>🗝️</div>
          <h1 style={{ fontFamily:"var(--mono)", letterSpacing:6, color:"#fff", fontSize:22, fontWeight:800, margin:0 }}>
            MATH ESCAPE
          </h1>
          <p style={{ color:"var(--accent2)", fontFamily:"var(--mono)", marginTop:8, fontSize:10, letterSpacing:2 }}>
            참가할 팀을 선택하세요
          </p>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
          {teams.map((team) => {
            const taken = Boolean(team.takenBy);
            return (
              <button
                key={team.id}
                disabled={taken}
                onClick={() => {
                  if (taken) { setError("이미 다른 사람이 선택한 팀입니다."); return; }
                  onClaim(team.id, team.name);
                }}
                style={{
                  background:"var(--surface)",
                  border:`1.5px solid ${taken ? "transparent" : "var(--border)"}`,
                  borderRadius:8, padding:"14px 6px",
                  cursor: taken ? "not-allowed" : "pointer",
                  opacity: taken ? 0.3 : 1,
                  transition:"all 0.2s",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:5,
                }}
                onMouseEnter={e => !taken && (e.currentTarget.style.borderColor = team.color)}
                onMouseLeave={e => !taken && (e.currentTarget.style.borderColor = "var(--border)")}
              >
                <span style={{ fontFamily:"var(--mono)", fontSize:13, fontWeight:800, color: taken ? "var(--text2)" : team.color }}>
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
          <div style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--accent3)", marginTop:16, textAlign:"center" }}>
            ⚠ {error}
          </div>
        )}
      </div>
    </div>
  );
}

// ── RoomGrid (3×2, 순서 무관) ────────────────────────────────────────────────
function RoomGrid({ solvedRooms, onRoomClick, teamColor }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 10,
    }}>
      {ROOMS_DATA.map(room => {
        const solved = solvedRooms.includes(room.id);

        return (
          <div
            key={room.id}
            onClick={() => !solved && onRoomClick(room.id)}
            style={{
              border: `1.5px solid ${solved ? "rgba(0,255,136,0.45)" : "var(--border)"}`,
              background: solved ? "rgba(0,255,136,0.05)" : "var(--surface)",
              borderRadius: 10,
              padding: "14px 12px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 7,
              cursor: solved ? "default" : "pointer",
              position: "relative",
              overflow: "hidden",
              transition: "all 0.25s ease",
              minHeight: 110,
            }}
            onMouseEnter={e => {
              if (!solved) {
                e.currentTarget.style.borderColor = teamColor || "rgba(108,99,255,0.6)";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = `0 6px 20px ${teamColor ? teamColor + "30" : "rgba(108,99,255,0.15)"}`;
              }
            }}
            onMouseLeave={e => {
              if (!solved) {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "";
              }
            }}
          >
            {/* 클리어 뱃지 */}
            {solved && (
              <span style={{ position:"absolute", top:8, right:10, fontSize:12 }}>✅</span>
            )}

            {/* 포인트 */}
            <div style={{
              position:"absolute", top:8, left:10,
              fontFamily:"var(--mono)", fontSize:10, fontWeight:800,
              color: solved ? "var(--green)" : "var(--text2)",
              background:"var(--surface2)", padding:"2px 8px", borderRadius:4,
            }}>
              #{room.id + 1}  {/* 포인트 대신 문제 번호 표시 */}
            </div>

            {/* 아이콘 */}
            <div style={{ fontSize:28, lineHeight:1, marginTop:10 }}>{room.icon}</div>

            {/* 방 이름 */}
            <div style={{
              fontFamily:"var(--mono)", fontSize:11, letterSpacing:0.5,
              color: solved ? "var(--green)" : "var(--text)",
              textAlign:"center", fontWeight: solved ? 700 : 400,
            }}>
              {room.label}
            </div>

            {/* 토픽 태그 */}
            <div style={{
              fontSize:9, fontFamily:"var(--mono)",
              padding:"2px 8px", borderRadius:8,
              background: solved ? "rgba(0,255,136,0.1)" : "rgba(108,99,255,0.1)",
              color: solved ? "var(--green)" : "var(--accent)",
              border: `1px solid ${solved ? "rgba(0,255,136,0.2)" : "rgba(108,99,255,0.2)"}`,
              letterSpacing:0.5,
            }}>
              {room.topic}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── PasswordPanel ─────────────────────────────────────────────────────────────
const CORRECT_CODE = ROOMS_DATA.map(r => r.answer[0]).join("");

function PasswordPanel({ solvedRooms, teamColor }) {
  // 1. 상태 관리: inputCode로 통일
  const [inputCode, setInputCode] = useState("");
  const [status, setStatus] = useState("idle");

  const digits = ROOMS_DATA.map(room => ({
    digit: room.answer[0],
    revealed: solvedRooms.includes(room.id),
    room,
  }));

  const allRevealed = digits.every(d => d.revealed);

  // 2. 입력 제한 로직 (숫자만, 6자리까지)
  const handleInputChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
    setInputCode(val);
    setStatus("idle");
  };
  
  const handleSubmit = () => {
    if (inputCode === CORRECT_CODE) {
      setStatus("correct");
    } else {
      setStatus("wrong");
      setTimeout(() => setStatus("idle"), 1200);
    }
  };

  const color = teamColor || "var(--accent2)";

  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      padding: "16px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}>
      {/* 헤더 부분 */}
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:15 }}>🔐</span>
        <span style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:3, color:"var(--text2)" }}>SECRET PASSWORD</span>
        <span style={{ marginLeft:"auto", fontFamily:"var(--mono)", fontSize:9, color: allRevealed ? "var(--green)" : "var(--text2)" }}>
          {digits.filter(d => d.revealed).length}/{digits.length} 해제
        </span>
      </div>

      {/* 3. 비밀번호 디지트 박스 (유지: 이미 공개된 번호가 여기에 보입니다) */}
      <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
        {digits.map(({ digit, revealed, room }) => (
          <div key={room.id} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <div style={{
              width: 44, height: 54,
              borderRadius: 8,
              border: `1.5px solid ${revealed ? color : status === "wrong" ? "rgba(255,107,107,0.35)" : "var(--border)"}`,
              background: revealed ? color + "18" : "var(--surface2)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize: revealed ? 20 : 16,
              fontFamily:"var(--mono)", fontWeight:800,
              color: revealed ? color : "var(--text2)",
              boxShadow: revealed ? `0 0 12px ${color}33` : "none",
              transition:"all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
              position:"relative",
            }}>
              {revealed ? digit : "?"}
            </div>
          </div>
        ))}
      </div>

      {/* 4. 입력창 (수정: 숫자 6자리 제한 적용) */}
      <div style={{ display:"flex", gap:8 }}>
        <input
          type="text"
          inputMode="numeric" // 모바일에서 숫자 키패드 호출
          value={inputCode}
          onChange={handleInputChange} // 정의한 함수 연결
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          placeholder="숫자 6자리 입력"
          style={{
            flex:1, background:"var(--bg)",
            border:`1.5px solid ${status === "correct" ? "var(--green)" : status === "wrong" ? "var(--accent3)" : "var(--border)"}`,
            borderRadius:7, padding:"9px 14px",
            color:"var(--text)", fontFamily:"var(--mono)", fontSize:15, fontWeight:700,
            letterSpacing:4, outline:"none", textAlign:"center",
            transition:"border 0.2s",
            animation: status === "wrong" ? "shake 0.4s ease" : "none",
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={status === "correct"}
          style={{
            fontFamily:"var(--mono)", fontSize:11, letterSpacing:1,
            padding:"0 18px",
            background: status === "correct" ? "var(--green)" : "var(--accent)",
            color:"#fff", border:"none", borderRadius:7,
            cursor: status === "correct" ? "default" : "pointer",
            transition:"all 0.2s", whiteSpace:"nowrap",
          }}
        >
          {status === "correct" ? "🎉 성공!" : "확인"}
        </button>
      </div>

      {/* 상태 메시지 부분 유지 */}
      {status === "correct" && (
        <div style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--green)", textAlign:"center", padding:"8px", background:"rgba(0,255,136,0.07)", borderRadius:7, border:"1px solid rgba(0,255,136,0.2)" }}>
          🏆 정답! 방탈출 성공!
        </div>
      )}
    </div>
  );
}

// ── ProblemModal ──────────────────────────────────────────────────────────────
function ProblemModal({ room, onClose, onSolve }) {
  const [answer, setAnswer]           = useState("");
  const [status, setStatus]           = useState("idle");
  const inputRef = useRef(null);

  useEffect(() => { 
    const t = setTimeout(() => inputRef.current?.focus(), 300); 
    return () => clearTimeout(t); 
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubmit = () => {
    if (status === "correct") return;
    if (answer.trim() === room.answer) {
      // 힌트 사용 변수가 없어졌으므로 기본 포인트를 그대로 전달합니다.
      setStatus("correct");
      setTimeout(() => { onClose(); onSolve(room, room.points); }, 700);
    } else {
      setStatus("wrong");
      setTimeout(() => setStatus("idle"), 500);
    }
  };

  const inputBorder = status === "correct" 
    ? "1.5px solid var(--green)" 
    : status === "wrong" 
      ? "1.5px solid var(--accent3)" 
      : "1.5px solid var(--border)";

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)" }}>
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, width:660, maxWidth:"95vw", maxHeight:"90vh", overflowY:"auto", padding:"32px 36px", position:"relative", animation:"modalIn 0.3s cubic-bezier(0.4,0,0.2,1)" }}>
        <button onClick={onClose} style={{ position:"absolute", top:18, right:20, background:"none", border:"1px solid var(--border)", color:"var(--text2)", width:30, height:30, borderRadius:4, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>

        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <span style={{ fontSize:26 }}>{room.icon}</span>
          <div>
            <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:3, color:"var(--accent)", marginBottom:3 }}>
              ROOM {pad(room.id + 1)}
            </div>
            <div style={{ fontSize:18, fontWeight:700 }}>{room.label}</div>
          </div>
        </div>

        <div style={{ background:"var(--surface2)", borderRadius:8, padding:"18px 22px", marginBottom:18 }}>
          <p style={{ color:"var(--text)", lineHeight:1.8, whiteSpace:"pre-line", marginBottom:14, fontSize:14 }}>{room.problem}</p>
          <div style={{ fontFamily:"var(--mono)", fontSize:18, color:"var(--gold)", textAlign:"center", padding:"10px 0", letterSpacing:2 }}>{room.formula}</div>
        </div>

        <div style={{ display:"flex", gap:10, marginBottom:10 }}>
          <input
            ref={inputRef}
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="답을 입력하세요..."
            style={{ flex:1, background:"var(--bg)", border:inputBorder, padding:"12px 14px", borderRadius:8, color:"var(--text)", fontFamily:"var(--mono)", fontSize:15, outline:"none", transition:"border 0.2s", ...(status === "wrong" ? { animation:"shake 0.4s ease" } : {}) }}
          />
          <button onClick={handleSubmit}
            style={{ fontFamily:"var(--mono)", fontSize:12, letterSpacing:1, padding:"0 24px", background:"var(--accent)", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", transition:"filter 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.filter="brightness(1.15)"}
            onMouseLeave={e => e.currentTarget.style.filter="brightness(1)"}
          >제출</button>
        </div>

        {/* 💡 힌트 버튼 및 힌트 출력 창 코드가 삭제되었습니다. */}

        <div style={{ marginTop:12, fontSize:13, fontWeight:500, minHeight:20, color: status === "correct" ? "var(--green)" : status === "wrong" ? "var(--accent3)" : "transparent" }}>
          {status === "correct" ? "🎉 정답입니다!" : status === "wrong" ? "❌ 틀렸습니다. 다시 시도해보세요!" : "."}
        </div>
      </div>
    </div>
  );
}

// ── Celebration ───────────────────────────────────────────────────────────────
function Celebration({ room, pts, totalScore, onClose }) {
  const confetti = useRef(Array.from({ length:24 }, (_, i) => ({
    id:i, left:Math.random()*100,
    color:CONFETTI_COLORS[Math.floor(Math.random()*CONFETTI_COLORS.length)],
    size:5+Math.random()*5, round:Math.random()>0.5,
    delay:Math.random()*0.4, dur:0.9+Math.random()*0.8,
  }))).current;

  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t); }, [onClose]);

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(6px)", animation:"modalIn 0.25s ease" }}>
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:"38px 48px", textAlign:"center", position:"relative", overflow:"hidden", animation:"celebIn 0.4s cubic-bezier(0.34,1.56,0.64,1)", minWidth:300 }}>
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
          {confetti.map(p => (
            <div key={p.id} style={{ position:"absolute", top:-10, left:`${p.left}%`, width:p.size, height:p.size, borderRadius: p.round?"50%":2, background:p.color, animationName:"confettiFall", animationTimingFunction:"linear", animationFillMode:"forwards", animationDelay:`${p.delay}s`, animationDuration:`${p.dur}s` }} />
          ))}
        </div>
        <div style={{ fontSize:46, marginBottom:8, lineHeight:1 }}>✅</div>
        <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:3, color:"var(--accent)", marginBottom:6 }}>ROOM {pad(room.id + 1)} 클리어!</div>
        <div style={{ fontSize:22, fontWeight:700, marginBottom:14 }}>{room.label} 정복!</div>
        <div style={{ fontFamily:"var(--mono)", fontSize:36, fontWeight:700, color:"var(--gold)", letterSpacing:2, textShadow:"0 0 20px rgba(255,215,0,0.5)", marginBottom:4, animation:"ptsPop 0.5s 0.2s cubic-bezier(0.34,1.56,0.64,1) both" }}>+{pts}pt</div>
        <div style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--text2)", marginBottom:16 }}>누적 점수: {totalScore}pt</div>
        <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--accent2)", marginBottom:20, padding:"8px 14px", background:"rgba(0,212,170,0.08)", borderRadius:7, border:"1px solid rgba(0,212,170,0.22)" }}>
          🔐 비밀번호 {room.id + 1}번째 자리 공개!
        </div>
        <button onClick={onClose} style={{ fontFamily:"var(--mono)", fontSize:12, letterSpacing:1, padding:"10px 28px", background:"var(--accent)", color:"#fff", border:"none", borderRadius:7, cursor:"pointer" }}>
          → 계속하기
        </button>
      </div>
    </div>
  );
}

// ── ClientApp ─────────────────────────────────────────────────────────────────
export default function ClientApp() {
  const { state, claimTeam, solveRoom, moveTeam, setTimerRunning, tickTimer } = useSharedStore();

  const sessionId = useRef(getOrCreateSessionId()).current;
  const [myTeamId, setMyTeamId]     = useState(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    return saved !== null ? Number(saved) : null;
  });
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [celebration, setCelebration]   = useState(null);
  const [toast, setToast]               = useState(null);

  useEffect(() => {
    const interval = setInterval(tickTimer, 1000);
    return () => clearInterval(interval);
  }, [tickTimer]);

  useEffect(() => {
    if (!state || myTeamId === null) return;
    const myTeam = state.teams[myTeamId];
    if (!myTeam || myTeam.takenBy !== sessionId) {
      localStorage.removeItem(SESSION_KEY);
      setMyTeamId(null);
    }
  }, [state?.resetToken]); // eslint-disable-line

  const handleSolve = useCallback((room, pts) => {
    if (!state) return;
    const myTeam = myTeamId !== null ? state.teams[myTeamId] : null;
    if (!myTeam) return;
    solveRoom(myTeamId, room.id, pts);
    setCelebration({ room, pts, total: (myTeam.score || 0) + pts });
    moveTeam(myTeamId, room.id);
  }, [state, myTeamId, solveRoom, moveTeam]);

  if (!state || !state.teams) {
    return <div style={{color:'#fff'}}>Loading Teams...</div>;
  }
  // if (!state) {
  //   return (
  //     <div style={{ background:"#0a0b14", height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }}>
  //       <div style={{ fontFamily:"var(--mono)", letterSpacing:2 }}>연결 중...</div>
  //     </div>
  //   );
  // }

  const { teams, timerSec, timerRunning } = state;
  const myTeam = myTeamId !== null ? teams[myTeamId] : null;

  const handleClaim = (teamId, name) => {
    claimTeam(teamId, name, sessionId);
    localStorage.setItem(SESSION_KEY, String(teamId));
    setMyTeamId(teamId);
  };

  const handleRoomClick = (id) => {
    if (!myTeam) return;
    const doneList = myTeam.roomsDone || [];
    if (doneList.includes(id)) { setToast("이미 클리어한 방입니다."); return; }
    setActiveRoomId(id);
  };

  if (!myTeam) return <LoginPage teams={teams} onClaim={handleClaim} />;

  const activeRoom = activeRoomId !== null ? ROOMS_DATA[activeRoomId] : null;
  const safeTeams  = teams.map(t => ({ ...t, roomsDone: t.roomsDone || [] }));
  const myRoomsDone = myTeam.roomsDone || [];

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:"var(--bg)" }}>
      <Header
        timerSec={timerSec}
        timerRunning={timerRunning}
        onToggleTimer={() => setTimerRunning(!timerRunning)}
        // onReset={() => { if (window.confirm("모든 기록을 삭제할까요?")) resetAll(); }}
      />

      <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", flex:1, overflow:"hidden" }}>
        <Leaderboard teams={safeTeams} myTeamId={myTeamId} />

        <div style={{ display:"flex", flexDirection:"column", overflowY:"auto", background:"var(--bg)", position:"relative" }}>
          <GridBg />
          <div style={{ position:"relative", zIndex:1, padding:"18px 24px", display:"flex", flexDirection:"column", gap:14 }}>

            {/* 팀 정보 */}
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
              <span style={{ fontSize:12, fontWeight:900, color:"var(--text2)", letterSpacing:1.5 }}>ROOMS</span>
              <span style={{
                fontFamily:"var(--mono)", fontSize:11, padding:"3px 11px",
                background:"rgba(0,212,170,0.1)", border:"1px solid rgba(0,212,170,0.28)",
                borderRadius:16, color:"var(--accent2)",
              }}>
                {myTeam.emoji} {myTeam.name}
              </span>
              <span style={{ marginLeft:"auto", fontFamily:"var(--mono)", fontSize:10, color:"var(--text2)" }}>
                {myRoomsDone.length}/{ROOMS_DATA.length} 클리어
              </span>
            </div>

            {/* 방 그리드 */}
            <RoomGrid
              solvedRooms={myRoomsDone}
              onRoomClick={handleRoomClick}
              teamColor={myTeam.color}
            />

            {/* 비밀번호 패널 */}
            <PasswordPanel
              solvedRooms={myRoomsDone}
              teamColor={myTeam.color}
            />

          </div>
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
