import { useEffect, useRef, useState } from "react";
import { useStudent } from "../context/student";
import startupAudioSrc from "../../mix_02s (audio-joiner.com).mp3";
import completedAudioSrc from "../../videoplayback (2) (online-video-cutter.com).mp3";

function SpeakerIcon({ className = "size-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
    </svg>
  );
}

const pillClass =
  "pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold text-white shadow-xl transition hover:scale-[1.03] active:scale-95";

/**
 * 音效提示（瀏覽器限制需使用者點擊才能播放）：
 * 開場音效 + 上傳完成提示音
 */
export default function AudioCues() {
  const { studentId } = useStudent();
  const [showStartup, setShowStartup] = useState(true);
  // 記錄已播放過完成提示音的學號，顯示與否直接由目前學號推導
  const [completedPlayedFor, setCompletedPlayedFor] = useState(null);
  const [error, setError] = useState("");
  const startupRef = useRef(null);
  const completedRef = useRef(null);

  const showCompleted = Boolean(studentId) && completedPlayedFor !== studentId;

  useEffect(() => {
    startupRef.current = new Audio(startupAudioSrc);
    completedRef.current = new Audio(completedAudioSrc);
    return () => {
      for (const ref of [startupRef, completedRef]) {
        ref.current?.pause();
        ref.current = null;
      }
    };
  }, []);

  const play = async (ref, hide, failMessage) => {
    if (!ref.current) return;
    try {
      setError("");
      ref.current.currentTime = 0;
      await ref.current.play();
      hide();
    } catch {
      setError(failMessage);
    }
  };

  return (
    <div className="pointer-events-none fixed right-5 bottom-5 z-50 flex flex-col items-end gap-2.5">
      {error && (
        <p className="pointer-events-auto max-w-xs rounded-2xl bg-rose-900/95 px-4 py-2.5 text-[13px] leading-relaxed text-rose-50 shadow-xl">
          {error}
        </p>
      )}
      {showCompleted && (
        <button
          type="button"
          onClick={() =>
            play(completedRef, () => setCompletedPlayedFor(studentId), "提示音播放失敗，請再點一次或確認瀏覽器音訊權限。")
          }
          className={`${pillClass} bg-emerald-700/95 hover:bg-emerald-600`}
        >
          <SpeakerIcon />
          跑完了，播放提示音
        </button>
      )}
      {showStartup && (
        <button
          type="button"
          onClick={() =>
            play(startupRef, () => setShowStartup(false), "開場音效播放失敗，請再點一次或確認瀏覽器音訊權限。")
          }
          className={`${pillClass} bg-slate-900/95 hover:bg-slate-700`}
        >
          <SpeakerIcon />
          點一下開啟音效
        </button>
      )}
    </div>
  );
}
