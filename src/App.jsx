import { useState, useRef, useEffect } from "react";
import ClientApp from "./client/ClientApp.jsx";
import ManagerApp from "./manager/ManagerApp.jsx";
import { GLOBAL_CSS } from "./shared/constants.js";
import { useSharedStore } from "./shared/store.js"; // store 가져오기

export default function App() {
  const { state } = useSharedStore(); // 데이터를 미리 감시
  const params = new URLSearchParams(window.location.search);
  const isManager = params.get("view") === "manager";

  const [introState, setIntroState] = useState(isManager ? "end" : "button");
  const videoRef = useRef(null);

  // 강력한 키 차단 로직
  useEffect(() => {
    const handleKeyDown = (e) => {
      const forbiddenKeys = ["F11", "Escape", "Meta", "Control", "Alt", "Tab"];
      if (forbiddenKeys.includes(e.key) || e.ctrlKey || e.altKey || e.metaKey) {
        if (!isManager) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [isManager]);

  const startExperience = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) await elem.requestFullscreen();
    } catch (err) { console.warn(err); }

    setIntroState("playing");
    setTimeout(() => {
      if (videoRef.current) videoRef.current.play().catch(() => setIntroState("end"));
    }, 150);
  };

  // 렌더링 로직
  if (introState === "end") {
    // 중요: state가 null이면 아직 데이터를 못 불러온 것이므로 로딩 화면 표시
    if (!state) {
      return (
        <div style={{ 
          width: "100vw", height: "100vh", backgroundColor: "#0a0b14", 
          display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "var(--mono)" 
        }}>
          LOADING DATA...
        </div>
      );
    }

    return (
      <div style={{ width: "100vw", height: "100vh", backgroundColor: "#0a0b14" }}>
        <style>{GLOBAL_CSS}</style>
        {isManager ? <ManagerApp /> : <ClientApp />}
      </div>
    );
  }

  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "#000", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden", width: "100vw", height: "100vh"
    }}>
      <style>{GLOBAL_CSS}</style>
      <style>{`
        .skip-btn {
          position: absolute; bottom: 40px; right: 40px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.7); padding: 12px 24px; border-radius: 4px; 
          cursor: pointer; font-family: 'JetBrains Mono', monospace; font-size: 13px; z-index: 10001;
        }
        .skip-btn:hover { background: rgba(255,255,255,0.15); color: #fff; border-color: #fff; }
      `}</style>

      {introState === "button" && (
        <div style={{ textAlign: "center" }}>
          <h1 style={{ color: "#fff", letterSpacing: 10, fontSize: 32, marginBottom: 40, fontFamily: "var(--mono)" }}>MATH ESCAPE</h1>
          <button onClick={startExperience} style={{ background: "none", border: "1px solid #fff", borderRadius: "50%", width: 100, height: 100, cursor: "pointer", color: "#fff" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </button>
        </div>
      )}

      {introState === "playing" && (
        <>
          <video ref={videoRef} onEnded={() => setIntroState("end")} playsInline style={{ width: "100%", height: "100%", objectFit: "contain" }}>
            <source src="/intro.mp4" type="video/mp4" />
          </video>
          <button className="skip-btn" onClick={() => setIntroState("end")}>SKIP INTRO ≫</button>
        </>
      )}
    </div>
  );
}