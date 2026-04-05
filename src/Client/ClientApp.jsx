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

// ── RoomGrid ────────────────────────────────────────────────────
function RoomGrid({ solvedRooms, onRoomClick, teamColor }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:10 }}>
      {ROOMS_DATA.map(room => {
        const solved = solvedRooms.includes(room.id);
        return (
          <div key={room.id}
            onClick={() => !solved && onRoomClick(room.id)}
            style={{
              border:`1.5px solid ${solved ? "rgba(0,255,136,0.45)" : "var(--border)"}`,
              background: solved ? "rgba(0,255,136,0.05)" : "var(--surface)",
              borderRadius:10, padding:"14px 12px",
              display:"flex", flexDirection:"column", alignItems:"center", gap:7,
              cursor: solved ? "default" : "pointer",
              position:"relative", overflow:"hidden", transition:"all 0.25s ease", minHeight:110,
            }}
            onMouseEnter={e => { if(!solved){ e.currentTarget.style.borderColor=teamColor||"rgba(108,99,255,0.6)"; e.currentTarget.style.transform="translateY(-2px)"; }}}
            onMouseLeave={e => { if(!solved){ e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.transform=""; }}}
          >
            {solved && <span style={{ position:"absolute", top:8, right:10, fontSize:12 }}>✅</span>}
            <div style={{ position:"absolute", top:8, left:10, fontFamily:"var(--mono)", fontSize:10, fontWeight:800, color:solved?"var(--green)":"var(--text2)", background:"var(--surface3)", padding:"2px 8px", borderRadius:4 }}>
              #{room.id+1}
            </div>
            <div style={{ fontSize:28, lineHeight:1, marginTop:10 }}>{room.icon}</div>
            <div style={{ fontFamily:"var(--mono)", fontSize:11, letterSpacing:0.5, color:solved?"var(--green)":"var(--text)", textAlign:"center", fontWeight:solved?700:400 }}>{room.label}</div>
            <div style={{ fontSize:9, fontFamily:"var(--mono)", padding:"2px 8px", borderRadius:8,
              background: solved?"rgba(0,255,136,0.1)":room.topic==="난이도 상"?"rgba(255,77,77,0.1)":room.topic==="난이도 중"?"rgba(255,204,0,0.1)":"rgba(77,148,255,0.1)",
              color: solved?"var(--green)":room.topic==="난이도 상"?"#ff4d4d":room.topic==="난이도 중"?"#ffcc00":"#4d94ff",
              border:`1px solid ${solved?"rgba(0,255,136,0.2)":room.topic==="난이도 상"?"rgba(255,77,77,0.2)":room.topic==="난이도 중"?"rgba(255,204,0,0.2)":"rgba(77,148,255,0.2)"}`,
              letterSpacing:0.5 }}>
              {room.topic}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── PasswordPanel ─────────────────────────────────────────────
const CORRECT_CODE = ROOMS_DATA.map(r => r.pw).join("");

function PasswordPanel({ solvedRooms, teamColor, onAllCorrect }) {
  const [inputCode, setInputCode] = useState("");
  const [status, setStatus] = useState("idle");
  const notifiedRef = useRef(false);

  const digits = ROOMS_DATA.map(room => ({ digit:room.pw, revealed:solvedRooms.includes(room.id), room }));
  const allRevealed = digits.every(d => d.revealed);

  const handleInputChange = (e) => {
    setInputCode(e.target.value.replace(/[^0-9]/g, "").slice(0,6));
    setStatus("idle");
  };

  const handleSubmit = () => {
    if (inputCode === CORRECT_CODE) {
      setStatus("correct");
      if (!notifiedRef.current) { notifiedRef.current = true; onAllCorrect && onAllCorrect(); }
    } else {
      setStatus("wrong");
      setTimeout(() => setStatus("idle"), 1200);
    }
  };

  const color = teamColor || "var(--accent2)";

  return (
    <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:"16px 20px", display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:15 }}>🔐</span>
        <span style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:3, color:"var(--text2)" }}>SECRET PASSWORD</span>
        <span style={{ marginLeft:"auto", fontFamily:"var(--mono)", fontSize:9, color:allRevealed?"var(--green)":"var(--text2)" }}>
          {digits.filter(d=>d.revealed).length}/{digits.length} 해제
        </span>
      </div>
      <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
        {digits.map(({digit,revealed,room}) => (
          <div key={room.id} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <div style={{ width:44, height:54, borderRadius:8,
              border:`1.5px solid ${revealed?color:status==="wrong"?"rgba(255,107,107,0.35)":"var(--border)"}`,
              background:revealed?color+"18":"var(--surface2)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:revealed?20:16, fontFamily:"var(--mono)", fontWeight:800,
              color:revealed?color:"var(--text2)",
              boxShadow:revealed?`0 0 12px ${color}33`:"none",
              transition:"all 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
              {revealed ? digit : "?"}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <input type="text" inputMode="numeric" value={inputCode} onChange={handleInputChange}
          onKeyDown={e=>e.key==="Enter"&&handleSubmit()} placeholder="숫자 6자리 입력"
          style={{ flex:1, background:"var(--bg)",
            border:`1.5px solid ${status==="correct"?"var(--green)":status==="wrong"?"var(--accent3)":"var(--border)"}`,
            borderRadius:7, padding:"9px 14px", color:"var(--text)", fontFamily:"var(--mono)", fontSize:15, fontWeight:700,
            letterSpacing:4, outline:"none", textAlign:"center", transition:"border 0.2s",
            animation:status==="wrong"?"shake 0.4s ease":"none" }}
        />
        <button onClick={handleSubmit} disabled={status==="correct"}
          style={{ fontFamily:"var(--mono)", fontSize:11, letterSpacing:1, padding:"0 18px",
            background:status==="correct"?"var(--green)":"var(--accent)", color:"#fff", border:"none",
            borderRadius:7, cursor:status==="correct"?"default":"pointer", transition:"all 0.2s", whiteSpace:"nowrap" }}>
          {status==="correct" ? "🎉 성공!" : "확인"}
        </button>
      </div>
      {status==="correct" && (
        <div style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--green)", textAlign:"center", padding:"8px", background:"rgba(0,255,136,0.07)", borderRadius:7, border:"1px solid rgba(0,255,136,0.2)" }}>
          🏆 정답! 잠시 대기하세요...
        </div>
      )}
    </div>
  );
}

// ── WaitingScreen ──────────────────────────────────────────────
function WaitingScreen({ teamName, teamColor }) {
  const [dots, setDots] = useState(".");
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? "." : d+"."), 600);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ position:"fixed", inset:0, background:"#0a0b14", zIndex:500, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:24 }}>
      <GridBg />
      <style>{`@keyframes spinRing{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes pulse2{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.6;transform:scale(0.95)}}`}</style>
      <div style={{ position:"relative", width:100, height:100, zIndex:1 }}>
        <div style={{ position:"absolute", inset:0, border:`3px solid ${teamColor||"var(--accent)"}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spinRing 1.2s linear infinite" }}/>
        <div style={{ position:"absolute", inset:10, border:`2px solid ${teamColor||"var(--accent)"}33`, borderBottomColor:"transparent", borderRadius:"50%", animation:"spinRing 1.8s linear infinite reverse" }}/>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32 }}>⏳</div>
      </div>
      <div style={{ zIndex:1, textAlign:"center" }}>
        <div style={{ fontFamily:"var(--mono)", fontSize:22, fontWeight:800, color:teamColor||"var(--accent)", marginBottom:8 }}>{teamName} 팀</div>
        <div style={{ fontFamily:"var(--mono)", fontSize:16, color:"#fff", marginBottom:6 }}>파트 1 완료! 🎉</div>
        <div style={{ fontFamily:"var(--mono)", fontSize:13, color:"var(--text2)", animation:"pulse2 1.5s infinite" }}>매니저의 신호를 기다리는 중{dots}</div>
      </div>
      <div style={{ zIndex:1, background:"rgba(108,99,255,0.08)", border:"1px solid rgba(108,99,255,0.25)", borderRadius:10, padding:"12px 28px", fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)", textAlign:"center", lineHeight:1.8 }}>
        잠시 후 파트 2가 시작됩니다.<br/>자리에서 대기해 주세요.
      </div>
    </div>
  );
}

// ── AirRaidAlert ───────────────────────────────────────────────
function AirRaidAlert({ onDone }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1200);
    const t2 = setTimeout(() => setPhase(2), 3500);
    const t3 = setTimeout(() => onDone(), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);
  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999, background:phase===0?"#ff0000":"#0a0b14", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", transition:"background 0.4s" }}>
      <style>{`@keyframes sirenText{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.8;transform:scale(1.04)}} @keyframes raidIn{from{opacity:0;transform:scale(0.7) translateY(30px)}to{opacity:1;transform:scale(1) translateY(0)}} @keyframes alertStrobe{0%,100%{opacity:1}45%{opacity:1}50%{opacity:0.2}55%{opacity:1}}`}</style>
      {phase === 0 && (
        <div style={{ textAlign:"center", animation:"sirenText 0.5s infinite" }}>
          <div style={{ fontSize:80 }}>🚨</div>
          <div style={{ fontFamily:"var(--mono)", fontSize:40, fontWeight:900, color:"#fff", letterSpacing:8, marginTop:10 }}>경보!</div>
        </div>
      )}
      {phase >= 1 && (
        <div style={{ textAlign:"center", animation:"raidIn 0.5s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <div style={{ fontSize:72, marginBottom:16, animation:"alertStrobe 1s infinite" }}>⚠️</div>
          <div style={{ fontFamily:"var(--mono)", fontSize:36, fontWeight:900, color:"#ff4d4d", letterSpacing:6, marginBottom:12 }}>공습 경보</div>
          <div style={{ fontFamily:"var(--mono)", fontSize:18, color:"var(--text2)", letterSpacing:2 }}>PART 2 START</div>
        </div>
      )}
    </div>
  );
}

// ── ProblemModal ──────────────────────────────────────────────
function ProblemModal({ room, onClose, onSolve }) {
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("idle");
  const inputRef = useRef(null);
  useEffect(() => { const t = setTimeout(() => inputRef.current?.focus(), 300); return () => clearTimeout(t); }, []);
  const handleSubmit = () => {
    if (status==="correct") return;
    if (answer.trim()===room.answer) { setStatus("correct"); setTimeout(() => { onClose(); onSolve(room, room.points); }, 700); }
    else { setStatus("wrong"); setTimeout(() => setStatus("idle"), 500); }
  };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(8px)" }}>
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:16, width:700, maxWidth:"95vw", padding:"30px", position:"relative", animation:"modalIn 0.3s cubic-bezier(0.4,0,0.2,1)", textAlign:"center" }}>
        <button onClick={onClose} style={{ position:"absolute", top:15, right:15, background:"none", border:"none", color:"var(--text2)", cursor:"pointer", fontSize:20 }}>✕</button>
        <div style={{ marginBottom:20 }}>
          <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--accent)", letterSpacing:2 }}>QUIZ {room.id+1}</span>
          <h2 style={{ margin:0, fontSize:20, color:"#fff" }}>{room.label}</h2>
        </div>
        <div style={{ background:"#000", borderRadius:12, overflow:"hidden", marginBottom:25, border:"1px solid var(--border)", display:"flex", justifyContent:"center", alignItems:"center", minHeight:300 }}>
          <img src={room.image} alt="문제 이미지" style={{ maxWidth:"100%", maxHeight:450, display:"block", objectFit:"contain" }} />
        </div>
        <div style={{ display:"flex", gap:10, maxWidth:400, margin:"0 auto" }}>
          <input ref={inputRef} value={answer} onChange={e=>setAnswer(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} placeholder="정답을 입력하세요"
            style={{ flex:1, background:"var(--bg)", border:status==="wrong"?"2px solid var(--accent3)":"2px solid var(--border)", padding:"14px", borderRadius:10, color:"#fff", textAlign:"center", fontSize:18, fontWeight:700, outline:"none", animation:status==="wrong"?"shake 0.4s ease":"none" }}
          />
          <button onClick={handleSubmit} style={{ padding:"0 25px", background:"var(--accent)", color:"#fff", border:"none", borderRadius:10, fontWeight:700, cursor:"pointer" }}>확인</button>
        </div>
        <div style={{ marginTop:15, height:20, fontSize:14, color:status==="correct"?"var(--green)":"var(--accent3)" }}>
          {status==="correct"?"✨ 정답입니다!":status==="wrong"?"❌ 다시 생각해보세요":""}
        </div>
      </div>
    </div>
  );
}

// ── Celebration ───────────────────────────────────────────────
function Celebration({ room, pts, totalScore, onClose }) {
  const confetti = useRef(Array.from({length:24},(_,i)=>({ id:i, left:Math.random()*100, color:CONFETTI_COLORS[Math.floor(Math.random()*CONFETTI_COLORS.length)], size:5+Math.random()*5, round:Math.random()>0.5, delay:Math.random()*0.4, dur:0.9+Math.random()*0.8 }))).current;
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(6px)", animation:"modalIn 0.25s ease" }}>
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:"38px 48px", textAlign:"center", position:"relative", overflow:"hidden", animation:"celebIn 0.4s cubic-bezier(0.34,1.56,0.64,1)", minWidth:300 }}>
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
          {confetti.map(p => <div key={p.id} style={{ position:"absolute", top:-10, left:`${p.left}%`, width:p.size, height:p.size, borderRadius:p.round?"50%":2, background:p.color, animationName:"confettiFall", animationTimingFunction:"linear", animationFillMode:"forwards", animationDelay:`${p.delay}s`, animationDuration:`${p.dur}s` }} />)}
        </div>
        <div style={{ fontSize:46, marginBottom:8, lineHeight:1 }}>✅</div>
        <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:3, color:"var(--accent)", marginBottom:6 }}>ROOM {pad(room.id+1)} 클리어!</div>
        <div style={{ fontSize:22, fontWeight:700, marginBottom:14 }}>{room.label} 완료!</div>
        <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--accent2)", marginBottom:20, padding:"8px 14px", background:"rgba(0,212,170,0.08)", borderRadius:7, border:"1px solid rgba(0,212,170,0.22)" }}>
          🔐 비밀번호 {room.id+1}번째 자리 공개!
        </div>
        <button onClick={onClose} style={{ fontFamily:"var(--mono)", fontSize:12, letterSpacing:1, padding:"10px 28px", background:"var(--accent)", color:"#fff", border:"none", borderRadius:7, cursor:"pointer" }}>→ 계속하기</button>
      </div>
    </div>
  );
}

// ── HintChat ──────────────────────────────────────────────────
function HintChat({ hints, unreadCount, onOpenChat }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHint, setSelectedHint] = useState(null);
  const scrollRef = useRef(null);
  useEffect(() => { if(scrollRef.current) scrollRef.current.scrollTop=scrollRef.current.scrollHeight; }, [hints,isOpen]);
  const getLevelColor = (level) => level==='advanced'?'#ff4d4d':level==='mid'?'#ffcc00':'#4d94ff';
  return (
    <>
      {!isOpen && (
        <button onClick={() => { setIsOpen(true); onOpenChat(); }} className="anim-float" style={{ position:"fixed", bottom:25, right:25, width:65, height:65, borderRadius:"50%", background:"var(--accent)", border:"none", boxShadow:"0 8px 24px rgba(108,99,255,0.4)", cursor:"pointer", zIndex:1001, display:"flex", alignItems:"center", justifyContent:"center", fontSize:30 }}>
          💬
          {unreadCount>0 && <div style={{ position:"absolute", top:-2, right:-2, background:"#ff4d4d", color:"#fff", fontSize:11, fontWeight:800, padding:"2px 8px", borderRadius:12, border:"2px solid #0a0b14" }}>!</div>}
        </button>
      )}
      <div style={{ position:"fixed", top:0, right:isOpen?0:-350, width:340, height:"100%", background:"rgba(13,14,26,0.98)", backdropFilter:"blur(15px)", borderLeft:"1px solid var(--border)", transition:"right 0.4s cubic-bezier(0.16,1,0.3,1)", zIndex:1002, display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"25px 20px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontWeight:800, color:"var(--accent2)", fontSize:16 }}>📜 HINT HISTORY</span>
          <button onClick={() => setIsOpen(false)} style={{ background:"none", border:"none", color:"var(--text2)", fontSize:22, cursor:"pointer" }}>✕</button>
        </div>
        <div ref={scrollRef} style={{ flex:1, overflowY:"auto", padding:"20px", display:"flex", flexDirection:"column", gap:15 }}>
          {hints?.map((h,i) => (
            <div key={i} onClick={() => setSelectedHint(h)} style={{ background:"rgba(255,255,255,0.05)", padding:"15px", borderRadius:"12px", borderLeft:`4px solid ${getLevelColor(h.level)}`, cursor:"zoom-in" }}>
              <div style={{ fontSize:10, color:getLevelColor(h.level), fontWeight:800, marginBottom:6 }}>{h.roomLabel} | {h.level==='basic'?'초급':h.level==='mid'?'중급':'고급'}</div>
              <div style={{ color:"#fff", fontSize:13, lineHeight:1.6 }}>{h.text}</div>
              {h.image && <div style={{ width:"100%", height:60, borderRadius:6, overflow:"hidden", marginTop:8, background:"#000" }}><img src={h.image} style={{ width:"100%", height:"100%", objectFit:"cover", opacity:0.6 }} /></div>}
            </div>
          ))}
        </div>
      </div>
      {selectedHint && (
        <div onClick={() => setSelectedHint(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"var(--surface)", border:"1px solid var(--border)", padding:"30px", borderRadius:"20px", maxWidth:600, width:"100%", position:"relative" }}>
            <button onClick={() => setSelectedHint(null)} style={{ position:"absolute", top:15, right:15, background:"none", border:"none", color:"#666", fontSize:24 }}>✕</button>
            <div style={{ fontSize:18, color:"#fff", textAlign:"center", whiteSpace:"pre-wrap", marginBottom:20 }}>{selectedHint.text}</div>
            {selectedHint.image && <img src={selectedHint.image} style={{ width:"100%", borderRadius:12 }} />}
          </div>
        </div>
      )}
    </>
  );
}

function HintToast({ hint, onClear }) {
  return (
    <div style={{ position:"fixed", bottom:100, right:30, zIndex:10001, width:320, background:"var(--surface)", border:"2px solid var(--accent)", borderRadius:16, padding:"20px", boxShadow:"0 12px 40px rgba(0,0,0,0.6)", animation:"slideIn 0.4s ease-out" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
        <span style={{ fontSize:11, fontWeight:900, color:"var(--accent)" }}>📢 NEW HINT</span>
        <button onClick={onClear} style={{ background:"none", border:"none", color:"#888", cursor:"pointer" }}>✕</button>
      </div>
      <div style={{ color:"#fff", fontSize:14, lineHeight:1.6, marginBottom:hint.image?12:0 }}>{hint.text}</div>
      {hint.image && <div style={{ borderRadius:8, overflow:"hidden", border:"1px solid #333" }}><img src={hint.image} alt="Hint" style={{ width:"100%", display:"block" }} /></div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  PART 2
// ══════════════════════════════════════════════════════════════

const PART2_ROOMS = [
  { id:0, label:"7번 문제", icon:"🎯", topic:"이미지 문제" },
  { id:1, label:"8번 문제 — 브릿지", icon:"🌉", topic:"브릿지 퍼즐" },
  { id:2, label:"9번 문제 — 시가쿠", icon:"🔷", topic:"시가쿠 퍼즐" },
];

function Part2RoomGrid({ solvedP2, onRoomClick, teamColor }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
      {PART2_ROOMS.map(room => {
        const solved = solvedP2.includes(room.id);
        return (
          <div key={room.id} onClick={() => !solved && onRoomClick(room.id)}
            style={{ border:`1.5px solid ${solved?"rgba(0,255,136,0.45)":"var(--border)"}`, background:solved?"rgba(0,255,136,0.05)":"var(--surface)", borderRadius:12, padding:"22px 14px", display:"flex", flexDirection:"column", alignItems:"center", gap:8, cursor:solved?"default":"pointer", transition:"all 0.25s ease", minHeight:130, position:"relative" }}
            onMouseEnter={e => { if(!solved){ e.currentTarget.style.borderColor=teamColor||"rgba(108,99,255,0.6)"; e.currentTarget.style.transform="translateY(-2px)"; }}}
            onMouseLeave={e => { if(!solved){ e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.transform=""; }}}
          >
            {solved && <span style={{ position:"absolute", top:8, right:10, fontSize:14 }}>✅</span>}
            <div style={{ position:"absolute", top:8, left:10, fontFamily:"var(--mono)", fontSize:9, background:"var(--surface3)", padding:"2px 8px", borderRadius:4, color:solved?"var(--green)":"var(--text2)" }}>#{room.id+7}</div>
            <div style={{ fontSize:32, marginTop:8 }}>{room.icon}</div>
            <div style={{ fontFamily:"var(--mono)", fontSize:12, color:solved?"var(--green)":"var(--text)", fontWeight:solved?700:400, textAlign:"center" }}>{room.label}</div>
            <div style={{ fontSize:9, fontFamily:"var(--mono)", padding:"2px 8px", borderRadius:8, background:"rgba(108,99,255,0.1)", color:"var(--accent)", border:"1px solid rgba(108,99,255,0.2)" }}>{room.topic}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Q7: 이미지 문제 ────────────────────────────────────────────
function Q7Modal({ onClose, onSolve }) {
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("idle");
  const inputRef = useRef(null);
  // ★ Q7 정답은 여기서 설정하세요
  const Q7_ANSWER = "";

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 300); }, []);

  const handleSubmit = () => {
    if (!Q7_ANSWER || answer.trim() === Q7_ANSWER) {
      setStatus("correct");
      setTimeout(() => { onClose(); onSolve(0); }, 700);
    } else {
      setStatus("wrong");
      setTimeout(() => setStatus("idle"), 500);
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(8px)" }}>
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:16, width:720, maxWidth:"95vw", padding:"28px", position:"relative", animation:"modalIn 0.3s ease", textAlign:"center" }}>
        <button onClick={onClose} style={{ position:"absolute", top:14, right:14, background:"none", border:"none", color:"var(--text2)", cursor:"pointer", fontSize:20 }}>✕</button>
        <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--accent)", letterSpacing:2, marginBottom:4 }}>PART 2 — QUIZ 7</div>
        <h2 style={{ margin:"0 0 18px", fontSize:18, color:"#fff" }}>7번 문제</h2>
        <div style={{ background:"#000", borderRadius:12, overflow:"hidden", marginBottom:22, border:"1px solid var(--border)", minHeight:300, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <img src="/Q7.png" alt="문제 7" style={{ maxWidth:"100%", maxHeight:450, objectFit:"contain" }} />
        </div>
        <div style={{ display:"flex", gap:10, maxWidth:420, margin:"0 auto" }}>
          <input ref={inputRef} value={answer} onChange={e=>setAnswer(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} placeholder="정답을 입력하세요"
            style={{ flex:1, background:"var(--bg)", border:status==="wrong"?"2px solid var(--accent3)":"2px solid var(--border)", padding:"13px", borderRadius:10, color:"#fff", textAlign:"center", fontSize:17, fontWeight:700, outline:"none", animation:status==="wrong"?"shake 0.4s ease":"none" }}
          />
          <button onClick={handleSubmit} style={{ padding:"0 22px", background:"var(--accent)", color:"#fff", border:"none", borderRadius:10, fontWeight:700, cursor:"pointer" }}>확인</button>
        </div>
        <div style={{ marginTop:12, height:20, fontSize:13, color:status==="correct"?"var(--green)":"var(--accent3)" }}>
          {status==="correct"?"✨ 정답!":status==="wrong"?"❌ 다시 시도":""}
        </div>
      </div>
    </div>
  );
}

// ── 브릿지 퍼즐 ───────────────────────────────────────────────
// 5×5 그리드 위의 섬 퍼즐 (숫자 = 연결할 다리 수)
const BRIDGE_NODES = [
  { id:0, x:0, y:0, req:2 },
  { id:1, x:2, y:0, req:3 },
  { id:2, x:4, y:0, req:1 },
  { id:3, x:0, y:2, req:3 },
  { id:4, x:2, y:2, req:4 },
  { id:5, x:4, y:2, req:2 },
  { id:6, x:0, y:4, req:1 },
  { id:7, x:2, y:4, req:3 },
  { id:8, x:4, y:4, req:1 },
];
const BRIDGE_PAIRS = [
  [0,1],[1,2],
  [3,4],[4,5],
  [6,7],[7,8],
  [0,3],[3,6],
  [1,4],[4,7],
  [2,5],[5,8],
];

function BridgePuzzle({ onSolve, onClose }) {
  const initBridges = () => { const b={}; BRIDGE_PAIRS.forEach(([a,z]) => { b[`${a}-${z}`]=0; }); return b; };
  const [bridges, setBridges] = useState(initBridges);
  const [solved, setSolved] = useState(false);

  const CELL=80, PAD=40;
  const W=4*CELL+PAD*2, H=4*CELL+PAD*2;

  const countBridges = (br) => {
    const counts = {}; BRIDGE_NODES.forEach(n => { counts[n.id]=0; });
    BRIDGE_PAIRS.forEach(([a,z]) => { counts[a]+=br[`${a}-${z}`]; counts[z]+=br[`${a}-${z}`]; });
    return counts;
  };

  const toggleBridge = (a,z) => {
    if (solved) return;
    const key=`${a}-${z}`;
    setBridges(prev => {
      const next = { ...prev, [key]:(prev[key]+1)%3 };
      const counts = countBridges(next);
      if (BRIDGE_NODES.every(n => counts[n.id]===n.req)) { setSolved(true); setTimeout(() => onSolve(1), 800); }
      return next;
    });
  };

  const getPos = (id) => { const n=BRIDGE_NODES[id]; return { cx:PAD+n.x*CELL, cy:PAD+n.y*CELL }; };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(8px)" }}>
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:16, padding:"28px", position:"relative", animation:"modalIn 0.3s ease", textAlign:"center", maxWidth:"95vw" }}>
        <button onClick={onClose} style={{ position:"absolute", top:14, right:14, background:"none", border:"none", color:"var(--text2)", cursor:"pointer", fontSize:20 }}>✕</button>
        <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--accent)", letterSpacing:2, marginBottom:4 }}>PART 2 — QUIZ 8</div>
        <h2 style={{ margin:"0 0 6px", fontSize:18, color:"#fff" }}>브릿지 퍼즐</h2>
        <p style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)", marginBottom:18 }}>
          각 섬(숫자)에 표시된 수만큼 다리를 연결하세요. 클릭으로 다리 수 조절 (0 → 1 → 2 → 0)
        </p>
        <svg width={W} height={H} style={{ display:"block", margin:"0 auto" }}>
          {/* 클릭 가능한 다리 영역 */}
          {BRIDGE_PAIRS.map(([a,z]) => {
            const pa=getPos(a), pz=getPos(z);
            const cnt=bridges[`${a}-${z}`];
            const isH=pa.cy===pz.cy;
            const color=solved?"#00ff88":"#6c63ff";
            const off=5;
            return (
              <g key={`${a}-${z}`} onClick={() => toggleBridge(a,z)} style={{ cursor:"pointer" }}>
                <line x1={pa.cx} y1={pa.cy} x2={pz.cx} y2={pz.cy} stroke="transparent" strokeWidth={20} />
                {cnt>=1 && <line x1={pa.cx+(isH?0:-off)} y1={pa.cy+(isH?-off:0)} x2={pz.cx+(isH?0:-off)} y2={pz.cy+(isH?-off:0)} stroke={color} strokeWidth={2.5} opacity={0.9} />}
                {cnt===2 && <line x1={pa.cx+(isH?0:off)} y1={pa.cy+(isH?off:0)} x2={pz.cx+(isH?0:off)} y2={pz.cy+(isH?off:0)} stroke={color} strokeWidth={2.5} opacity={0.9} />}
              </g>
            );
          })}
          {/* 노드 */}
          {BRIDGE_NODES.map(n => {
            const { cx,cy } = getPos(n.id);
            const counts = countBridges(bridges);
            const full = counts[n.id]===n.req;
            return (
              <g key={n.id}>
                <circle cx={cx} cy={cy} r={22} fill={full?"rgba(0,255,136,0.15)":"var(--surface2)"} stroke={full?"#00ff88":"var(--border)"} strokeWidth={2} />
                <text x={cx} y={cy+5} textAnchor="middle" fill={full?"#00ff88":"#fff"} fontSize={16} fontWeight={800} fontFamily="monospace">{n.req}</text>
              </g>
            );
          })}
        </svg>
        {solved && <div style={{ marginTop:16, fontFamily:"var(--mono)", fontSize:14, color:"var(--green)", padding:"10px 20px", background:"rgba(0,255,136,0.07)", borderRadius:8, border:"1px solid rgba(0,255,136,0.2)" }}>✅ 브릿지 완성!</div>}
        <button onClick={() => setBridges(initBridges())} style={{ marginTop:14, fontFamily:"var(--mono)", fontSize:10, padding:"6px 18px", background:"transparent", border:"1px solid var(--border)", color:"var(--text2)", borderRadius:6, cursor:"pointer" }}>초기화</button>
      </div>
    </div>
  );
}

// ── 시가쿠 퍼즐 (5×5) ────────────────────────────────────────
// 각 단서 숫자 = 해당 직사각형의 넓이
// 드래그로 직사각형을 그려서 완성
const SHIKAKU_CLUES = [
  { r:0, c:0, val:6 },
  { r:0, c:3, val:4 },
  { r:2, c:1, val:2 },
  { r:3, c:0, val:3 },
  { r:3, c:3, val:6 },
  { r:4, c:2, val:4 },
];
const SHIKAKU_COLORS = ["#6c63ff55","#00d4aa55","#ffd70055","#ff6b6b55","#00ff8855","#fd79a855"];
const SGRID = 5;
const SCELL = 66;

function ShikakuPuzzle({ onSolve, onClose }) {
  const [rects, setRects] = useState([]);
  const [dragStart, setDragStart] = useState(null);
  const [dragCur, setDragCur] = useState(null);
  const [solved, setSolved] = useState(false);
  const svgRef = useRef(null);

  const getCellFromEvent = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const r = Math.floor((e.clientY - rect.top) / SCELL);
    const c = Math.floor((e.clientX - rect.left) / SCELL);
    return { r: Math.max(0,Math.min(SGRID-1,r)), c: Math.max(0,Math.min(SGRID-1,c)) };
  };

  const getDragRect = (s, e) => {
    if (!s||!e) return null;
    return { r:Math.min(s.r,e.r), c:Math.min(s.c,e.c), w:Math.abs(s.c-e.c)+1, h:Math.abs(s.r-e.r)+1 };
  };

  const handleMouseDown = (e) => { const cell=getCellFromEvent(e); setDragStart(cell); setDragCur(cell); };
  const handleMouseMove = (e) => { if(!dragStart) return; setDragCur(getCellFromEvent(e)); };
  const handleMouseUp = () => {
    if (!dragStart || !dragCur) { setDragStart(null); setDragCur(null); return; }
    const dr = getDragRect(dragStart, dragCur);
    if (!dr) { setDragStart(null); setDragCur(null); return; }
    const area = dr.w * dr.h;
    // 이 직사각형 안에 포함된 단서
    const inside = SHIKAKU_CLUES.filter(cl => cl.r>=dr.r && cl.r<dr.r+dr.h && cl.c>=dr.c && cl.c<dr.c+dr.w);
    if (inside.length===1 && inside[0].val===area) {
      const clue = inside[0];
      const colorIdx = SHIKAKU_CLUES.indexOf(clue);
      setRects(prev => {
        // 같은 단서 영역 교체
        const filtered = prev.filter(rect => {
          const hasClue = SHIKAKU_CLUES.some(cl => cl.r===clue.r && cl.c===clue.c && cl.r>=rect.r && cl.r<rect.r+rect.h && cl.c>=rect.c && cl.c<rect.c+rect.w);
          return !hasClue;
        });
        const next = [...filtered, { ...dr, color:SHIKAKU_COLORS[colorIdx] }];
        // 전체 25칸 커버 검증
        if (next.length===SHIKAKU_CLUES.length) {
          const grid = Array.from({length:SGRID}, () => Array(SGRID).fill(0));
          let ok = true;
          next.forEach(rect => {
            for(let rr=rect.r; rr<rect.r+rect.h; rr++)
              for(let cc=rect.c; cc<rect.c+rect.w; cc++) { if(rr>=SGRID||cc>=SGRID){ok=false;return;} grid[rr][cc]++; }
          });
          if (ok && grid.every(row => row.every(v => v===1))) { setSolved(true); setTimeout(() => onSolve(2), 800); }
        }
        return next;
      });
    }
    setDragStart(null); setDragCur(null);
  };

  const preview = dragStart && dragCur ? getDragRect(dragStart, dragCur) : null;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(8px)" }}>
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:16, padding:"28px", position:"relative", animation:"modalIn 0.3s ease", textAlign:"center", maxWidth:"95vw" }}>
        <button onClick={onClose} style={{ position:"absolute", top:14, right:14, background:"none", border:"none", color:"var(--text2)", cursor:"pointer", fontSize:20 }}>✕</button>
        <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--accent)", letterSpacing:2, marginBottom:4 }}>PART 2 — QUIZ 9</div>
        <h2 style={{ margin:"0 0 6px", fontSize:18, color:"#fff" }}>시가쿠 퍼즐</h2>
        <p style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)", marginBottom:16 }}>
          드래그로 직사각형을 그리세요. 각 직사각형의 넓이 = 단서 숫자. 모든 칸을 채우면 완성!
        </p>
        <svg ref={svgRef} width={SGRID*SCELL} height={SGRID*SCELL}
          style={{ display:"block", margin:"0 auto", cursor:"crosshair", userSelect:"none", border:"1px solid var(--border)", borderRadius:8 }}
          onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={() => { setDragStart(null); setDragCur(null); }}>
          <rect width={SGRID*SCELL} height={SGRID*SCELL} fill="#0a0b14" />
          {/* 완성된 직사각형 */}
          {rects.map((rect,i) => (
            <rect key={i} x={rect.c*SCELL+2} y={rect.r*SCELL+2} width={rect.w*SCELL-4} height={rect.h*SCELL-4}
              fill={rect.color} stroke={rect.color.replace("55","cc")} strokeWidth={2} rx={4} />
          ))}
          {/* 드래그 미리보기 */}
          {preview && (
            <rect x={preview.c*SCELL+2} y={preview.r*SCELL+2} width={preview.w*SCELL-4} height={preview.h*SCELL-4}
              fill="rgba(108,99,255,0.15)" stroke="rgba(108,99,255,0.6)" strokeWidth={1.5} strokeDasharray="4 2" rx={4} />
          )}
          {/* 그리드 선 */}
          {Array.from({length:SGRID+1}).map((_,i) => (
            <g key={i}>
              <line x1={i*SCELL} y1={0} x2={i*SCELL} y2={SGRID*SCELL} stroke="#2a2a40" strokeWidth={1} />
              <line x1={0} y1={i*SCELL} x2={SGRID*SCELL} y2={i*SCELL} stroke="#2a2a40" strokeWidth={1} />
            </g>
          ))}
          {/* 단서 숫자 */}
          {SHIKAKU_CLUES.map((cl,i) => (
            <text key={i} x={cl.c*SCELL+SCELL/2} y={cl.r*SCELL+SCELL/2+7} textAnchor="middle"
              fill="#fff" fontSize={22} fontWeight={900} fontFamily="monospace" style={{ pointerEvents:"none" }}>
              {cl.val}
            </text>
          ))}
        </svg>
        {solved && <div style={{ marginTop:14, fontFamily:"var(--mono)", fontSize:14, color:"var(--green)", padding:"10px 20px", background:"rgba(0,255,136,0.07)", borderRadius:8, border:"1px solid rgba(0,255,136,0.2)" }}>✅ 시가쿠 완성!</div>}
        <button onClick={() => setRects([])} style={{ marginTop:14, fontFamily:"var(--mono)", fontSize:10, padding:"6px 18px", background:"transparent", border:"1px solid var(--border)", color:"var(--text2)", borderRadius:6, cursor:"pointer" }}>초기화</button>
      </div>
    </div>
  );
}

// ── Part2 메인 화면 ────────────────────────────────────────────
function Part2Screen({ myTeam, myTeamId, overrideTeam }) {
  const [activeP2, setActiveP2] = useState(null);
  const solvedP2 = myTeam.solvedP2 || [];

  const handleSolveP2 = (roomId) => {
    const newSolved = Array.from(new Set([...solvedP2, roomId]));
    overrideTeam(myTeamId, { solvedP2: newSolved });
    setActiveP2(null);
  };

  const allDone = solvedP2.length >= PART2_ROOMS.length;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:"var(--bg)" }}>
      <style>{`@keyframes redPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,77,77,0)}50%{box-shadow:0 0 20px 6px rgba(255,77,77,0.25)}}`}</style>
      <header style={{ padding:"14px 24px", background:"var(--surface)", borderBottom:"2px solid #ff4d4d", display:"flex", alignItems:"center", justifyContent:"space-between", animation:"redPulse 2s infinite" }}>
        <div>
          <div style={{ fontFamily:"var(--mono)", fontSize:14, fontWeight:900, color:"#ff4d4d", letterSpacing:4 }}>⚠ PART 2</div>
          <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--text2)", marginTop:2 }}>파트 2 진행 중</div>
        </div>
        <div style={{ fontFamily:"var(--mono)", fontSize:13, fontWeight:700, color:myTeam.color }}>{myTeam.name} 팀</div>
        <div style={{ fontFamily:"var(--mono)", fontSize:12, color:allDone?"var(--green)":"var(--text2)" }}>{solvedP2.length}/{PART2_ROOMS.length} 완료</div>
      </header>
      <div style={{ flex:1, overflowY:"auto", padding:"28px 32px", position:"relative" }}>
        <GridBg />
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ marginBottom:20, fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)", letterSpacing:2 }}>PART 2 — 3개 문제를 모두 해결하세요</div>
          <Part2RoomGrid solvedP2={solvedP2} onRoomClick={setActiveP2} teamColor={myTeam.color} />
          {allDone && (
            <div style={{ marginTop:28, padding:"22px", background:"rgba(0,255,136,0.06)", border:"1px solid rgba(0,255,136,0.3)", borderRadius:12, textAlign:"center" }}>
              <div style={{ fontSize:36, marginBottom:10 }}>🏆</div>
              <div style={{ fontFamily:"var(--mono)", fontSize:18, fontWeight:900, color:"var(--green)", letterSpacing:4 }}>PART 2 완료!</div>
              <div style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--text2)", marginTop:8 }}>매니저에게 알려주세요</div>
            </div>
          )}
        </div>
      </div>
      {activeP2===0 && <Q7Modal onClose={() => setActiveP2(null)} onSolve={handleSolveP2} />}
      {activeP2===1 && <BridgePuzzle onClose={() => setActiveP2(null)} onSolve={handleSolveP2} />}
      {activeP2===2 && <ShikakuPuzzle onClose={() => setActiveP2(null)} onSolve={handleSolveP2} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  ClientApp
// ══════════════════════════════════════════════════════════════
export default function ClientApp() {
  const { state, overrideTeam, solveRoom, moveTeam, setTimerRunning, tickTimer, startTimerToTarget } = useSharedStore();
  const [showHintToast, setShowHintToast] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const sessionId = useRef(getOrCreateSessionId()).current;
  const [myTeamId, setMyTeamId] = useState(() => { const v=localStorage.getItem(SESSION_KEY); return v!==null?Number(v):null; });
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [celebration, setCelebration] = useState(null);
  const [toast, setToast] = useState(null);
  const [waitingForPart2, setWaitingForPart2] = useState(false);
  const [showAirRaid, setShowAirRaid] = useState(false);
  const [inPart2, setInPart2] = useState(false);
  const prevPhase2 = useRef(false);

  const myTeam = state?.teams?.[myTeamId];

  useEffect(() => {
    if (myTeam?.lastHint?.ts) {
      setShowHintToast(true);
      setUnreadCount(prev => prev+1);
      const timer = setTimeout(() => setShowHintToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [myTeam?.lastHint?.ts]);

  useEffect(() => { const interval=setInterval(tickTimer, 1000); return () => clearInterval(interval); }, [tickTimer]);

  useEffect(() => {
    if (!state || myTeamId===null) return;
    const t = state.teams[myTeamId];
    if (!t || t.takenBy!==sessionId) { localStorage.removeItem(SESSION_KEY); setMyTeamId(null); }
  }, [state?.resetToken]); // eslint-disable-line

  // 매니저가 phase2 플래그 켜면 → 공습경보 → 파트2
  useEffect(() => {
    if (!myTeam) return;
    const isPhase2 = Boolean(myTeam.phase2);
    if (isPhase2 && !prevPhase2.current) {
      prevPhase2.current = true;
      setShowAirRaid(true);
    }
    if (!isPhase2) prevPhase2.current = false;
  }, [myTeam?.phase2]); // eslint-disable-line

  const handleSolve = useCallback((room, pts) => {
    if (!state) return;
    const t = myTeamId!==null ? state.teams[myTeamId] : null;
    if (!t) return;
    solveRoom(myTeamId, room.id, pts);
    setCelebration({ room, pts, total:(t.score||0)+pts });
    moveTeam(myTeamId, room.id);
  }, [state, myTeamId, solveRoom, moveTeam]);

  if (!state || !state.teams) return <div style={{color:"#fff"}}>Loading Teams...</div>;
  const { teams } = state;

  const handleClaim = (teamId) => {
    overrideTeam(teamId, { takenBy:sessionId });
    localStorage.setItem(SESSION_KEY, String(teamId));
    setMyTeamId(teamId);
  };

  const handleRoomClick = (id) => {
    if (!myTeam) return;
    if ((myTeam.roomsDone||[]).includes(id)) { setToast("이미 클리어한 방입니다."); return; }
    setActiveRoomId(id);
  };

  if (!myTeam) return <LoginPage teams={teams} onClaim={handleClaim} />;

  const safeTeams = teams.map(t => ({ ...t, roomsDone:t.roomsDone||[] }));
  const myRoomsDone = myTeam.roomsDone || [];
  const now = Date.now();
  const isFrozen = myTeam.freezeUntil && now < myTeam.freezeUntil;
  const freezeSec = isFrozen ? Math.ceil((myTeam.freezeUntil-now)/1000) : 0;

  if (isFrozen) return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.95)", zIndex:9999, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"#ff4d4d", textAlign:"center" }}>
      <div style={{ fontSize:80 }}>🚫</div>
      <h1 style={{ fontSize:32, margin:"20px 0" }}>접속이 일시 정지되었습니다</h1>
      <p style={{ color:"#eee", fontSize:18 }}>부정행위로 인해 3분간 활동이 제한됩니다.</p>
      <div style={{ fontSize:60, fontWeight:800, marginTop:30, fontFamily:"var(--mono)", color:"#fff" }}>
        {Math.floor(freezeSec/60)}:{String(freezeSec%60).padStart(2,"0")}
      </div>
    </div>
  );

  if (showAirRaid) return <AirRaidAlert onDone={() => { setShowAirRaid(false); setInPart2(true); setWaitingForPart2(false); }} />;

  if (inPart2 || myTeam.phase2) return <Part2Screen myTeam={myTeam} myTeamId={myTeamId} overrideTeam={overrideTeam} />;

  if (waitingForPart2) return <WaitingScreen teamName={myTeam.name} teamColor={myTeam.color} />;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:"var(--bg)" }}>
      <Header timerSec={state?.timerSec||0} timerRunning={state?.timerRunning||false} isAdmin={false} onToggleTimer={() => setTimerRunning(!state.timerRunning)} onStart1550={startTimerToTarget} />
      <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", flex:1, overflow:"hidden" }}>
        <Leaderboard teams={safeTeams} myTeamId={myTeamId} />
        <div style={{ display:"flex", flexDirection:"column", overflowY:"auto", background:"var(--bg)", position:"relative" }}>
          <GridBg />
          <div style={{ position:"relative", zIndex:1, padding:"18px 24px", display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
              <span style={{ fontSize:12, fontWeight:900, color:"var(--text2)", letterSpacing:1.5 }}>ROOMS</span>
              <span style={{ fontFamily:"var(--mono)", fontSize:11, padding:"3px 11px", background:"rgba(0,212,170,0.1)", border:"1px solid rgba(0,212,170,0.28)", borderRadius:16, color:"var(--accent2)" }}>
                {myTeam.emoji} {myTeam.name}
              </span>
              <span style={{ marginLeft:"auto", fontFamily:"var(--mono)", fontSize:10, color:"var(--text2)" }}>
                {myRoomsDone.length}/{ROOMS_DATA.length} 클리어
              </span>
            </div>
            <RoomGrid solvedRooms={myRoomsDone} onRoomClick={handleRoomClick} teamColor={myTeam.color} />
            <PasswordPanel solvedRooms={myRoomsDone} teamColor={myTeam.color} onAllCorrect={() => setWaitingForPart2(true)} />
          </div>
        </div>
      </div>
      {activeRoomId!==null && ROOMS_DATA[activeRoomId] && (
        <ProblemModal room={ROOMS_DATA[activeRoomId]} onClose={() => setActiveRoomId(null)} onSolve={handleSolve} />
      )}
      {celebration && <Celebration room={celebration.room} pts={celebration.pts} totalScore={celebration.total} onClose={() => setCelebration(null)} />}
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
      <GridBg />
      {showHintToast && myTeam?.lastHint && <HintToast hint={myTeam.lastHint} onClear={() => setShowHintToast(false)} />}
      <HintChat hints={myTeam?.hints||[]} unreadCount={unreadCount} onOpenChat={() => setUnreadCount(0)} />
    </div>
  );
}
