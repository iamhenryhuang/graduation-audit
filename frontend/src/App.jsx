import { useContext, useState } from "react";
import { StudentContext } from "./context/StudentContext";
import Upload from "./pages/Upload";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Audit from "./pages/Audit";
import GPA from "./pages/GPA";

const NAV_ITEMS = [
  { id: "dashboard", label: "總覽" },
  { id: "courses",   label: "修課紀錄" },
  { id: "audit",     label: "畢業審核" },
  { id: "gpa",       label: "GPA 分析" },
];

export default function App() {
  const { studentId, setStudentId } = useContext(StudentContext);
  const [page, setPage] = useState("dashboard");

  if (!studentId) return <Upload />;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f5f4" }}>
      {/* Sidebar */}
      <aside style={{
        width: "220px",
        background: "#292524",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        height: "100vh",
      }}>
        {/* Logo */}
        <div style={{
          padding: "24px 20px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <p style={{ color: "#fafaf9", fontWeight: "600", fontSize: "15px", marginBottom: "2px" }}>
            畢業學分檢核
          </p>
          <p style={{ color: "#78716c", fontSize: "12px" }}>
            Graduation Audit
          </p>
        </div>

        {/* Nav */}
        <nav style={{ padding: "12px 10px", flex: 1 }}>
          {NAV_ITEMS.map(({ id, label }) => (
            <button
              key={id}
              className={`nav-btn ${page === id ? "active" : ""}`}
              onClick={() => setPage(id)}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            className="nav-btn"
            style={{ color: "#a8a29e" }}
            onClick={() => { setStudentId(null); setPage("dashboard"); }}
          >
            重新上傳
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: "36px 40px", minWidth: 0 }}>
        {page === "dashboard" && <Dashboard studentId={studentId} />}
        {page === "courses"   && <Courses   studentId={studentId} />}
        {page === "audit"     && <Audit     studentId={studentId} />}
        {page === "gpa"       && <GPA       studentId={studentId} />}
      </main>
    </div>
  );
}
