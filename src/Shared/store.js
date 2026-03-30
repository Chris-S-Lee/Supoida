import { useState, useEffect, useCallback } from "react";
import { INIT_TEAMS, TOTAL_TIME } from "./constants.js";
// firebase.js에서 db 객체를 가져옵니다. (앞서 만든 firebase.js가 있어야 합니다)
import { db } from "../firebase.js"; 
import { ref, onValue, set, update } from "firebase/database";

// ── 초기 상태 설정 ────────────────────────────────────────────────────────
const initState = () => ({
  teams: INIT_TEAMS.map(t => ({ ...t })),
  timerSec: TOTAL_TIME,
  timerRunning: true,
});

export function useSharedStore() {
  // 초기값은 null로 설정하여 데이터 로딩 전임을 알립니다.
  const [state, setStateInner] = useState(null);

  // 1. [실시간 구독] Firebase의 데이터를 실시간으로 가져옵니다.
  useEffect(() => {
  const stateRef = ref(db, 'math_escape_game');
  
  const unsubscribe = onValue(stateRef, (snapshot) => {
    const data = snapshot.val();
    
    // 데이터가 없으면 무조건 초기 데이터를 서버에 저장하도록 강제 실행
    if (!data) {
      console.log("데이터가 없어서 초기화 데이터를 생성합니다...");
      const fresh = initState();
      set(stateRef, fresh); // 서버에 데이터 전송
    } else {
      setStateInner(data);
    }
  });

  return () => unsubscribe();
}, []);

  // 2. [데이터 쓰기] Firebase에 데이터를 저장하는 공통 함수
  const saveToFirebase = useCallback((nextState) => {
    const stateRef = ref(db, 'math_escape_game');
    set(stateRef, nextState);
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────────

  // 팀 이름 업데이트 (사용자가 입장할 때 입력한 이름 저장)
  const updateTeamName = useCallback((teamId, name) => {
    if (!state) return;
    const updates = {};
    // 특정 팀의 이름만 경로를 찾아 업데이트합니다.
    const teamIndex = state.teams.findIndex(t => t.id === teamId);
    if (teamIndex !== -1) {
      updates[`math_escape_game/teams/${teamIndex}/name`] = name;
      update(ref(db), updates);
    }
  }, [state]);

  // 방 탈출 성공 시 점수 및 기록 업데이트
  const solveRoom = useCallback((teamId, roomId, pts) => {
    if (!state) return;
    const teamIndex = state.teams.findIndex(t => t.id === teamId);
    if (teamIndex === -1) return;

    const team = state.teams[teamIndex];
    const newRoomsDone = [...(team.roomsDone || []), roomId];
    
    const updates = {};
    updates[`math_escape_game/teams/${teamIndex}/score`] = team.score + pts;
    updates[`math_escape_game/teams/${teamIndex}/roomsDone`] = newRoomsDone;
    updates[`math_escape_game/teams/${teamIndex}/currentRoom`] = roomId;
    
    update(ref(db), updates);
  }, [state]);

  // 팀의 현재 위치 이동
  const moveTeam = useCallback((teamId, roomId) => {
    if (!state) return;
    const teamIndex = state.teams.findIndex(t => t.id === teamId);
    if (teamIndex !== -1) {
      const updates = {};
      updates[`math_escape_game/teams/${teamIndex}/currentRoom`] = roomId;
      update(ref(db), updates);
    }
  }, [state]);

  // 타이머 작동 제어 (매니저용)
  const setTimerRunning = useCallback((running) => {
    if (!state) return;
    update(ref(db), { "math_escape_game/timerRunning": running });
  }, [state]);

  // 타이머 1초씩 감소
  const tickTimer = useCallback(() => {
    if (!state || !state.timerRunning || state.timerSec <= 0) return;
    update(ref(db), { "math_escape_game/timerSec": state.timerSec - 1 });
  }, [state]);

  // 모든 데이터 초기화 (매니저용)
  const resetAll = useCallback(() => {
    const fresh = initState();
    saveToFirebase(fresh);
  }, [saveToFirebase]);

  // 매니저가 특정 팀 정보를 강제로 수정할 때
  const overrideTeam = useCallback((teamId, patch) => {
    if (!state) return;
    const teamIndex = state.teams.findIndex(t => t.id === teamId);
    if (teamIndex !== -1) {
      const updates = {};
      Object.keys(patch).forEach(key => {
        updates[`math_escape_game/teams/${teamIndex}/${key}`] = patch[key];
      });
      update(ref(db), updates);
    }
  }, [state]);

  return {
    state,
    updateTeamName,
    solveRoom,
    moveTeam,
    setTimerRunning,
    tickTimer,
    resetAll,
    overrideTeam,
  };
}