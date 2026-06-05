import { useEffect, useState } from "react";
import CreditPieChart from "../components/CreditPieChart";

const API = "http://localhost:8000";

function StatCard({ title, value }) {
  return (
    <div className="card" style={{ padding: "18px 20px", flex: 1, minWidth: "140px" }}>
      <p style={{ color: "#78716c", fontSize: "12px", marginBottom: "6px" }}>{title}</p>
      <p style={{ fontSize: "24px", fontWeight: "600", color: "#1c1917" }}>{value}</p>
    </div>
  );
}

export default function Dashboard({ studentId }) {
  const [student, setStudent] = useState(null);
  const [audit, setAudit] = useState(null);
  const [gpa, setGpa] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/student/${studentId}`).then((r) => r.json()),
      fetch(`${API}/audit/${studentId}`).then((r) => r.json()),
      fetch(`${API}/gpa/${studentId}`).then((r) => r.json()),
    ])
      .then(([s, a, g]) => { setStudent(s); setAudit(a); setGpa(g); })
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <div className="loading-screen"><div className="spinner" />載入中...</div>;
  if (!student || !audit || !gpa) return <div className="loading-screen">載入失敗</div>;

  const earned = audit.summary.total_earned;
  const required = audit.summary.total_required;
  const remain = required - earned;
  const progress = Math.min((earned / required) * 100, 100);
  const graduated = audit.summary.is_graduated;

  const latestSemester = gpa.semesters[gpa.semesters.length - 1];
  const latestCourses = latestSemester?.courses?.slice(0, 5) || [];

  const alerts = [
    !audit.required.is_passed && `專業必修尚缺 ${audit.required.missing.length} 門`,
    !audit.group.is_passed   && "群修學分未達標",
    !audit.general.is_passed && "通識學分未達標",
    !audit.physical.is_passed && `體育尚缺 ${audit.physical.shortage.toFixed(1)} 學分`,
    !audit.elective.is_passed && `選修尚缺 ${(audit.elective.required_credits - audit.elective.total_credits).toFixed(1)} 學分`,
  ].filter(Boolean);

  return (
    <div style={{ maxWidth: "1100px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "20px", marginBottom: "4px" }}>{student.chinese_name}</h1>
        <p style={{ color: "#78716c", fontSize: "13px" }}>
          {student.student_id} · {student.department} · {student.enrollment_year} 年入學
        </p>
      </div>

      {/* 畢業狀態 */}
      <div className="card" style={{
        padding: "14px 18px",
        marginBottom: "20px",
        background: graduated ? "#f0fdf4" : "#fef2f2",
        border: `1px solid ${graduated ? "#bbf7d0" : "#fecaca"}`,
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}>
        <span style={{ fontSize: "13px", fontWeight: "500", color: graduated ? "#15803d" : "#dc2626" }}>
          {graduated ? "符合畢業資格" : "尚未符合畢業資格"}
        </span>
        {!graduated && alerts.length > 0 && (
          <span style={{ color: "#a8a29e", fontSize: "13px" }}>
            — 還有 {alerts.length} 項條件未達標
          </span>
        )}
      </div>

      {/* 上方：學分圖 + 統計 */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
        <div className="card" style={{ padding: "20px 24px", flexShrink: 0 }}>
          <p style={{ color: "#78716c", fontSize: "12px", marginBottom: "2px" }}>學分完成比例</p>
          <p style={{ color: "#a8a29e", fontSize: "12px", marginBottom: "8px" }}>
            {earned.toFixed(1)} / {required} 學分
          </p>
          <CreditPieChart earned={earned} remain={remain} />
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px", minWidth: "280px" }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <StatCard title="已修學分"  value={earned.toFixed(1)} />
            <StatCard title="剩餘學分"  value={remain.toFixed(1)} />
            <StatCard title="完成率"    value={`${progress.toFixed(1)}%`} />
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <StatCard title="學校 GPA" value={gpa.overall_gpa.toFixed(2)} />
            <StatCard title="4.0 GPA"  value={gpa.overall_std_gpa.toFixed(2)} />
          </div>

          {/* Progress bar */}
          <div className="card" style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "13px", color: "#57534e" }}>畢業進度</span>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#1c1917" }}>{progress.toFixed(1)}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
              <span style={{ fontSize: "11px", color: "#a8a29e" }}>已修 {earned.toFixed(1)} 學分</span>
              <span style={{ fontSize: "11px", color: "#a8a29e" }}>尚缺 {remain.toFixed(1)} 學分</span>
            </div>
          </div>
        </div>
      </div>

      {/* 下方：最近修課 + 提醒 */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <div className="card" style={{ flex: 2, minWidth: "280px", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f5f5f4" }}>
            <p style={{ fontWeight: "500", fontSize: "14px", color: "#1c1917" }}>最近修課紀錄</p>
            <p style={{ color: "#a8a29e", fontSize: "12px", marginTop: "2px" }}>{latestSemester?.label}</p>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr className="table-header">
                <th>課程名稱</th>
                <th style={{ textAlign: "center" }}>學分</th>
                <th style={{ textAlign: "center" }}>成績</th>
              </tr>
            </thead>
            <tbody>
              {latestCourses.map((c, i) => (
                <tr key={i} className="table-row">
                  <td>{c.course_name}</td>
                  <td style={{ textAlign: "center", color: "#78716c" }}>{c.credit}</td>
                  <td style={{ textAlign: "center" }}>
                    <span className={c.score >= 60 ? "score-pass" : "score-fail"}>{c.score}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ flex: 1, minWidth: "220px", padding: "20px" }}>
          <p style={{ fontWeight: "500", fontSize: "14px", color: "#1c1917", marginBottom: "14px" }}>畢業提醒</p>
          {alerts.length === 0 ? (
            <p style={{ color: "#16a34a", fontSize: "13px" }}>所有條件均已達標</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {alerts.map((item, i) => (
                <div key={i} style={{
                  padding: "10px 12px",
                  borderRadius: "6px",
                  background: "#fafaf9",
                  border: "1px solid #e7e5e4",
                  fontSize: "13px",
                  color: "#44403c",
                }}>
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
