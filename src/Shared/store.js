import { useState, useEffect, useCallback } from "react";
import { STORE_KEY, INIT_TEAMS, TOTAL_TIME } from "./constants.js";

// ── Initial state shape ────────────────────────────────────────────────────────
const initState = () => ({
  teams: INIT_TEAMS.map(t => ({ ...t })),
  timerSec: TOTAL_TIME,
  timerRunning: true,
  // per-team solved rooms are stored inside each team object
  // client-side: my team's solvedRooms (team id 0)
});

// ── Persist helpers ────────────────────────────────────────────────────────────
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : initState();
  } catch {
    return initState();
  }
}

function save(state) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {}
}

// ── Custom hook: useSharedStore ───────────────────────────────────────────────
// Every tab that calls this hook reads/writes the same localStorage key.
// On storage events from other tabs, local state re-syncs automatically.

export function useSharedStore() {
  const [state, setStateInner] = useState(load);

  // Sync from other tabs via storage event
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORE_KEY && e.newValue) {
        try { setStateInner(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Persist every state change
  const setState = useCallback((updater) => {
    setStateInner(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      save(next);
      return next;
    });
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const updateTeamName = useCallback((teamId, name) => {
    setState(s => ({
      ...s,
      teams: s.teams.map(t => t.id === teamId ? { ...t, name } : t),
    }));
  }, [setState]);

  const updateTeamEmoji = useCallback((teamId, emoji) => {
    setState(s => ({
      ...s,
      teams: s.teams.map(t => t.id === teamId ? { ...t, emoji } : t),
    }));
  }, [setState]);

  const solveRoom = useCallback((teamId, roomId, pts) => {
    setState(s => ({
      ...s,
      teams: s.teams.map(t =>
        t.id === teamId
          ? { ...t, score: t.score + pts, roomsDone: [...t.roomsDone, roomId], currentRoom: roomId }
          : t
      ),
    }));
  }, [setState]);

  const moveTeam = useCallback((teamId, roomId) => {
    setState(s => ({
      ...s,
      teams: s.teams.map(t => t.id === teamId ? { ...t, currentRoom: roomId } : t),
    }));
  }, [setState]);

  const simulateTick = useCallback((rooms) => {
    setState(s => ({
      ...s,
      teams: s.teams.map(team => {
        if (team.id === 0) return team; // never simulate MY team
        if (Math.random() > 0.15) return team;
        const nextId = team.roomsDone.length;
        if (nextId >= rooms.length) return team;
        return {
          ...team,
          roomsDone: [...team.roomsDone, nextId],
          score: team.score + rooms[nextId].points,
          currentRoom: nextId,
        };
      }),
    }));
  }, [setState]);

  const setTimerRunning = useCallback((running) => {
    setState(s => ({ ...s, timerRunning: running }));
  }, [setState]);

  const tickTimer = useCallback(() => {
    setState(s => {
      if (!s.timerRunning || s.timerSec <= 0) return s;
      return { ...s, timerSec: s.timerSec - 1 };
    });
  }, [setState]);

  const resetAll = useCallback(() => {
    const fresh = initState();
    save(fresh);
    setStateInner(fresh);
  }, []);

  // Manager: override a specific team's score/rooms directly
  const overrideTeam = useCallback((teamId, patch) => {
    setState(s => ({
      ...s,
      teams: s.teams.map(t => t.id === teamId ? { ...t, ...patch } : t),
    }));
  }, [setState]);

  return {
    state,
    updateTeamName,
    updateTeamEmoji,
    solveRoom,
    moveTeam,
    simulateTick,
    setTimerRunning,
    tickTimer,
    resetAll,
    overrideTeam,
  };
}
