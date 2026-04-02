export const TOTAL_TIME = 30 * 60;
export const CONFETTI_COLORS = ["#6c63ff","#00d4aa","#ffd700","#ff6b6b","#00ff88","#85b7eb"];
export const SESSION_KEY = "math_escape_my_team_id";

export const TEAM_NAMES = [
  "하자", "에이레네", "에르곤", "아모", "루트원", 
  "시몬스", "대대손손", "용사", "For용", "헤핑"
];

export const INIT_TEAMS = TEAM_NAMES.map((name, i) => ({
  id: i,
  name: name, 
  color: ["#6c63ff", "#00d4aa", "#ffd700", "#ff6b6b", "#a29bfe", "#fd79a8", "#fab1a0", "#00cec9", "#74b9ff", "#a29bfe"][i % 10],
  emoji: "🚀",
  score: 0,
  currentRoom: 0,
  roomsDone: [],
  takenBy: ""
}));

export const ROOMS_DATA = [
  { id:0, label:"대수학 방",  icon:"📐", topic:"대수학", points:100, diff:2,
    problem:"다음 이차방정식의 해를 구하시오.\n(두 근의 합을 입력하세요)",
    formula:"x² − 5x + 6 = 0", answer:"5", hint:"인수분해: (x−2)(x−3) = 0" },
  { id:1, label:"기하학 방",  icon:"🔺", topic:"기하학", points:100, diff:2,
    problem:"반지름이 5인 원의 넓이를 구하시오.\n(소수점 이하 반올림, π=3.14 사용)",
    formula:"S = πr²", answer:"79", hint:"5×5×3.14 = 78.5 → 반올림하면 79" },
  { id:2, label:"수열 방",    icon:"∞",  topic:"수열",   points:150, diff:3,
    problem:"등차수열의 첫째 항이 3, 공차가 4일 때,\n제 10항을 구하시오.",
    formula:"aₙ = a₁ + (n−1)d", answer:"39", hint:"3 + (10−1)×4 = 3 + 36 = 39" },
  { id:3, label:"확률 방",    icon:"🎲", topic:"확률",   points:150, diff:3,
    problem:"주사위 두 개를 던질 때 두 눈의 합이 7이 될 확률을 분수로 입력하세요.\n(분자만 입력, 분모=36)",
    formula:"P(A) = n(A)/n(S)", answer:"6", hint:"합이 7: (1,6)(2,5)(3,4)(4,3)(5,2)(6,1) → 6가지" },
  { id:4, label:"미적분 방",  icon:"∫",  topic:"미적분", points:200, diff:4,
    problem:"다음 함수를 미분하시오.\n(x의 계수를 입력하세요)",
    formula:"f(x) = 3x² + 2x + 1", answer:"6", hint:"f'(x) = 6x + 2 에서 x의 계수는 6" },
  { id:5, label:"통계학 방",  icon:"📊", topic:"통계",   points:200, diff:4,
    problem:"1, 2, 3, 4, 5의 표준편차를 구하시오.\n(소수점 첫째 자리까지, 예: 1.4)",
    formula:"σ = √(Σ(xᵢ−μ)²/n)", answer:"1.4", hint:"평균=3, 분산=2, 표준편차=√2≈1.41→1.4" },
];

export const CORRIDORS = [];

// ── 팀 설정 (10팀, 아이콘 없음) ─────────────────────────────────────────────
const TEAM_COLORS = [
  "#6c63ff", // 1팀 — 보라
  "#ff6b6b", // 2팀 — 빨강
  "#00d4aa", // 3팀 — 민트
  "#ffd700", // 4팀 — 금색
  "#85b7eb", // 5팀 — 하늘
  "#97c459", // 6팀 — 연두
  "#ff9500", // 7팀 — 주황
  "#e056fd", // 8팀 — 보라핑크
  "#00cec9", // 9팀 — 청록
  "#fd79a8", // 10팀 — 핑크
];


// ── 닉네임 선택 목록 ─────────────────────────────────────────────────────────
export const NICKNAMES = [
  "하자", "에이레네", "에르곤", "아모", "루트원", 
  "시몬스", "대대손손", "용사", "For용", "헤핑",
];

export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
  :root {
    --sans: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --mono: 'JetBrains Mono', 'Noto Sans KR';
    --bg: #0a0b14;--surface: #161827;--surface2:#1a1a26;--border:#2a2a40;
    --accent:#6c63ff; --accent2:#00d4aa; --accent3:#ff6b6b; --gold:#ffd700;
    --text:#e8e8f0; --text2:#8888aa; --green:#00ff88; --orange:#ff9500;
  }
  *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: 'Noto Sans KR', sans-serif;
    overflow-x: hidden; /* 가로 스크롤 방지 */
  }
  #root { height:100vh; display:flex; flex-direction:column; }
  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:var(--border); border-radius:2px; }

  @keyframes pulse      { 0%,100%{opacity:1} 50%{opacity:0.5} }
  @keyframes livepulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.85)} }
  @keyframes arrowUp    { 0%{transform:translateY(4px);opacity:0} 60%{transform:translateY(-3px);opacity:1} 100%{transform:translateY(0)} }
  @keyframes arrowDown  { 0%{transform:translateY(-4px);opacity:0} 60%{transform:translateY(3px);opacity:1} 100%{transform:translateY(0)} }
  @keyframes flashUp    { 0%{background:rgba(0,230,118,0.18)} 100%{background:transparent} }
  @keyframes flashDown  { 0%{background:rgba(255,82,82,0.15)} 100%{background:transparent} }
  @keyframes shake      { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
  @keyframes modalIn    { from{opacity:0;transform:scale(0.94) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes celebIn    { from{opacity:0;transform:scale(0.7) translateY(30px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes ptsPop     { from{transform:scale(0.5);opacity:0} to{transform:scale(1);opacity:1} }
  @keyframes confettiFall { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(380px) rotate(540deg);opacity:0} }
  @keyframes fadeInUp   { from{opacity:0;transform:translateX(-50%) translateY(12px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
  @keyframes float      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
  @keyframes slideIn    { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeOut    {from { opacity: 1; } to { opacity: 0; }
  }
  .intro-exit {
    animation: fadeOut 0.5s forwards;
  }
  .live-dot {
    width:7px; height:7px; border-radius:50%; background:var(--green);
    box-shadow:0 0 8px var(--green); animation:livepulse 2s infinite; flex-shrink:0;
  }
  .anim-float { animation:float 3s ease-in-out infinite; }
  .math-text, .timer, .score {
    font-family: var(--mono) !important;
  }

`;

export const pad = (n) => String(n).padStart(2, "0");
export const formatTime = (sec) => `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`;
export const isRoomUnlocked = (roomId, solvedRooms) => true;

export const btnStyle = {
  fontFamily:"var(--mono)", fontSize:11, letterSpacing:1, padding:"7px 16px",
  border:"1px solid var(--border)", background:"transparent", color:"var(--text2)",
  cursor:"pointer", borderRadius:4, transition:"all 0.2s",
};
