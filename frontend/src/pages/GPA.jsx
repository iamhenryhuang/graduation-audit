import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";

const API = "http://localhost:8000";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "white", border: "1px solid #e7e5e4",
      borderRadius: "6px", padding: "10px 14px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)", fontSize: "13px",
    }}>
      <p style={{ fontWeight: "500", color: "#44403c", marginBottom: "4px" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}：{p.value}</p>
      ))}
    </div>
  );
};

export default function GPA({ studentId }) {
  const [gpa, setGpa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openSem, setOpenSem] = useState(null);

  useEffect(() => {
    fetch(`${API}/gpa/${studentId}`)
      .then((r) => r.json())
      .then(setGpa)
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <div className="loading-screen"><div className="spinner" />載入中...</div>;
  if (!gpa) return <div className="loading-screen">載入失敗</div>;

  const chartData = gpa.semesters.map((sem) => ({
    semester: sem.label,
    "學校制": parseFloat(sem.gpa.toFixed(2)),
    "4.0 制": parseFloat(sem.std_gpa.toFixed(2)),
  }));

  return (
    <div style={{ maxWidth: "1000px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "20px", marginBottom: "4px" }}>GPA 分析</h1>
        <p style={{ color: "#78716c", fontSize: "13px" }}>歷年 GPA 趨勢與各學期明細</p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        {[
          { label: "學校制 GPA", value: gpa.overall_gpa.toFixed(2) },
          { label: "4.0 制 GPA", value: gpa.overall_std_gpa.toFixed(2) },
          { label: "計入學分數", value: gpa.total_credits.toFixed(1) },
        ].map(({ label, value }) => (
          <div key={label} className="card" style={{ flex: 1, minWidth: "140px", padding: "16px 20px" }}>
            <p style={{ color: "#78716c", fontSize: "12px", marginBottom: "6px" }}>{label}</p>
            <p style={{ fontSize: "22px", fontWeight: "600", color: "#1c1917" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card" style={{ padding: "20px 24px", marginBottom: "16px" }}>
        <p style={{ fontSize: "14px", fontWeight: "500", color: "#1c1917", marginBottom: "16px" }}>
          歷年 GPA 趨勢
        </p>
        <div style={{ height: "280px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
              <XAxis dataKey="semester" tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={{ stroke: "#e7e5e4" }} tickLine={false} />
              <YAxis domain={[0, 4.3]} tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px", color: "#78716c" }} />
              <ReferenceLine y={2.0} stroke="#fca5a5" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="學校制" stroke="#44403c" strokeWidth={2} dot={{ r: 3, fill: "#44403c", strokeWidth: 0 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="4.0 制" stroke="#a8a29e" strokeWidth={1.5} strokeDasharray="5 5" dot={{ r: 3, fill: "#a8a29e", strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Semester details */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f5f5f4" }}>
          <p style={{ fontSize: "14px", fontWeight: "500", color: "#1c1917" }}>各學期明細</p>
        </div>
        {gpa.semesters.map((sem, i) => {
          const isOpen = openSem === i;
          return (
            <div key={i} style={{ borderBottom: "1px solid #f5f5f4" }}>
              <button
                onClick={() => setOpenSem(isOpen ? null : i)}
                style={{
                  width: "100%", padding: "13px 20px",
                  display: "flex", alignItems: "center",
                  background: isOpen ? "#fafaf9" : "none",
                  border: "none", cursor: "pointer", textAlign: "left",
                }}
              >
                <span style={{ flex: 1, fontSize: "14px", color: "#1c1917", fontWeight: "500" }}>
                  {sem.label}
                </span>
                <span style={{ color: "#78716c", fontSize: "13px" }}>
                  {sem.total_credits.toFixed(1)} 學分
                </span>
                <span style={{ color: "#44403c", fontSize: "13px", fontWeight: "600", marginLeft: "16px", minWidth: "40px", textAlign: "right" }}>
                  {sem.gpa.toFixed(2)}
                </span>
                <span style={{ color: "#a8a29e", fontSize: "12px", marginLeft: "8px" }}>
                  4.0: {sem.std_gpa.toFixed(2)}
                </span>
                <span style={{ color: "#a8a29e", fontSize: "11px", marginLeft: "10px" }}>
                  {isOpen ? "▲" : "▼"}
                </span>
              </button>

              {isOpen && (
                <div style={{ padding: "0 20px 14px", background: "#fafaf9" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["課程名稱", "學分", "成績", "GPA"].map((h, j) => (
                          <th key={j} style={{
                            padding: "8px 10px", textAlign: j === 0 ? "left" : "center",
                            fontSize: "11px", fontWeight: "500", color: "#a8a29e",
                            background: "#f5f5f4", borderRadius: j === 0 ? "4px 0 0 4px" : j === 3 ? "0 4px 4px 0" : undefined,
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sem.courses.map((c, j) => (
                        <tr key={j} style={{ borderBottom: "1px solid #f5f5f4" }}>
                          <td style={{ padding: "9px 10px", fontSize: "13px", color: "#44403c" }}>{c.course_name}</td>
                          <td style={{ padding: "9px 10px", textAlign: "center", fontSize: "13px", color: "#78716c" }}>{c.credit}</td>
                          <td style={{ padding: "9px 10px", textAlign: "center" }}>
                            <span className={c.score >= 60 ? "score-pass" : "score-fail"}>{c.score}</span>
                          </td>
                          <td style={{ padding: "9px 10px", textAlign: "center", fontSize: "13px", color: "#57534e", fontWeight: "500" }}>{c.school_gpa}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
