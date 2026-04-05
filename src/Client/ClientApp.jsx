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
              background:"var(--surface3)", padding:"2px 8px", borderRadius:4,
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
              fontSize: 9, 
              fontFamily: "var(--mono)",
              padding: "2px 8px", 
              borderRadius: 8,
              // 1. 배경색 결정 (이미 풀었으면 녹색, 아니면 난이도별 색상)
              background: solved 
                ? "rgba(0,255,136,0.1)" 
                : room.topic === "난이도 상" ? "rgba(255,77,77,0.1)" 
                : room.topic === "난이도 중" ? "rgba(255,204,0,0.1)" 
                : "rgba(77,148,255,0.1)", // "하" 또는 기본값
              
              // 2. 글자색 결정
              color: solved 
                ? "var(--green)" 
                : room.topic === "난이도 상" ? "#ff4d4d" 
                : room.topic === "난이도 중" ? "#ffcc00" 
                : "#4d94ff",
              
              // 3. 테두리색 결정
              border: `1px solid ${
                solved 
                  ? "rgba(0,255,136,0.2)" 
                  : room.topic === "난이도 상" ? "rgba(255,77,77,0.2)" 
                  : room.topic === "난이도 중" ? "rgba(255,204,0,0.2)" 
                  : "rgba(77,148,255,0.2)"
              }`,
              letterSpacing: 0.5,
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
const CORRECT_CODE = ROOMS_DATA.map(r => r.pw).join("");

function PasswordPanel({ solvedRooms, teamColor }) {
  // 1. 상태 관리: inputCode로 통일
  const [inputCode, setInputCode] = useState("");
  const [status, setStatus] = useState("idle");

  const digits = ROOMS_DATA.map(room => ({
    digit: room.pw,
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
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("idle");
  const inputRef = useRef(null);

  useEffect(() => { 
    const t = setTimeout(() => inputRef.current?.focus(), 300); 
    return () => clearTimeout(t); 
  }, []);

  const handleSubmit = () => {
    if (status === "correct") return;
    if (answer.trim() === room.answer) {
      setStatus("correct");
      setTimeout(() => { onClose(); onSolve(room, room.points); }, 700);
    } else {
      setStatus("wrong");
      setTimeout(() => setStatus("idle"), 500);
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(8px)" }}>
      <div style={{ 
        background:"var(--surface)", border:"1px solid var(--border)", borderRadius:16, 
        width:700, maxWidth:"95vw", padding:"30px", position:"relative", 
        animation:"modalIn 0.3s cubic-bezier(0.4,0,0.2,1)", textAlign:"center" 
      }}>
        {/* 닫기 버튼 */}
        <button onClick={onClose} style={{ position:"absolute", top:15, right:15, background:"none", border:"none", color:"var(--text2)", cursor:"pointer", fontSize:20 }}>✕</button>

        {/* 상단 정보 */}
        <div style={{ marginBottom:20 }}>
           <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--accent)", letterSpacing:2 }}>QUIZ {room.id + 1}</span>
           <h2 style={{ margin:0, fontSize:20, color:"#fff" }}>{room.label}</h2>
        </div>

        {/* 이미지 영역: 텍스트 대신 사진만 노출 */}
        <div style={{ 
          background:"#000", borderRadius:12, overflow:"hidden", marginBottom:25,
          border:"1px solid var(--border)", display:"flex", justifyContent:"center", alignItems:"center",
          minHeight: "300px"
        }}>
          <img 
            src={room.image} 
            alt="문제 이미지" 
            style={{ maxWidth:"100%", maxHeight:"450px", display:"block", objectFit:"contain" }} 
          />
        </div>

        {/* 정답 입력창 */}
        <div style={{ display:"flex", gap:10, maxWidth:400, margin:"0 auto" }}>
          <input
            ref={inputRef}
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="정답을 입력하세요"
            style={{ 
              flex:1, background:"var(--bg)", border: status === "wrong" ? "2px solid var(--accent3)" : "2px solid var(--border)", 
              padding:"14px", borderRadius:10, color:"#fff", textAlign:"center", fontSize:18, fontWeight:700, outline:"none",
              animation: status === "wrong" ? "shake 0.4s ease" : "none"
            }}
          />
          <button onClick={handleSubmit}
            style={{ padding:"0 25px", background:"var(--accent)", color:"#fff", border:"none", borderRadius:10, fontWeight:700, cursor:"pointer" }}
          >확인</button>
        </div>

        <div style={{ marginTop:15, height:20, fontSize:14, color: status === "correct" ? "var(--green)" : "var(--accent3)" }}>
          {status === "correct" ? "✨ 정답입니다!" : status === "wrong" ? "❌ 다시 생각해보세요" : ""}
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
        <div style={{ fontSize:22, fontWeight:700, marginBottom:14 }}>{room.label} 완료!</div>
        {/* <div style={{ fontFamily:"var(--mono)", fontSize:36, fontWeight:700, color:"var(--gold)", letterSpacing:2, textShadow:"0 0 20px rgba(255,215,0,0.5)", marginBottom:4, animation:"ptsPop 0.5s 0.2s cubic-bezier(0.34,1.56,0.64,1) both" }}>+{pts}pt</div> */}
        {/* <div style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--text2)", marginBottom:16 }}>누적 점수: {totalScore}pt</div> */}
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

// ── HintChat (알림 숫자 제거 로직 추가) ──────────────────────────────────────────
function HintChat({ hints, unreadCount, onOpenChat }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHint, setSelectedHint] = useState(null); 
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [hints, isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    onOpenChat(); // 알림 숫자 초기화 함수 호출
  };

  // 난이도별 색상 매핑 함수
  const getLevelColor = (level) => {
    switch(level) {
      case 'advanced': return '#ff4d4d'; // 고 (빨강)
      case 'mid':      return '#ffcc00'; // 중 (노랑)
      case 'basic':    return '#4d94ff'; // 초 (파랑)
      default:         return 'var(--accent)'; 
    }
  };

  return (
    <>
      {!isOpen && (
        <button onClick={handleOpen} className="anim-float" style={{
          position: "fixed", bottom: 25, right: 25, width: 65, height: 65,
          borderRadius: "50%", background: "var(--accent)", border: "none",
          boxShadow: "0 8px 24px rgba(108,99,255,0.4)", cursor: "pointer", zIndex: 1001,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30
        }}>
          💬
          {unreadCount > 0 && (
            <div style={{ 
              position: "absolute", top: -2, right: -2, background: "#ff4d4d", 
              color: "#fff", fontSize: 11, fontWeight: 800, padding: "2px 8px", 
              borderRadius: 12, border: "2px solid #0a0b14" 
            }}> ! </div>
          )}
        </button>
      )}

      <div style={{
        position: "fixed", top: 0, right: isOpen ? 0 : -350, width: 340, height: "100%",
        background: "rgba(13, 14, 26, 0.98)", backdropFilter: "blur(15px)",
        borderLeft: "1px solid var(--border)", transition: "right 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        zIndex: 1002, display: "flex", flexDirection: "column"
      }}>
        <div style={{ padding: "25px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 800, color: "var(--accent2)", fontSize: 16 }}>📜 HINT HISTORY</span>
          <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: "var(--text2)", fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>

        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 15 }}>
          {hints?.map((h, i) => (
            <div key={i} onClick={() => setSelectedHint(h)} style={{
              background: "rgba(255,255,255,0.05)", 
              padding: "15px", 
              borderRadius: "12px",
              borderLeft: `4px solid ${getLevelColor(h.level)}`, 
              cursor: "zoom-in",
              transition: "transform 0.2s"
            }}>
              <div style={{ 
                fontSize: 10, 
                // 글자 색상도 난이도 색상에 맞춤
                color: getLevelColor(h.level), 
                fontWeight: 800, 
                marginBottom: 6 
              }}>
                {h.roomLabel} | {h.level === 'basic' ? '초급' : h.level === 'mid' ? '중급' : h.level === 'advanced' ? '고급' : ''}
              </div>
              <div style={{ color: "#fff", fontSize: 13, lineHeight: 1.6 }}>{h.text}</div>
              {h.image && (
                <div style={{ width: "100%", height: 60, borderRadius: 6, overflow: "hidden", marginTop: 8, background: "#000" }}>
                  <img src={h.image} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedHint && (
        <div onClick={() => setSelectedHint(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "30px", borderRadius: "20px", maxWidth: 600, width: "100%", position: "relative" }}>
            <button onClick={() => setSelectedHint(null)} style={{ position: "absolute", top: 15, right: 15, background: "none", border: "none", color: "#666", fontSize: 24 }}>✕</button>
            <div style={{ fontSize: 18, color: "#fff", textAlign: "center", whiteSpace: "pre-wrap", marginBottom: 20 }}>{selectedHint.text}</div>
            {selectedHint.image && <img src={selectedHint.image} style={{ width: "100%", borderRadius: 12 }} />}
          </div>
        </div>
      )}
    </>
  );
}

// ── HintToast 수정 (사진 없을 때 썸네일 제거) ──────────────────────
function HintToast({ hint, onClear }) {
  return (
    <div style={{
      position: "fixed", bottom: 100, right: 30, zIndex: 10001,
      width: 320, background: "var(--surface)", border: "2px solid var(--accent)",
      borderRadius: 16, padding: "20px", boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
      animation: "slideInRight 0.4s ease-out"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 900, color: "var(--accent)" }}>📢 NEW HINT</span>
        <button onClick={onClear} style={{ background: "none", border: "none", color: "#888", cursor: "pointer" }}>✕</button>
      </div>
      <div style={{ color: "#fff", fontSize: 14, lineHeight: 1.6, marginBottom: hint.image ? 12 : 0 }}>
        {hint.text}
      </div>
      {/* 사진이 있을 때만 이미지 영역 렌더링 */}
      {hint.image && (
        <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #333" }}>
          <img src={hint.image} alt="Hint" style={{ width: "100%", display: "block" }} />
        </div>
      )}
    </div>
  );
}

// ── ClientApp ─────────────────────────────────────────────────────────────────
export default function ClientApp() {
  const { state, overrideTeam, solveRoom, moveTeam, setTimerRunning, tickTimer, startTimerToTarget } = useSharedStore();
  const [showHintToast, setShowHintToast] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const sessionId = useRef(getOrCreateSessionId()).current;
  const [myTeamId, setMyTeamId] = useState(() => Number(localStorage.getItem(SESSION_KEY)) || null);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [celebration, setCelebration] = useState(null);
  const [toast, setToast] = useState(null);

  const myTeam = state?.teams?.[myTeamId];

  // 힌트 수신 감시 (5초 후 자동 종료 로직)
  useEffect(() => {
    if (myTeam?.lastHint?.ts) {
      setShowHintToast(true);
      setUnreadCount(prev => prev + 1);

      const timer = setTimeout(() => setShowHintToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [myTeam?.lastHint?.ts]);

  // 2. 힌트 도착 감시 로직 (myTeam이 정의된 후 실행됨)
  useEffect(() => {
    if (myTeam?.lastHint?.ts) {
      setShowHintToast(true);
      // 알림 사운드 등을 추가하려면 여기에 작성
    }
  }, [myTeam?.lastHint?.ts]);

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

  useEffect(() => {
    if (myTeam?.lastHint?.ts) {
      // 힌트가 도착하면 상태를 true로 변경
      setShowHintToast(true);
      
      // (선택사항) 30초 후에 자동으로 닫고 싶다면 아래 주석 해제
      // const timer = setTimeout(() => setShowHintToast(false), 30000);
      // return () => clearTimeout(timer);
    }
  }, [myTeam?.lastHint?.ts]);

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
  const { teams, timerSec, timerRunning } = state;

  const handleClaim = (teamId, name) => {
      // Firebase에 내가 이 팀을 찜했다는 정보를 보냅니다.
      overrideTeam(teamId, { takenBy: sessionId });
      
      // 로컬 스토리지에 저장하고 상태 변경
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

  // ClientApp.jsx 내 렌더링 부분 상단에 추가
  const now = Date.now();
  const isFrozen = myTeam.freezeUntil && now < myTeam.freezeUntil;
  const freezeSec = isFrozen ? Math.ceil((myTeam.freezeUntil - now) / 1000) : 0;

  // 정지 화면 UI
  if (isFrozen) {
    return (
      <div style={{
        position:"fixed", inset:0, background:"rgba(0,0,0,0.95)", zIndex:9999,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        color: "#ff4d4d", textAlign: "center"
      }}>
        <div style={{ fontSize: 80 }}>🚫</div>
        <h1 style={{ fontSize: 32, margin: "20px 0" }}>접속이 일시 정지되었습니다</h1>
        <p style={{ color: "#eee", fontSize: 18 }}>부정행위로 인해 3분간 활동이 제한됩니다.</p>
        <div style={{ 
          fontSize: 60, fontWeight: 800, marginTop: 30, 
          fontFamily: "var(--mono)", color: "#fff" 
        }}>
          {Math.floor(freezeSec / 60)}:{String(freezeSec % 60).padStart(2, '0')}
        </div>
      </div>
    );
  }

  return (
    
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:"var(--bg)" }}>
      <Header
        timerSec={state?.timerSec || 0} 
        timerRunning={state?.timerRunning || false} 
        isAdmin={false} 
        onToggleTimer={() => setTimerRunning(!state.timerRunning)}
        onStart1550={startTimerToTarget} // ← 여기서 ReferenceError가 발생하지 않도록 위에서 잘 가져와야 함
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
      <GridBg />
      {/* 힌트 알림창 (5초후 자동삭제) */}
      {showHintToast && myTeam?.lastHint && (
        <HintToast hint={myTeam.lastHint} onClear={() => setShowHintToast(false)} />
      )}
      
      {/* 힌트 채팅 (읽으면 숫자 초기화) */}
      <HintChat 
        hints={myTeam?.hints || []} 
        unreadCount={unreadCount} 
        onOpenChat={() => setUnreadCount(0)} 
      />
    </div>
  );
}
