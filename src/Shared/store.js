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
        set(stateRef, { 
          teams: INIT_TEAMS, 
          timerSec: TOTAL_TIME, 
          timerRunning: false, 
          resetToken: Date.now() 
        });
      } else {
        setStateInner(data);
      }
    });
  }, []);

  // 1. 점수 및 상태 업데이트 함수
  const updateTeamScore = useCallback((teamId, amt) => {
    if (!state) return;
    const currentScore = state.teams[teamId].score || 0;
    update(ref(db), { [`math_escape_game/teams/${teamId}/score`]: currentScore + amt });
  }, [state]);

  // 2. 초기화 함수 (오류 해결을 위해 확실히 정의)
  const resetAll = useCallback(() => {
    if (!window.confirm("모든 게임 데이터를 초기화하시겠습니까?")) return;
    const fresh = {
      teams: INIT_TEAMS.map(t => ({ 
        ...t, 
        score: 0, 
        roomsDone: [], 
        takenBy: "", 
        currentRoom: 0, 
        hints: [], 
        freezeUntil: 0 
      })),
      timerSec: TOTAL_TIME,
      timerRunning: false,
      resetToken: Date.now()
    };
    set(ref(db, 'math_escape_game'), fresh);
  }, []);

  // 3. 타이머 관련 함수

  const setTimerSeconds = useCallback((seconds) => {
    update(ref(db), { 
      "math_escape_game/timerSec": seconds,
      "math_escape_game/timerRunning": false // 설정 시 일단 정지
    });
  }, []);

  const setTimerRunning = useCallback((running) => {
    update(ref(db), { "math_escape_game/timerRunning": running });
  }, []);

  // ★ 15:50 종료 타이머 시작 함수
  const startTimerToTarget = useCallback(() => {
      const now = new Date();
      const target = new Date();
      
      // 오후 3시 50분 설정 (15시 50분)
      target.setHours(15, 50, 0, 0);

      // 만약 지금이 3시 50분보다 늦다면, 내일 3시 50분으로 설정
      if (now > target) {
        target.setDate(target.getDate() + 1);
      }

      // 남은 시간 계산 (초 단위)
      const diffSec = Math.floor((target - now) / 1000);

      // Firebase 업데이트 (시간 설정 및 타이머 시작)
      update(ref(db), { 
        "math_escape_game/timerRunning": true,
        "math_escape_game/timerSec": diffSec 
      });
  }, []);

  const tickTimer = useCallback(() => {
    if (!state || !state.timerRunning || state.timerSec <= 0) return;
    update(ref(db), { "math_escape_game/timerSec": state.timerSec - 1 });
  }, [state]);

  // 4. 팀 데이터 직접 수정 (힌트, 정지 등)
  const overrideTeam = useCallback((teamId, patch) => {
    if (!state) return;
    const teamRef = ref(db, `math_escape_game/teams/${teamId}`);
    update(teamRef, patch);
  }, [state]);

  const moveTeam = useCallback((teamId, roomId) => {
    update(ref(db), { [`math_escape_game/teams/${teamId}/currentRoom`]: roomId });
  }, []);

    // ★ 중요: return 안에 아래 이름들이 모두 포함되어야 합니다.
    return { 
      state, 
      updateTeamScore, 
      moveTeam, 
      resetAll, 
      setTimerRunning, 
      tickTimer, 
      overrideTeam, 
      startTimerToTarget,
      setTimerSeconds
    };
  }