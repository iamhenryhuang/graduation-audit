import { useEffect, useState } from "react";

const API = "http://localhost:8000";

const STATUS_COLORS = {
  "缺修": { bg: "#fef2f2", color: "#dc2626", label: "缺修" },
};

const CATEGORY_STYLES = {
  "必修": { bg: "#f3f0ff", color: "#6d28d9", label: "必" },
  "群修": { bg: "#eff6ff", color: "#1d4ed8", label: "群" },
  "通識": { bg: "#f0fdf4", color: "#15803d", label: "通" },
  "國防": { bg: "#f5f5f4", color: "#57534e", label: "防" },
  "選修": { bg: "#fefce8", color: "#92400e", label: "選" },
};

function groupBySemester(courses) {
  const map = {};
  for (const c of courses) {
    const key = `${c.academic_year}-${c.academic_semester}`;
    if (!map[key]) map[key] = { year: c.academic_year, semester: c.academic_semester, courses: [] };
    map[key].courses.push(c);
  }
  return Object.values(map);
}

export default function Courses({ studentId }) {
  const [courses, setCourses] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [openSems, setOpenSems] = useState({});

  useEffect(() => {
    fetch(`${API}/courses/${studentId}`)
      .then((r) => r.json())
      .then((data) => {
        setCourses(data);
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      載入中...
    </div>
  );

  const filtered = keyword
    ? courses.filter((c) => c.course_name.includes(keyword))
    : null;

  const semesters = groupBySemester(filtered ?? courses);

  const toggleSem = (key) =>
    setOpenSems((prev) => ({ ...prev, [key]: !prev[key] }));

  const totalCredits = (semCourses) =>
    semCourses.reduce((sum, c) => sum + (c.credit || 0), 0).toFixed(1);

  return (
    <div style={{ maxWidth: "900px" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", color: "#1e293b", marginBottom: "4px" }}>修課紀錄</h1>
        <p style={{ color: "#64748b", fontSize: "14px" }}>
          共 {courses.length} 門課程
          {filtered && `，搜尋結果 ${filtered.length} 筆`}
        </p>
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px", alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <span style={{
            position: "absolute", left: "12px", top: "50%",
            transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none",
          }}>🔍</span>
          <input
            type="text"
            placeholder="搜尋課程名稱..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{
              paddingLeft: "36px", paddingRight: "16px",
              paddingTop: "10px", paddingBottom: "10px",
              borderRadius: "10px", border: "1px solid #e2e8f0",
              fontSize: "14px", width: "280px", background: "white",
              color: "#1e293b", outline: "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          />
        </div>
        {keyword && (
          <button
            onClick={() => setKeyword("")}
            style={{
              padding: "8px 14px", borderRadius: "8px", border: "1px solid #e2e8f0",
              background: "white", color: "#64748b", fontSize: "13px", cursor: "pointer",
            }}
          >
            清除
          </button>
        )}
        {/* Expand / Collapse all */}
        {!keyword && (
          <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
            <button
              onClick={() => {
                const all = {};
                semesters.forEach(s => { all[`${s.year}-${s.semester}`] = true; });
                setOpenSems(all);
              }}
              style={{
                padding: "8px 14px", borderRadius: "8px", border: "1px solid #e2e8f0",
                background: "white", color: "#64748b", fontSize: "13px", cursor: "pointer",
              }}
            >展開全部</button>
            <button
              onClick={() => setOpenSems({})}
              style={{
                padding: "8px 14px", borderRadius: "8px", border: "1px solid #e2e8f0",
                background: "white", color: "#64748b", fontSize: "13px", cursor: "pointer",
              }}
            >收合全部</button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
        {Object.entries(CATEGORY_STYLES).map(([name, style]) => (
          <span key={name} style={{
            display: "inline-flex", alignItems: "center", gap: "5px",
            fontSize: "12px", color: "#64748b",
          }}>
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: "20px", height: "20px", borderRadius: "5px",
              fontSize: "10px", fontWeight: "700",
              background: style.bg, color: style.color,
            }}>{style.label}</span>
            {name}
          </span>
        ))}
      </div>

      {/* Semester accordion */}
      {semesters.length === 0 ? (
        <div className="card" style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>
          找不到相符的課程
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {semesters.map((sem) => {
            const key = `${sem.year}-${sem.semester}`;
            const isOpen = !!openSems[key];
            const semLabel = `${sem.year} 學年 第 ${sem.semester} 學期`;
            const passed = sem.courses.filter(c => c.score !== null && c.score >= 60).length;

            return (
              <div key={key} className="card" style={{ overflow: "hidden" }}>
                {/* Semester header */}
                <button
                  onClick={() => toggleSem(key)}
                  style={{
                    width: "100%", padding: "16px 20px",
                    display: "flex", alignItems: "center", gap: "12px",
                    background: isOpen ? "#fafafa" : "white",
                    border: "none", cursor: "pointer", textAlign: "left",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px" }}>
                      {semLabel}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: "9999px",
                      background: "#eef2ff", color: "#6366f1",
                      fontSize: "12px", fontWeight: "600",
                    }}>
                      {sem.courses.length} 門
                    </span>
                    <span style={{
                      padding: "3px 10px", borderRadius: "9999px",
                      background: "#f0fdf4", color: "#16a34a",
                      fontSize: "12px", fontWeight: "600",
                    }}>
                      {totalCredits(sem.courses)} 學分
                    </span>
                    <span style={{ color: "#94a3b8", fontSize: "12px", marginLeft: "4px" }}>
                      {isOpen ? "▲" : "▼"}
                    </span>
                  </div>
                </button>

                {/* Course table */}
                {isOpen && (
                  <div style={{ borderTop: "1px solid #f1f5f9" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr className="table-header">
                          <th style={{ minWidth: "200px" }}>課程名稱</th>
                          <th style={{ textAlign: "center" }}>學分</th>
                          <th style={{ textAlign: "center" }}>成績</th>
                          <th style={{ textAlign: "center" }}>狀態</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sem.courses.map((c, i) => {
                          const st = STATUS_COLORS[c.course_status];
                          return (
                            <tr key={i} className="table-row">
                              <td style={{ fontWeight: "500", color: "#1e293b" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  {c.category && (() => {
                                    const cat = CATEGORY_STYLES[c.category];
                                    return cat ? (
                                      <span style={{
                                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                                        width: "22px", height: "22px", borderRadius: "6px",
                                        fontSize: "11px", fontWeight: "700", flexShrink: 0,
                                        background: cat.bg, color: cat.color,
                                      }}>{cat.label}</span>
                                    ) : null;
                                  })()}
                                  {c.course_name}
                                </div>
                              </td>
                              <td style={{ textAlign: "center", color: "#475569" }}>
                                {c.credit}
                              </td>
                              <td style={{ textAlign: "center" }}>
                                {c.score !== null ? (
                                  <span className={c.score >= 60 ? "score-pass" : "score-fail"}>
                                    {c.score}
                                  </span>
                                ) : (
                                  <span style={{ color: "#94a3b8" }}>—</span>
                                )}
                              </td>
                              <td style={{ textAlign: "center" }}>
                                {c.course_status !== "有成績" && c.course_status ? (
                                  <span style={{
                                    display: "inline-block", padding: "3px 10px",
                                    borderRadius: "9999px", fontSize: "12px", fontWeight: "600",
                                    background: st?.bg || "#f1f5f9",
                                    color: st?.color || "#64748b",
                                  }}>
                                    {st?.label || c.course_status}
                                  </span>
                                ) : (
                                  <span style={{ color: "#94a3b8", fontSize: "13px" }}>—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
