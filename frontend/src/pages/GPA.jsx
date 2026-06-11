import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStudent } from "../context/student";
import { useApi } from "../hooks/useApi";
import { Card, ErrorState, Loading, PageHeader, ScoreText, StatCard } from "../components/ui";
import { ChevronDownIcon } from "../components/Icons";

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] shadow-lg">
      <p className="mb-1 font-semibold text-slate-700">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="tnum" style={{ color: p.color }}>
          {p.name}：{p.value}
        </p>
      ))}
    </div>
  );
}

export default function GPA() {
  const { studentId } = useStudent();
  const { data: gpa, loading, error, retry } = useApi(`/gpa/${studentId}`);
  const [openSem, setOpenSem] = useState(null);

  if (loading) return <Loading />;
  if (error || !gpa) return <ErrorState message={error} onRetry={retry} />;

  const chartData = gpa.semesters.map((sem) => ({
    semester: sem.label,
    學校制: Number(sem.gpa.toFixed(2)),
    "4.0 制": Number(sem.std_gpa.toFixed(2)),
  }));

  return (
    <div>
      <PageHeader title="GPA 分析" description="歷年 GPA 趨勢與各學期明細" />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="學校制 GPA" value={gpa.overall_gpa.toFixed(2)} tone="brand" />
        <StatCard label="4.0 制 GPA" value={gpa.overall_std_gpa.toFixed(2)} />
        <StatCard label="計入學分數" value={gpa.total_credits.toFixed(1)} />
      </div>

      {/* 趨勢圖 */}
      <Card className="mb-5 px-6 py-5">
        <p className="mb-4 text-sm font-semibold text-slate-800">歷年 GPA 趨勢</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 16, left: -16, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="semester"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 4.3]}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
              <ReferenceLine y={2.0} stroke="#fda4af" strokeDasharray="4 4" />
              <Line
                type="monotone"
                dataKey="學校制"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: "#6366f1", strokeWidth: 0 }}
                activeDot={{ r: 5.5 }}
              />
              <Line
                type="monotone"
                dataKey="4.0 制"
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: "#94a3b8", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 各學期明細 */}
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <p className="text-sm font-semibold text-slate-800">各學期明細</p>
        </div>
        {gpa.semesters.map((sem, i) => {
          const open = openSem === i;
          return (
            <div key={sem.label} className="border-b border-slate-50 last:border-0">
              <button
                onClick={() => setOpenSem(open ? null : i)}
                className={`flex w-full items-center gap-4 px-6 py-3.5 text-left transition-colors hover:bg-slate-50/70 ${
                  open ? "bg-slate-50/70" : ""
                }`}
              >
                <span className="flex-1 text-sm font-semibold text-slate-800">{sem.label}</span>
                <span className="tnum text-[13px] text-slate-400">
                  {sem.total_credits.toFixed(1)} 學分
                </span>
                <span className="tnum w-12 text-right text-sm font-bold text-indigo-600">
                  {sem.gpa.toFixed(2)}
                </span>
                <span className="tnum text-xs text-slate-400">4.0 制 {sem.std_gpa.toFixed(2)}</span>
                <ChevronDownIcon
                  className={`size-4 text-slate-300 transition-transform ${open ? "rotate-180" : ""}`}
                />
              </button>

              {open && (
                <table className="w-full bg-slate-50/50">
                  <thead>
                    <tr className="text-left text-xs font-medium text-slate-400">
                      <th className="px-6 py-2">課程名稱</th>
                      <th className="px-4 py-2 text-center">學分</th>
                      <th className="px-4 py-2 text-center">成績</th>
                      <th className="px-6 py-2 text-center">GPA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sem.courses.map((c, j) => (
                      <tr key={j} className="border-t border-slate-100 text-sm">
                        <td className="px-6 py-2.5 text-slate-600">{c.course_name}</td>
                        <td className="tnum px-4 py-2.5 text-center text-slate-500">{c.credit}</td>
                        <td className="px-4 py-2.5 text-center">
                          <ScoreText score={c.score} />
                        </td>
                        <td className="tnum px-6 py-2.5 text-center font-medium text-slate-600">
                          {c.school_gpa}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
