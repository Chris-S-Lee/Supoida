import { useState, useEffect, useCallback } from "react";
import { INIT_TEAMS, TOTAL_TIME } from "./constants.js";
import { db } from "../firebase.js";
import { ref, onValue, set, update } from "firebase/database";

const initState = () => ({
  teams: INIT_TEAMS.map(t => ({ ...t })),
  timerSec: TOTAL_TIME,
  timerRunning: false,
});

export function useSharedStore() {
  const [state, setStateInner] = useState(null);

  useEffect(() => {
    const stateRef = ref(db, 'math_escape_game');
    const unsubscribe = onValue(stateRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        const fresh = initState();
        set(stateRef, fresh);
      } else {
        // Firebase arrays can come back as objects with numeric keys – normalize
        if (data.teams && !Array.isArray(data.teams)) {
          data.teams = Object.values(data.teams);
        }
        data.teams = data.teams.map(t => ({
          ...t,
          roomsDone: Array.isArray(t.roomsDone) ? t.roomsDone : [],
        }));
        setStateInner(data);
      }
    });
    return () => unsubscribe();
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────────

  /** 팀 이름 + takenBy(세션id) 동시 설정 — 팀 선택 시 호출 */
  const claimTeam = useCallback((teamId, name, sessionId) => {
    const updates = {};
    updates[`math_escape_game/teams/${teamId}/name`]    = name;
    updates[`math_escape_game/teams/${teamId}/takenBy`] = sessionId;
    update(ref(db), updates);
  }, []);

  const updateTeamName = useCallback((teamId, name) => {
    update(ref(db), { [`math_escape_game/teams/${teamId}/name`]: name });
  }, []);

  const updateTeamEmoji = useCallback((teamId, emoji) => {
    update(ref(db), { [`math_escape_game/teams/${teamId}/emoji`]: emoji });
  }, []);

  const solveRoom = useCallback((teamId, roomId, pts) => {
    if (!state) return;
    const team = state.teams[teamId];
    if (!team) return;
    const newRoomsDone = [...(team.roomsDone || []), roomId];
    const updates = {};
    updates[`math_escape_game/teams/${teamId}/score`]      = (team.score || 0) + pts;
    updates[`math_escape_game/teams/${teamId}/roomsDone`]  = newRoomsDone;
    updates[`math_escape_game/teams/${teamId}/currentRoom`]= roomId;
    update(ref(db), updates);
  }, [state]);

  const moveTeam = useCallback((teamId, roomId) => {
    update(ref(db), { [`math_escape_game/teams/${teamId}/currentRoom`]: roomId });
  }, []);

  const setTimerRunning = useCallback((running) => {
    update(ref(db), { "math_escape_game/timerRunning": running });
  }, []);

  /** 타이머 tick — 매니저 또는 클라이언트 중 한 곳에서만 호출해야 함 */
  const tickTimer = useCallback(() => {
    if (!state || !state.timerRunning || state.timerSec <= 0) return;
    update(ref(db), { "math_escape_game/timerSec": state.timerSec - 1 });
  }, [state]);

  // shared/store.js 내의 resetAll 함수 부분
  const resetAll = useCallback(() => {
    const fresh = {
      // t.name을 ""로 초기화하지 않고 INIT_TEAMS의 기본 이름을 유지합니다.
      teams: INIT_TEAMS.map(t => ({ 
        ...t, 
        score: 0, 
        roomsDone: [], 
        takenBy: "" 
        // name: "" 부분을 삭제하여 INIT_TEAMS의 이름을 사용하게 함
      })),
      timerSec: TOTAL_TIME,
      timerRunning: false,
      resetToken: Date.now()
    };
    set(ref(db, 'math_escape_game'), fresh);
  }, []);

  const overrideTeam = useCallback((teamId, patch) => {
    if (!state) return;
    const updates = {};
    Object.keys(patch).forEach(key => {
      updates[`math_escape_game/teams/${teamId}/${key}`] = patch[key];
    });
    update(ref(db), updates);
  }, [state]);

  return {
    state,
    claimTeam,
    updateTeamName,
    updateTeamEmoji,
    solveRoom,
    moveTeam,
    setTimerRunning,
    tickTimer,
    resetAll,
    overrideTeam,
  };
}