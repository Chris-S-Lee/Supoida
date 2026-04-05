import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { 
  TOTAL_TIME, CONFETTI_COLORS, SESSION_KEY, TEAM_NAMES, INIT_TEAMS, 
  ROOMS_DATA, CORRIDORS, NICKNAMES, GLOBAL_CSS, formatTime, pad,
  BRIDGE_PUZZLE_DATA, 
  SHIKAKU,
  PUZZLE_EXPLANATIONS 
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

// ── PasswordPanel ─────────────────────────────────────────────
function PasswordPanel({ solvedRooms, teamColor, onAllCorrect, teamId, onOverride, teamName }) {
  const [inputCode, setInputCode] = useState("");
  const [status, setStatus] = useState("idle");

  // --- 3분 입력 제한 로직 (최종 비밀번호 오답 시) ---
  // localStorage 대신 DB 상태를 기준으로 하거나 로컬 상태를 사용하되, 접근 차단은 하지 않음
  const [pwPenaltyEnd, setPwPenaltyEnd] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((pwPenaltyEnd - now) / 1000));
      setTimeLeft(remaining);
    }, 1000);
    return () => clearInterval(timer);
  }, [pwPenaltyEnd]);

  const digits = ROOMS_DATA.map(room => ({ digit: room.pw, revealed: solvedRooms.includes(room.id), room }));
  const allRevealed = digits.every(d => d.revealed);
  const CORRECT_CODE = ROOMS_DATA.map(r => r.pw).join("");

  const handleInputChange = (e) => {
    if (timeLeft > 0) return; 
    setInputCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6));
    setStatus("idle");
  };

  const handleSubmit = () => {
    if (status === "correct" || timeLeft > 0) return;

    if (inputCode === CORRECT_CODE) {
      setStatus("correct");
      // ✅ 1번 문제 해결: 관리자에게 파트 1 완료 알림 전달
      onOverride(teamId, { isPart1Finished: true }); 
      setTimeout(() => {
        onAllCorrect(); 
      }, 1000);
    } else {
      // ✅ 2번 문제 해결: freezeUntil(전체차단) 대신 로컬 페널티(입력차단)만 부여
      const penaltyDuration = 180000; // 3분
      setPwPenaltyEnd(Date.now() + penaltyDuration);
      setStatus("wrong");
      
      // 사용자 경험을 위해 Toast로 알림
      if(setToast) setToast("❌ 비밀번호가 틀렸습니다. 3분간 입력이 제한됩니다.");
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
        {digits.map(({digit, revealed, room}) => (
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
          onKeyDown={e=>e.key==="Enter"&&handleSubmit()} 
          placeholder={timeLeft > 0 ? "입력 제한" : "숫자 6자리 입력"}
          disabled={timeLeft > 0} 
          style={{ flex:1, background:timeLeft > 0 ? "var(--border)" : "var(--bg)",
            border:`1.5px solid ${status==="correct"?"var(--green)":status==="wrong"?"var(--accent3)":"var(--border)"}`,
            borderRadius:7, padding:"9px 14px", color:"var(--text)", fontFamily:"var(--mono)", fontSize:15, fontWeight:700,
            letterSpacing:4, outline:"none", textAlign:"center", transition:"border 0.2s",
            animation:status==="wrong"?"shake 0.4s ease":"none" }}
        />
        <button onClick={handleSubmit} disabled={status==="correct" || timeLeft > 0}
          style={{ fontFamily:"var(--mono)", fontSize:11, letterSpacing:1, padding:"0 18px",
            background:timeLeft > 0 ? "#444" : (status==="correct"?"var(--green)":"var(--accent)"), 
            color:"#fff", border:"none", borderRadius:7, cursor:(status==="correct" || timeLeft > 0)?"default":"pointer", transition:"all 0.2s", whiteSpace:"nowrap" }}>
          {status==="correct" ? "🎉 성공!" : timeLeft > 0 ? `${Math.floor(timeLeft/60)}:${String(timeLeft%60).padStart(2,'0')}` : "확인"}
        </button>
      </div>
      {(status==="correct" || timeLeft > 0) && (
        <div style={{ 
          fontFamily:"var(--mono)", fontSize:12, 
          color: status==="correct" ? "var(--green)" : "var(--accent3)", 
          textAlign:"center", padding:"8px", 
          background: status==="correct" ? "rgba(0,255,136,0.07)" : "rgba(255,107,107,0.07)", 
          borderRadius:7, border: `1px solid ${status==="correct" ? "rgba(0,255,136,0.2)" : "rgba(255,107,107,0.2)"}` 
        }}>
          {status==="correct" ? "🏆 정답! 잠시 대기하세요..." : `⚠️ 틀렸습니다. ${Math.floor(timeLeft/60)}분 ${timeLeft%60}초 후 재시도 가능`}
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
        <div style={{ fontFamily:"var(--mono)", fontSize:16, color:"#fff", marginBottom:6 }}>비밀번호 해제 성공! 🎉</div>
        <div style={{ fontFamily:"var(--mono)", fontSize:13, color:"var(--text2)", animation:"pulse2 1.5s infinite" }}>팀원이 올라오길 기다리는 중{dots}</div>
      </div>
      <div style={{ zIndex:1, background:"rgba(108,99,255,0.08)", border:"1px solid rgba(108,99,255,0.25)", borderRadius:10, padding:"12px 28px", fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)", textAlign:"center", lineHeight:1.8 }}>
        자리에서 대기해 주세요
      </div>
    </div>
  );
}

// ── AirRaidAlert ───────────────────────────────────────────────
function AirRaidAlert({ onDone }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // 배경이 빨간색에서 검은색으로 변하는 연출만 남깁니다.
    const t1 = setTimeout(() => setPhase(1), 1200);
    return () => clearTimeout(t1);
  }, []);

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999, background:phase===0?"#ff0000":"#0a0b14", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", transition:"background 0.4s" }}>
      <style>{`@keyframes sirenText{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.8;transform:scale(1.04)}} @keyframes raidIn{from{opacity:0;transform:scale(0.7) translateY(30px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
      
      {phase === 0 && (
        <div style={{ textAlign:"center", animation:"sirenText 0.5s infinite" }}>
          <div style={{ fontSize:80 }}>🚨</div>
          <div style={{ fontFamily:"var(--mono)", fontSize:40, fontWeight:900, color:"#fff", letterSpacing:8, marginTop:10 }}>공습 경보!</div>
        </div>
      )}

      {phase >= 1 && (
        <div style={{ textAlign:"center", animation:"raidIn 0.5s ease-out" }}>
          <div style={{ fontSize:72, marginBottom:16 }}>⚠️</div>
          <div style={{ fontFamily:"var(--mono)", fontSize:30, fontWeight:900, color:"#ff4d4d", letterSpacing:4, marginBottom:12 }}>모 소좌를 피해 문제를 풀어 북한을 탈출하십시오!</div>
          <div style={{ fontFamily:"var(--mono)", fontSize:16, color:"var(--text2)", marginBottom:30 }}>PART 2 미션이 시작되었습니다.</div>
          
          {/* 클릭해야 넘어가는 버튼 추가 */}
          <button 
            onClick={onDone}
            style={{
              padding: "15px 40px", background: "#ff4d4d", color: "#fff", border: "none", borderRadius: "8px",
              fontSize: "20px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 0 20px rgba(255,77,77,0.4)"
            }}
          >
            임무 시작하기 ➔
          </button>
        </div>
      )}
    </div>
  );
}

function ProblemModal({ room, onClose, onSolve, myTeam, myTeamId, overrideTeam, setToast }) {
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
      // ❌ 오답 페널티: 해당 문제만 1분(60초) 차단
      const penaltyTime = Date.now() + 60000;
      const currentPenalties = myTeam.roomPenalties || {};
      
      overrideTeam(myTeamId, {
        roomPenalties: { ...currentPenalties, [room.id]: penaltyTime }
      });

      setStatus("wrong");
      setTimeout(() => {
        onClose();
        // 2초간 표시될 메시지 (Toast 컴포넌트 활용)
        setToast(`❌ 오답! 이 문제는 1분 뒤에 풀 수 있습니다.`);
      }, 600);
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(8px)" }}>
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:16, width:700, maxWidth:"95vw", padding:"30px", position:"relative", animation:"modalIn 0.3s ease", textAlign:"center" }}>
        <button onClick={onClose} style={{ position:"absolute", top:15, right:15, background:"none", border:"none", color:"var(--text2)", cursor:"pointer", fontSize:20 }}>✕</button>
        <div style={{ marginBottom:20 }}>
          <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--accent)", letterSpacing:2 }}>QUIZ {room.id+1}</span>
          <h2 style={{ margin:0, fontSize:20, color:"#fff" }}>{room.label}</h2>
        </div>
        <div style={{ background:"#000", borderRadius:12, overflow:"hidden", marginBottom:25, border:"1px solid var(--border)", display:"flex", justifyContent:"center", alignItems:"center", minHeight:300 }}>
          <img src={room.image} alt="문제" style={{ maxWidth:"100%", maxHeight:450, objectFit:"contain" }} />
        </div>
        <div style={{ display:"flex", gap:10, maxWidth:400, margin:"0 auto" }}>
          <input ref={inputRef} value={answer} onChange={e=>setAnswer(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} placeholder="정답 입력"
            style={{ flex:1, background:"var(--bg)", border:status==="wrong"?"2px solid var(--accent3)":"2px solid var(--border)", padding:"14px", borderRadius:10, color:"#fff", textAlign:"center", fontSize:18, fontWeight:700, outline:"none", animation:status==="wrong"?"shake 0.4s ease":"none" }}
          />
          <button onClick={handleSubmit} style={{ padding:"0 25px", background:"var(--accent)", color:"#fff", border:"none", borderRadius:10, fontWeight:700, cursor:"pointer" }}>확인</button>
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

function PuzzleHelp({ type, onClose }) {
  // 1. 데이터가 아예 없는 경우를 대비해 기본값([]) 설정
  const explanation = PUZZLE_EXPLANATIONS?.[type] || [];

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 20
    }}>
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 12, padding: 24, maxWidth: 500, width: "100%", position: "relative"
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16, background: "none", border: "none",
          color: "var(--text2)", fontSize: 24, cursor: "pointer"
        }}>×</button>
        
        <h2 style={{ marginTop: 0, color: "var(--accent)", fontSize: 20 }}>퍼즐 도움말</h2>
        
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* 2. explanation이 배열인지 확인 후 map 실행 */}
          {explanation.length > 0 ? (
            explanation.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 12 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", background: "var(--accent)",
                  color: "#000", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 800, flexShrink: 0
                }}>{i + 1}</div>
                <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                  {step}
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: "var(--text2)" }}>도움말 정보를 불러올 수 없습니다. (Type: {type})</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  PART 2
// ══════════════════════════════════════════════════════════════

const PART2_ROOMS = [
  { id:0, label:"7번 문제", icon:"🎯", topic:"이미지 문제" },
  { id:1, label:"8번 문제", icon:"🎯", topic:"브릿지 퍼즐" },
  { id:2, label:"9번 문제", icon:"🎯", topic:"시가쿠 퍼즐" },
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
  const Q7_ANSWER = "3U";

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

// BridgePuzzle.jsx (또는 ClientApp.jsx 내 추가)
export function BridgeGame({ onSolve, onClose }) {
  const [bridges, setBridges] = useState([]); 
  const [selected, setSelected] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const SIZE = 7;
  const CELL = 50; // 간격을 충분히 넓힘

  const islands = BRIDGE_PUZZLE_DATA.islands;

  // 다리가 다른 다리를 가로지르는지 확인하는 함수
  const isPathBlocked = (n1, n2, currentBridges) => {
    const rMin = Math.min(n1.r, n2.r), rMax = Math.max(n1.r, n2.r);
    const cMin = Math.min(n1.c, n2.c), cMax = Math.max(n1.c, n2.c);

    for (const b of currentBridges) {
      const b1 = islands.find(i => i.id === b.n1);
      const b2 = islands.find(i => i.id === b.n2);
      
      const bRMin = Math.min(b1.r, b2.r), bRMax = Math.max(b1.r, b2.r);
      const bCMin = Math.min(b1.c, b2.c), bCMax = Math.max(b1.c, b2.c);

      // 현재 시도하는 다리가 가로인 경우
      if (n1.r === n2.r) {
        // 기존 다리가 세로이고 교차하는지 확인
        if (b1.c === b2.c && b1.c > cMin && b1.c < cMax && rMin > bRMin && rMin < bRMax) return true;
      } 
      // 현재 시도하는 다리가 세로인 경우
      else {
        // 기존 다리가 가로이고 교차하는지 확인
        if (b1.r === b2.r && b1.r > rMin && b1.r < rMax && cMin > bCMin && cMin < bCMax) return true;
      }
    }
    return false;
  };

  const handleNodeClick = (nodeId) => {
    if (selected === null) {
      setSelected(nodeId);
    } else if (selected === nodeId) {
      setSelected(null);
    } else {
      const n1 = islands.find(n => n.id === selected);
      const n2 = islands.find(n => n.id === nodeId);

      if (n1.r === n2.r || n1.c === n2.c) {
        const pair = [selected, nodeId].sort((a, b) => a - b).join("-");
        
        setBridges(prev => {
          const existing = prev.find(b => b.pair === pair);
          if (existing) {
            if (existing.count === 2) return prev.filter(b => b.pair !== pair);
            return prev.map(b => b.pair === pair ? { ...b, count: 2 } : b);
          }
          // 교차 체크
          if (isPathBlocked(n1, n2, prev)) {
            alert("다리가 겹칠 수 없습니다!");
            return prev;
          }
          return [...prev, { pair, n1: selected, n2: nodeId, count: 1 }];
        });
      }
      setSelected(null);
    }
  };

  useEffect(() => {
    if (bridges.length === 0) return;
    const isCorrect = islands.every(node => {
      const total = bridges.filter(b => b.n1 === node.id || b.n2 === node.id).reduce((sum, b) => sum + b.count, 0);
      return total === node.count;
    });
    if (isCorrect) setTimeout(() => onSolve(1), 500);
  }, [bridges]);

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.95)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#1a1b2e", padding:30, borderRadius:20, textAlign:"center", border:"1px solid #333" }}>
        {showHelp && <PuzzleHelp type="BRIDGE" onClose={() => setShowHelp(false)} />}        
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0 10px" }}>
          <button onClick={() => setShowHelp(true)} style={{ cursor: "pointer" }}>도움말</button>
        </div>
        <button onClick={onClose} style={{ float:"right", color:"#fff", background:"none", border:"none", cursor:"pointer" }}>✕</button>
        <h2 style={{ color:"#fff", marginBottom:20 }}>브릿지 (Bridge)</h2>
        <div style={{ position:"relative", width:SIZE*CELL, height:SIZE*CELL, margin:"0 auto" }}>
          {/* 가로세로 5줄 점 배경 */}
          {/* {Array.from({length:25}).map((_, i) => (
            <div key={i} style={{ position:"absolute", left:(i%5)*CELL+33, top:Math.floor(i/5)*CELL+33, width:4, height:4, background:"#2a2a40", borderRadius:"50%" }} />
          ))} */}
          <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}>
            {bridges.map(b => {
              const s = islands.find(n => n.id === b.n1);
              const e = islands.find(n => n.id === b.n2);
              const isHor = s.r === e.r;
              return (
                <g key={b.pair} stroke="cyan" strokeWidth={3}>
                  <line x1={s.c*CELL+35} y1={s.r*CELL+35} x2={e.c*CELL+35} y2={e.r*CELL+35} />
                  {b.count === 2 && (
                    <line x1={s.c*CELL+35+(isHor?0:6)} y1={s.r*CELL+35+(isHor?6:0)} x2={e.c*CELL+35+(isHor?0:6)} y2={e.r*CELL+35+(isHor?6:0)} />
                  )}
                </g>
              );
            })}
          </svg>
          {islands.map(node => {
            const total = bridges.filter(b => b.n1 === node.id || b.n2 === node.id).reduce((s, b) => s + b.count, 0);
            return (
              <div key={node.id} onClick={() => handleNodeClick(node.id)}
                style={{
                  position:"absolute", left:node.c*CELL+15, top:node.r*CELL+15, width:40, height:40, borderRadius:"50%",
                  background:selected===node.id?"cyan":total===node.count?"#00ff88":"#1a1b2e",
                  border:`2px solid ${total===node.count?"#00ff88":"cyan"}`,
                  color:total===node.count?"#000":"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, cursor:"pointer", zIndex:10
                }}>{node.count}</div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── 시가쿠 퍼즐 (5×5) ────────────────────────────────────────

const SHIKAKU_COLORS = ["#6c63ff55","#00d4aa55","#ffd70055","#ff6b6b55","#00ff8855","#fd79a855"];
const SGRID = 5;
const SCELL = 100;

export function ShikakuPuzzle({ onSolve, onClose }) {
  const { size, numbers } = SHIKAKU;
  const [rects, setRects] = useState([]);
  const [dragStart, setDragStart] = useState(null);
  const [dragCur, setDragCur] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const svgRef = useRef(null);
  const CELL = 40;

  const getCell = (e) => {
    const b = svgRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - b.left) / CELL);
    const y = Math.floor((e.clientY - b.top) / CELL);
    return { x: Math.max(0, Math.min(size - 1, x)), y: Math.max(0, Math.min(size - 1, y)) };
  };

  // 되돌리기 기능: 마지막으로 추가된 사각형 제거
  const handleUndo = () => {
    setRects(prev => prev.slice(0, -1));
  };

  const handleMouseUp = () => {
    if (!dragStart || !dragCur) return;
    const x1 = Math.min(dragStart.x, dragCur.x), x2 = Math.max(dragStart.x, dragCur.x);
    const y1 = Math.min(dragStart.y, dragCur.y), y2 = Math.max(dragStart.y, dragCur.y);
    const w = x2 - x1 + 1, h = y2 - y1 + 1;
    const area = w * h;

    const clues = numbers.filter(n => n.x >= x1 && n.x <= x2 && n.y >= y1 && n.y <= y2);
    if (clues.length === 1 && clues[0].value === area) {
      const clue = clues[0];
      const newRect = { x: x1, y: y1, w, h, id: `${clue.x}-${clue.y}` };
      setRects(prev => {
        const next = [...prev.filter(r => r.id !== newRect.id), newRect];
        if (next.reduce((acc, r) => acc + (r.w * r.h), 0) === size * size) {
          setTimeout(() => onSolve(2), 500);
        }
        return next;
      });
    }
    setDragStart(null); setDragCur(null);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(5px)" }}>
      <div style={{ background:" #1a1b2e", padding:"30px", borderRadius:"8px", boxShadow:"0 10px 30px rgba(0,0,0,0.5)", textAlign:"center" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
          {showHelp && <PuzzleHelp type="SHIKAKU" onClose={() => setShowHelp(false)} />}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <button onClick={() => setShowHelp(true)}>도움말</button>
          </div>
          <h2 style={{ color:"#fff", margin:0, fontSize:"20px" }}>시가쿠 (Shikaku)</h2>
          
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:"24px", cursor:"pointer", color:"#999" }}>✕</button>
        </div>
        
        <svg ref={svgRef} width={size*CELL} height={size*CELL} 
            onMouseDown={(e)=> { const c=getCell(e); setDragStart(c); setDragCur(c); }}
            onMouseMove={(e)=> { if(dragStart) setDragCur(getCell(e)); }}
            onMouseUp={handleMouseUp}
            style={{ border:"2px solid #333", display:"block", userSelect:"none", touchAction:"none", background: "#757790" }}>
          
          {Array.from({length: size + 1}).map((_, i) => (
            <g key={i}>
              <line x1={i*CELL} y1={0} x2={i*CELL} y2={size*CELL} stroke="#ddd" strokeWidth="1" />
              <line x1={0} y1={i*CELL} x2={size*CELL} y2={i*CELL} stroke="#ddd" strokeWidth="1" />
            </g>
          ))}

          {rects.map((r, i) => (
            <rect key={i} x={r.x*CELL + 2} y={r.y*CELL + 2} width={r.w*CELL - 4} height={r.h*CELL - 4} 
                  fill="rgba(108, 99, 255, 0.2)" stroke="#6c63ff" strokeWidth="3" rx="4" />
          ))}

          {dragStart && dragCur && (
            <rect x={Math.min(dragStart.x, dragCur.x)*CELL} y={Math.min(dragStart.y, dragCur.y)*CELL}
                  width={(Math.abs(dragCur.x-dragStart.x)+1)*CELL} height={(Math.abs(dragCur.y-dragStart.y)+1)*CELL}
                  fill="rgba(0,0,0,0.05)" stroke="#333" strokeDasharray="5,5" />
          )}

          {numbers.map((n, i) => (
            <text key={i} x={n.x*CELL + CELL/2} y={n.y*CELL + CELL/2 + 7} 
                  textAnchor="middle" fontSize="18px" fontWeight="700" fill="#222" style={{ pointerEvents:"none" }}>
              {n.value}
            </text>
          ))}
        </svg>

        <div style={{ marginTop:"20px", display:"flex", gap:"10px" }}>
          <button onClick={handleUndo} style={{ flex:1, padding:"10px", background:"#eef2ff", border:"1px solid #6c63ff", color: "#6c63ff", borderRadius:"4px", cursor:"pointer", fontWeight: "bold" }}>↩ 되돌리기</button>
          <button onClick={() => setRects([])} style={{ flex:1, padding:"10px", background:"#f0f0f0", border:"1px solid #ccc", borderRadius:"4px", cursor:"pointer" }}>전체 초기화</button>
        </div>
      </div>
    </div>
  );
}

// ── Part2 메인 화면 ────────────────────────────────────────────
function Part2Screen({ myTeam, myTeamId, overrideTeam }) {
  const [activeP2, setActiveP2] = useState(null);
  const solvedP2 = myTeam.solvedP2 || [];
  const { size, numbers } = SHIKAKU;
  const [rects, setRects] = useState([]);
  const [drawing, setDrawing] = useState(null);

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
              <div style={{ fontFamily:"var(--mono)", fontSize:18, fontWeight:900, color:"var(--green)", letterSpacing:4 }}>PART 2 탈출 성공!</div>
              <div style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--text2)", marginTop:8 }}>수뽀이다 멤버에게 알려주세요</div>
            </div>
          )}
        </div>
      </div>
      {activeP2===0 && <Q7Modal onClose={() => setActiveP2(null)} onSolve={handleSolveP2} />}
      {activeP2 === 1 && <BridgeGame onClose={() => setActiveP2(null)} onSolve={handleSolveP2} />}
      {activeP2 === 2 && <ShikakuPuzzle onClose={() => setActiveP2(null)} onSolve={handleSolveP2} />}
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
    
    // 조건 추가: phase2가 활성화되었고, 이전에 보지 않았으며, '현재 파트2 화면이 아닐 때'만 경보 실행
    if (isPhase2 && !prevPhase2.current && !inPart2) {
      prevPhase2.current = true;
      setShowAirRaid(true);
    }
    
    if (!isPhase2) {
      prevPhase2.current = false;
      setInPart2(false); // 관리자가 파트1로 되돌릴 경우를 대비
    }
  }, [myTeam?.phase2, inPart2]); // inPart2 의존성 추가

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

    // 1. 이미 푼 방인지 확인
    if ((myTeam.roomsDone || []).includes(id)) {
      setToast("이미 클리어한 방입니다.");
      return;
    }

    // 2. 특정 방 페널티 확인 (해당 문제만 차단)
    const roomPenalties = myTeam.roomPenalties || {};
    const penaltyUntil = roomPenalties[id];
    
    if (penaltyUntil && Date.now() < penaltyUntil) {
      const remain = Math.ceil((penaltyUntil - Date.now()) / 1000);
      setToast(`⚠️ 시도 제한! ${remain}초 후 다시 가능합니다.`);
      
      // 2초 뒤에 메시지 사라지게 처리 (이미 Toast 컴포넌트에 onDone이 있다면 연동)
      setTimeout(() => setToast(null), 2000); 
      return;
    }

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

  
  // 1. 공습경보 애니메이션을 최우선으로 렌더링 (다른 모든 화면을 덮음)
  if (showAirRaid) {
    return (
      <AirRaidAlert 
        onDone={() => { 
          setShowAirRaid(false); 
          setInPart2(true); 
          setWaitingForPart2(false); 
        }} 
      />
    );
  }

  // 2. 애니메이션이 끝났거나 이미 진입한 경우에만 파트 2 화면을 보여줌
  // showAirRaid가 false일 때만 이 조건이 실행되므로 화면 겹침이나 지연이 사라집니다.
  if (inPart2 || (myTeam && myTeam.phase2 && !showAirRaid)) {
    return <Part2Screen myTeam={myTeam} myTeamId={myTeamId} overrideTeam={overrideTeam} />;
  }

  // 3. 파트 1 대기 화면
  if (waitingForPart2) return <WaitingScreen teamName={myTeam.name} teamColor={myTeam.color} />;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:"var(--bg)" }}>
      <Header timerSec={state?.timerSec||0} timerRunning={state?.timerRunning||false} isAdmin={false} onToggleTimer={() => setTimerRunning(!state.timerRunning)} onStart1550={startTimerToTarget} />
      <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", flex:1, overflow:"hidden" }}>
        <Leaderboard teams={Object.values(state.teams)} myTeamId={myTeam.id} />
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
            <PasswordPanel 
              solvedRooms={myRoomsDone} 
              teamColor={myTeam.color} 
              teamId={myTeam.id}       // 추가
              teamName={myTeam.name}   // 추가
              onOverride={overrideTeam} // 추가 (useSharedStore에서 가져온 함수)
              onAllCorrect={() => setWaitingForPart2(true)} 
            />
          </div>
        </div>
      </div>
      {activeRoomId !== null && ROOMS_DATA[activeRoomId] && (
        <ProblemModal 
          room={ROOMS_DATA[activeRoomId]} 
          onClose={() => setActiveRoomId(null)} 
          onSolve={handleSolve}
          myTeam={myTeam}
          myTeamId={myTeamId}
          overrideTeam={overrideTeam}
          setToast={setToast} // Toast 함수 전달
        />
      )}
      
      {/* Toast 컴포넌트가 2초 뒤에 null로 변하도록 설정 */}
      {toast && <Toast msg={toast} onDone={() => setToast(null)} duration={2000} />}
      {celebration && <Celebration room={celebration.room} pts={celebration.pts} totalScore={celebration.total} onClose={() => setCelebration(null)} />}
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
      <GridBg />
      {showHintToast && myTeam?.lastHint && <HintToast hint={myTeam.lastHint} onClear={() => setShowHintToast(false)} />}
      <HintChat hints={myTeam?.hints||[]} unreadCount={unreadCount} onOpenChat={() => setUnreadCount(0)} />
    </div>
  );
}
