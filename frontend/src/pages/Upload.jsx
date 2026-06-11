import { useRef, useState } from "react";
import { useStudent } from "../context/student";
import { postJSON } from "../lib/api";
import { Spinner } from "../components/ui";
import { AlertIcon, CapIcon, CheckCircleIcon, DocumentUpIcon } from "../components/Icons";

function readFileAsJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("檔案讀取失敗"));
    reader.onload = (e) => {
      try {
        resolve(JSON.parse(e.target.result));
      } catch {
        reject(new Error("JSON 格式錯誤，請確認為全人系統匯出的檔案"));
      }
    };
    reader.readAsText(file);
  });
}

export default function Upload() {
  const { setStudentId } = useStudent();
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const dragDepth = useRef(0);

  const handleFile = async (file) => {
    if (!file || loading) return;
    setFileName(file.name);
    setError("");
    setPreview(null);
    setLoading(true);

    try {
      const json = await readFileAsJSON(file);
      setPreview(json?.[0]?.["課業學習"]?.aboutMe ?? null);
      const { student_id } = await postJSON("/upload", { data: json });
      setStudentId(student_id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-slate-950 p-6">
      {/* 背景裝飾 */}
      <div className="pointer-events-none absolute -top-32 -left-32 size-[480px] rounded-full bg-indigo-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -bottom-32 size-[480px] rounded-full bg-violet-600/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 size-72 -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />

      <div className="relative w-full max-w-md animate-fade-up">
        {/* 品牌 */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-500/30">
            <CapIcon className="size-8" strokeWidth={1.6} />
          </div>
          <h1 className="text-2xl font-black text-white">畢業學分審核系統</h1>
          <p className="mt-2 text-sm text-slate-400">
            上傳全人系統匯出的選課紀錄 JSON，自動檢核畢業條件
          </p>
        </div>

        {/* 上傳卡片 */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <label
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={(e) => {
              e.preventDefault();
              dragDepth.current += 1;
              setDragging(true);
            }}
            onDragLeave={() => {
              dragDepth.current -= 1;
              if (dragDepth.current <= 0) setDragging(false);
            }}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
              dragging
                ? "border-indigo-400 bg-indigo-500/10"
                : "border-white/15 hover:border-white/30 hover:bg-white/5"
            }`}
          >
            <DocumentUpIcon
              className={`size-10 transition-colors ${dragging ? "text-indigo-300" : "text-slate-500"}`}
              strokeWidth={1.3}
            />
            <div>
              <p className="font-semibold text-slate-200">拖曳 JSON 檔案到這裡</p>
              <p className="mt-1 text-xs text-slate-500">或點擊選擇檔案</p>
            </div>
            <input
              type="file"
              accept=".json,application/json"
              hidden
              disabled={loading}
              onChange={(e) => {
                handleFile(e.target.files[0]);
                e.target.value = "";
              }}
            />
          </label>

          {/* 狀態列 */}
          {loading && (
            <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-white/5 px-4 py-3 text-sm text-slate-300">
              <Spinner className="size-4 border-white/20 border-t-indigo-400" />
              正在上傳並解析「{fileName}」...
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300 ring-1 ring-rose-500/30 ring-inset">
              <AlertIcon className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          )}

          {preview && !loading && !error && (
            <div className="mt-4 rounded-xl bg-white/5 p-4 ring-1 ring-white/10 ring-inset">
              <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <CheckCircleIcon className="size-4" />
                讀取成功
              </p>
              <dl className="grid grid-cols-2 gap-3">
                {[
                  ["姓名", preview.chineseName],
                  ["學號", preview.studentNumber],
                  ["系所", preview.registerMajor],
                  ["年級", preview.departmentProgramGrade],
                ].map(([label, val]) => (
                  <div key={label}>
                    <dt className="text-[11px] text-slate-500">{label}</dt>
                    <dd className="text-sm font-medium text-slate-200">{val ?? "—"}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          僅支援資科系 112 學年入學畢業規則 · 資料只儲存於本機後端
        </p>
      </div>
    </div>
  );
}
