import { useState, useContext } from "react";
import { StudentContext } from "../context/StudentContext";

const API = "http://localhost:8000";

export default function Upload() {
  const { setStudentId } = useContext(StudentContext);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    setError("");
    setPreview(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      let json;
      try {
        json = JSON.parse(e.target.result);
      } catch {
        setError("JSON 格式錯誤，請確認為全人系統匯出的檔案");
        return;
      }

      const about = json?.[0]?.["課業學習"]?.aboutMe;
      setPreview(about || null);

      setLoading(true);
      try {
        const res = await fetch(`${API}/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: json }),
        });
        if (!res.ok) {
          const err = await res.json();
          setError(`上傳失敗：${err.detail}`);
          return;
        }
        const { student_id } = await res.json();
        setStudentId(student_id);
      } catch {
        setError("無法連線到後端，請確認後端伺服器已啟動");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f5f5f4",
      padding: "24px",
    }}>
      <div style={{ width: "100%", maxWidth: "480px" }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: "600", color: "#1c1917", marginBottom: "6px" }}>
            畢業學分檢核
          </h1>
          <p style={{ color: "#78716c", fontSize: "14px" }}>
            上傳全人系統匯出的 JSON 檔案以開始分析
          </p>
        </div>

        {/* Upload card */}
        <div className="card" style={{ padding: "28px" }}>
          {/* Drop zone */}
          <div
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => setDragging(true)}
            onDragLeave={() => setDragging(false)}
            style={{
              border: `1px dashed ${dragging ? "#a8a29e" : "#d6d3d1"}`,
              borderRadius: "6px",
              padding: "40px 24px",
              textAlign: "center",
              background: dragging ? "#fafaf9" : "white",
              transition: "all 0.15s",
            }}
          >
            <p style={{ fontWeight: "500", color: "#44403c", marginBottom: "4px" }}>
              拖曳 JSON 到這裡
            </p>
            <p style={{ color: "#a8a29e", fontSize: "13px", marginBottom: "16px" }}>或</p>
            <label style={{
              display: "inline-block",
              padding: "8px 20px",
              borderRadius: "6px",
              background: "#292524",
              color: "white",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
            }}>
              選擇檔案
              <input
                type="file"
                accept=".json"
                hidden
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </label>
          </div>

          {/* File selected */}
          {fileName && !error && (
            <div style={{
              marginTop: "14px",
              padding: "10px 14px",
              borderRadius: "6px",
              background: "#fafaf9",
              border: "1px solid #e7e5e4",
              fontSize: "13px",
              color: "#57534e",
            }}>
              {fileName}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "14px",
              padding: "10px 14px",
              borderRadius: "6px",
              background: "#fafaf9",
              fontSize: "13px",
              color: "#78716c",
            }}>
              <div className="spinner" />
              正在上傳並解析資料...
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              marginTop: "14px",
              padding: "10px 14px",
              borderRadius: "6px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              fontSize: "13px",
            }}>
              {error}
            </div>
          )}

          {/* Preview */}
          {preview && !loading && (
            <div style={{
              marginTop: "14px",
              padding: "16px",
              borderRadius: "6px",
              background: "#fafaf9",
              border: "1px solid #e7e5e4",
            }}>
              <p style={{ fontSize: "12px", color: "#78716c", marginBottom: "10px", fontWeight: "500" }}>
                讀取成功
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[
                  ["姓名", preview.chineseName],
                  ["學號", preview.studentNumber],
                  ["系所", preview.registerMajor],
                  ["年級", preview.departmentProgramGrade],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p style={{ color: "#a8a29e", fontSize: "11px", marginBottom: "2px" }}>{label}</p>
                    <p style={{ color: "#1c1917", fontSize: "13px", fontWeight: "500" }}>{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", color: "#a8a29e", fontSize: "12px", marginTop: "16px" }}>
          支援全人系統匯出的 JSON 格式
        </p>
      </div>
    </div>
  );
}
