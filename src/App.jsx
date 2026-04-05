import { useState, useRef, useEffect } from "react";
import ClientApp from "./client/ClientApp.jsx";
import ManagerApp from "./manager/ManagerApp.jsx";
import { GLOBAL_CSS } from "./shared/constants.js";
import { useSharedStore } from "./shared/store.js";

export default function App() {
  const { state } = useSharedStore();
  const params = new URLSearchParams(window.location.search);
  const isManager = params.get("view") === "manager";

  const [introState, setIntroState] = useState(isManager ? "end" : "button");
  
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

    // 버튼 클릭 시 영상 재생 상태로 변경
    setIntroState("playing");
  };

  if (introState === "end") {
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
          cursor: pointer; font-family: 'JetBrains Mono', monospace; font-size: 13px; z-index: 10005;
        }
        .skip-btn:hover { background: rgba(255,255,255,0.15); color: #fff; border-color: #fff; }
      `}</style>

      {/* 1. 시작 버튼 화면: introState가 'button'일 때만 보임 */}
      {introState === "button" && (
        <div style={{ textAlign: "center", zIndex: 10001 }}>
          <h1 style={{ color: "#fff", letterSpacing: 10, fontSize: 32, marginBottom: 40, fontFamily: "var(--mono)" }}>MATH ESCAPE</h1>
          <button onClick={startExperience} style={{ background: "none", border: "1px solid #fff", borderRadius: "50%", width: 100, height: 100, cursor: "pointer", color: "#fff" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </button>
        </div>
      )}

      {/* 2. 유튜브 영상 화면: introState가 'playing'일 때만 보임 */}
      {introState === "playing" && (
        <>
          <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
            <iframe
              width="100%"
              height="100%"
              /* vq=hd1080(고화질), autoplay=1(자동재생), mute=0(소리있음), controls=1(유튜브재생버튼활성화) */
              src="https://www.youtube.com/embed/dLSkLGODgrY?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1&vq=hd1080&enablejsapi=1"
              title="Intro Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ 
                border: "none", width: "100vw", height: "56.25vw", 
                minHeight: "100vh", minWidth: "177.77vh", 
                position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" 
              }}
            ></iframe>
          </div>
          <button style={{ background: "rgba(121, 90, 90, 0.39)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)", padding: "12px 24px", borderRadius: "4px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}
              className="skip-btn" onClick={() => setIntroState("end")}>SKIP INTRO ≫</button>
        </>
      )}
    </div>
  );
}