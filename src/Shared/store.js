import { useState, useEffect, useCallback } from "react";
import { INIT_TEAMS, TOTAL_TIME } from "./constants.js";
import { db } from "../firebase.js";
import { ref, onValue, set, update } from "firebase/database";

export function useSharedStore() {
  const [state, setStateInner] = useState(null);

  useEffect(() => {
    const stateRef = ref(db, 'math_escape_game');
    return onValue(stateRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        set(stateRef, { teams: INIT_TEAMS, timerSec: TOTAL_TIME, timerRunning: false, resetToken: Date.now() });
      } else {
        setStateInner(data);
      }
    });
  }, []);

  // 함수 이름을 updateTeamScore로 통일합니다.
  const updateTeamScore = useCallback((teamId, amt) => {
    if (!state) return;
    const currentScore = state.teams[teamId].score || 0;
    update(ref(db), { [`math_escape_game/teams/${teamId}/score`]: currentScore + amt });
  }, [state]);

  const resetAll = useCallback(() => {
    const fresh = {
      // name을 ""로 초기화하지 않고 INIT_TEAMS의 고정 이름을 사용
      teams: INIT_TEAMS.map(t => ({ ...t, score: 0, roomsDone: [], takenBy: "" })),
      timerSec: TOTAL_TIME,
      timerRunning: false,
      resetToken: Date.now()
    };
    set(ref(db, 'math_escape_game'), fresh);
  }, []);

  // ── Actions ──────────────────────────────────
  
  const claimTeam = useCallback((teamId, nickname, sessionId) => {
    update(ref(db), {
      [`math_escape_game/teams/${teamId}/takenBy`]: sessionId,
      // name은 이미 지정되어 있으므로 덮어쓰지 않음
    });
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
    resetAll,
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