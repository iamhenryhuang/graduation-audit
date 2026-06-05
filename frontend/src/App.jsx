import { useContext, useEffect, useRef, useState } from "react";
import { StudentContext } from "./context/StudentContext";
import Upload from "./pages/Upload";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Audit from "./pages/Audit";
import GPA from "./pages/GPA";
import startupAudioSrc from "../mix_02s (audio-joiner.com).mp3";
import completedAudioSrc from "../videoplayback (2) (online-video-cutter.com).mp3";

const NAV_ITEMS = [
  { id: "dashboard", label: "總覽" },
  { id: "courses",   label: "修課紀錄" },
  { id: "audit",     label: "畢業審核" },
  { id: "gpa",       label: "GPA 分析" },
];

export default function App() {
  const { studentId, setStudentId } = useContext(StudentContext);
  const [page, setPage] = useState("dashboard");
  const [showAudioPrompt, setShowAudioPrompt] = useState(true);
  const [showCompletedAudioPrompt, setShowCompletedAudioPrompt] = useState(false);
  const [audioError, setAudioError] = useState("");
  const hasInitializedAudioRef = useRef(false);
  const audioRef = useRef(null);
  const completedAudioRef = useRef(null);
  const previousStudentIdRef = useRef(null);

  useEffect(() => {
    if (hasInitializedAudioRef.current) {
      return undefined;
    }

    hasInitializedAudioRef.current = true;

    audioRef.current = new Audio(startupAudioSrc);
    completedAudioRef.current = new Audio(completedAudioSrc);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      if (completedAudioRef.current) {
        completedAudioRef.current.pause();
        completedAudioRef.current.currentTime = 0;
      }
    };
  }, []);

  useEffect(() => {
    if (!studentId) {
      previousStudentIdRef.current = null;
      setShowCompletedAudioPrompt(false);
      return;
    }

    if (previousStudentIdRef.current !== studentId) {
      previousStudentIdRef.current = studentId;
      setShowCompletedAudioPrompt(true);
    }
  }, [studentId]);

  const handleEnableAudio = async () => {
    if (!audioRef.current) {
      return;
    }

    try {
      setAudioError("");
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      setShowAudioPrompt(false);
    } catch (error) {
      setAudioError("開場音效播放失敗，請再點一次或確認瀏覽器音訊權限。");
      console.error("Audio playback failed:", error);
    }
  };

  const handlePlayCompletedAudio = async () => {
    if (!completedAudioRef.current) {
      return;
    }

    try {
      setAudioError("");
      completedAudioRef.current.currentTime = 0;
      await completedAudioRef.current.play();
      setShowCompletedAudioPrompt(false);
    } catch (error) {
      setAudioError("完成提示音播放失敗，請再點一次或確認瀏覽器音訊權限。");
      console.error("Completed audio playback failed:", error);
    }
  };

  if (!studentId) {
    return (
      <>
        <Upload />
        {showAudioPrompt && (
          <button
            type="button"
            onClick={handleEnableAudio}
            style={{
              position: "fixed",
              right: "20px",
              bottom: "20px",
              zIndex: 9999,
              border: "none",
              borderRadius: "999px",
              padding: "10px 14px",
              background: "rgba(15, 23, 42, 0.92)",
              color: "#f8fafc",
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.18)",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            點一下開啟音效
          </button>
        )}
      </>
    );
  }

  return (
    <>
      <div style={{ display: "flex", minHeight: "100vh", background: "#f1f5f9" }}>
        {/* Sidebar */}
        <aside style={{
          width: "240px",
          background: "linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)",
          display: "flex",
          flexDirection: "column",
          padding: "0",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "100vh",
        }}>
          {/* Logo */}
          <div style={{
            padding: "28px 20px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "6px",
            }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                flexShrink: 0,
              }}>🎓</div>
              <span style={{ color: "white", fontWeight: "700", fontSize: "15px" }}>
                Graduation Audit
              </span>
            </div>
            <p style={{ color: "#64748b", fontSize: "12px", marginLeft: "46px" }}>
              畢業學分檢核系統
            </p>
          </div>

          {/* Nav */}
          <nav style={{ padding: "16px 12px", flex: 1 }}>
            <p style={{
              color: "#475569",
              fontSize: "11px",
              fontWeight: "600",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "0 6px",
              marginBottom: "8px",
            }}>選單</p>

            {NAV_ITEMS.map(({ id, icon, label }) => (
              <button
                key={id}
                className={`nav-btn ${page === id ? "active" : ""}`}
                onClick={() => setPage(id)}
              >
                <span style={{ fontSize: "16px", opacity: 0.85 }}>{icon}</span>
                {label}
                {page === id && (
                  <span style={{
                    marginLeft: "auto",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#818cf8",
                    flexShrink: 0,
                  }} />
                )}
              </button>
            ))}
          </nav>

          {/* Bottom */}
          <div style={{
            padding: "16px 12px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}>
            <button
              className="nav-btn"
              style={{ color: "#f87171" }}
              onClick={() => { setStudentId(null); setPage("dashboard"); }}
            >
              <span style={{ fontSize: "16px" }}>↩</span>
              重新上傳 JSON
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, padding: "32px", minWidth: 0, overflowX: "auto" }}>
          {page === "dashboard" && <Dashboard studentId={studentId} />}
          {page === "courses"   && <Courses   studentId={studentId} />}
          {page === "audit"     && <Audit     studentId={studentId} />}
          {page === "gpa"       && <GPA       studentId={studentId} />}
        </main>
      </div>

      {showAudioPrompt && (
        <button
          type="button"
          onClick={handleEnableAudio}
          style={{
            position: "fixed",
            right: "20px",
            bottom: "20px",
            zIndex: 9999,
            border: "none",
            borderRadius: "999px",
            padding: "10px 14px",
            background: "rgba(15, 23, 42, 0.92)",
            color: "#f8fafc",
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.18)",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          點一下開啟音效
        </button>
      )}

      {showCompletedAudioPrompt && (
        <button
          type="button"
          onClick={handlePlayCompletedAudio}
          style={{
            position: "fixed",
            right: "20px",
            bottom: showAudioPrompt ? "72px" : "20px",
            zIndex: 9999,
            border: "none",
            borderRadius: "999px",
            padding: "10px 14px",
            background: "rgba(22, 101, 52, 0.94)",
            color: "#f0fdf4",
            boxShadow: "0 10px 30px rgba(22, 101, 52, 0.22)",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          跑完了，播放提示音
        </button>
      )}

      {audioError && (
        <div
          style={{
            position: "fixed",
            left: "20px",
            bottom: "20px",
            zIndex: 9999,
            maxWidth: "440px",
            padding: "12px 14px",
            borderRadius: "14px",
            background: "rgba(127, 29, 29, 0.95)",
            color: "#fef2f2",
            boxShadow: "0 10px 30px rgba(127, 29, 29, 0.18)",
            fontSize: "13px",
            lineHeight: 1.5,
          }}
        >
          {audioError}
        </div>
      )}
    </>
  );
}
