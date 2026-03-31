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

  const resetAll = useCallback(() => {
    const fresh = {
      teams: INIT_TEAMS.map(t => ({ ...t, score: 0, roomsDone: [], takenBy: "", name: "" })),
      timerSec: TOTAL_TIME,
      timerRunning: false,
    };
    set(ref(db, 'math_escape_game'), fresh);
    // 리셋 시 모든 클라이언트의 세션도 무효화되도록 resetToken 갱신
    update(ref(db), { "math_escape_game/resetToken": Date.now() });
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