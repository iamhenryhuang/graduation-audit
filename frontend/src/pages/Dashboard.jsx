import { Link } from "react-router-dom";
import { useStudent } from "../context/student";
import { useApi } from "../hooks/useApi";
import ProgressRing from "../components/ProgressRing";
import {
  Card,
  ErrorState,
  Loading,
  PassBadge,
  ProgressBar,
  ScoreText,
  StatCard,
} from "../components/ui";
import { AlertIcon, CheckCircleIcon } from "../components/Icons";

const CATEGORY_BARS = [
  { key: "必修", barClass: "bg-violet-500" },
  { key: "群修", barClass: "bg-blue-500" },
  { key: "通識", barClass: "bg-emerald-500" },
  { key: "體育", barClass: "bg-amber-500" },
  { key: "自由選修", barClass: "bg-pink-500" },
];

function categoryProgress(audit) {
  const gen = audit.general.summary;
  const generalEarned =
    (gen?.counted_total_credit ?? 0) + (gen?.english_credit ?? 0) + (gen?.chinese_credit ?? 0);

  return {
    必修: { earned: audit.required.credits, required: audit.required.required_credits },
    群修: { earned: audit.group.used_credits, required: audit.group.required_credits },
    通識: { earned: generalEarned, required: audit.general.required_credits },
    體育: { earned: audit.physical.used_credits, required: audit.physical.required_credits },
    自由選修: { earned: audit.elective.total_credits, required: audit.elective.required_credits },
  };
}

function buildAlerts(audit) {
  return [
    !audit.required.is_passed && `專業必修尚缺 ${audit.required.missing.length} 門課程`,
    !audit.group.is_passed && "專業群修尚未達標",
    !audit.general.is_passed && "通識學分尚未達標",
    !audit.physical.is_passed && `體育尚缺 ${audit.physical.shortage.toFixed(1)} 學分`,
    !audit.elective.is_passed &&
      `自由選修尚缺 ${(audit.elective.required_credits - audit.elective.total_credits).toFixed(1)} 學分`,
  ].filter(Boolean);
}

export default function Dashboard() {
  const { studentId } = useStudent();
  const { data, loading, error, retry } = useApi([
    `/student/${studentId}`,
    `/audit/${studentId}`,
    `/gpa/${studentId}`,
  ]);

  if (loading) return <Loading />;
  if (error || !data) return <ErrorState message={error} onRetry={retry} />;

  const [student, audit, gpa] = data;
  const earned = audit.summary.total_earned;
  const required = audit.summary.total_required;
  const remain = Math.max(required - earned, 0);
  const percent = required > 0 ? Math.min((earned / required) * 100, 100) : 0;
  const graduated = audit.summary.is_graduated;
  const alerts = buildAlerts(audit);
  const categories = categoryProgress(audit);
  const latestSemester = gpa.semesters[gpa.semesters.length - 1];
  const latestCourses = latestSemester?.courses?.slice(0, 6) ?? [];

  return (
    <div className="space-y-5">
      {/* 學生資訊 + 畢業狀態 */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {student.chinese_name}
            <span className="tnum ml-2.5 text-sm font-medium text-slate-400">
              {student.student_id}
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {student.department} · {student.enrollment_year} 年入學
          </p>
        </div>
        <PassBadge passed={graduated} passText="符合畢業資格" failText="尚未符合畢業資格" />
      </div>

      {/* 進度環 + 統計卡 */}
      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <Card className="flex flex-col items-center justify-center px-6 py-7">
          <ProgressRing
            percent={percent}
            className={graduated ? "text-emerald-500" : "text-indigo-500"}
          >
            <p className="tnum text-3xl font-black text-slate-900">{percent.toFixed(0)}%</p>
            <p className="mt-0.5 text-xs text-slate-400">畢業進度</p>
          </ProgressRing>
          <p className="tnum mt-4 text-sm text-slate-500">
            <span className="font-bold text-slate-800">{earned.toFixed(1)}</span>
            <span className="mx-1 text-slate-300">/</span>
            {required.toFixed(0)} 學分
          </p>
        </Card>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard label="已修學分" value={earned.toFixed(1)} tone="brand" />
            <StatCard
              label="剩餘學分"
              value={remain.toFixed(1)}
              tone={remain <= 0 ? "success" : "default"}
            />
            <StatCard label="學校 GPA" value={gpa.overall_gpa.toFixed(2)} />
            <StatCard label="4.0 GPA" value={gpa.overall_std_gpa.toFixed(2)} />
          </div>

          {/* 各類別進度 */}
          <Card className="flex-1 px-6 py-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">各類別學分進度</p>
              <Link to="/audit" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
                查看完整審核 →
              </Link>
            </div>
            <div className="space-y-3.5">
              {CATEGORY_BARS.map(({ key, barClass }) => {
                const { earned: e, required: r } = categories[key];
                const done = e >= r;
                return (
                  <div key={key}>
                    <div className="mb-1.5 flex items-baseline justify-between">
                      <span className="text-[13px] font-medium text-slate-600">{key}</span>
                      <span className={`tnum text-xs ${done ? "font-semibold text-emerald-600" : "text-slate-400"}`}>
                        {e.toFixed(1)} / {r.toFixed(0)}
                      </span>
                    </div>
                    <ProgressBar value={e} max={r} barClass={barClass} />
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* 最近修課 + 待補項目 */}
      <div className="grid items-start gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex items-baseline justify-between border-b border-slate-100 px-6 py-4">
            <p className="text-sm font-semibold text-slate-800">最近修課紀錄</p>
            <p className="text-xs text-slate-400">{latestSemester?.label}</p>
          </div>
          {latestCourses.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-400">尚無修課紀錄</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                  <th className="px-6 py-2.5">課程名稱</th>
                  <th className="px-4 py-2.5 text-center">學分</th>
                  <th className="px-6 py-2.5 text-center">成績</th>
                </tr>
              </thead>
              <tbody>
                {latestCourses.map((c, i) => (
                  <tr key={i} className="border-t border-slate-50 text-sm hover:bg-slate-50/60">
                    <td className="px-6 py-3 text-slate-700">{c.course_name}</td>
                    <td className="tnum px-4 py-3 text-center text-slate-500">{c.credit}</td>
                    <td className="px-6 py-3 text-center">
                      <ScoreText score={c.score} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card className="px-6 py-5">
          <p className="mb-4 text-sm font-semibold text-slate-800">待補項目</p>
          {alerts.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircleIcon className="size-4.5 shrink-0" />
              所有畢業條件均已達標
            </div>
          ) : (
            <ul className="space-y-2.5">
              {alerts.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 rounded-xl bg-amber-50/80 px-4 py-3 text-[13px] text-amber-900 ring-1 ring-amber-100 ring-inset"
                >
                  <AlertIcon className="mt-0.5 size-4 shrink-0 text-amber-500" />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
