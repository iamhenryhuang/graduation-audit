import { useMemo, useState } from "react";
import { useStudent } from "../context/student";
import { useApi } from "../hooks/useApi";
import {
  Card,
  CategoryBadge,
  ErrorState,
  Loading,
  PageHeader,
  ScoreText,
} from "../components/ui";
import { CATEGORIES } from "../lib/categories";
import { ChevronDownIcon, SearchIcon } from "../components/Icons";

function groupBySemester(courses) {
  const map = new Map();
  for (const c of courses) {
    const key = `${c.academic_year}-${c.academic_semester}`;
    if (!map.has(key)) {
      map.set(key, { key, year: c.academic_year, semester: c.academic_semester, courses: [] });
    }
    map.get(key).courses.push(c);
  }
  return [...map.values()].sort(
    (a, b) => a.year - b.year || a.semester - b.semester
  );
}

const chipClass = (active) =>
  `shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
    active
      ? "bg-slate-900 text-white"
      : "bg-white text-slate-500 ring-1 ring-slate-200 ring-inset hover:bg-slate-50"
  }`;

export default function Courses() {
  const { studentId } = useStudent();
  const { data: courses, loading, error, retry } = useApi(`/courses/${studentId}`);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState(null);
  const [openSems, setOpenSems] = useState({});

  const semesters = useMemo(() => {
    if (!courses) return [];
    const filtered = courses.filter(
      (c) =>
        (!keyword || c.course_name.includes(keyword.trim())) &&
        (!category || c.category === category)
    );
    return groupBySemester(filtered);
  }, [courses, keyword, category]);

  if (loading) return <Loading />;
  if (error || !courses) return <ErrorState message={error} onRetry={retry} />;

  const filtering = Boolean(keyword || category);
  const shownCount = semesters.reduce((sum, s) => sum + s.courses.length, 0);
  // 篩選時自動展開所有學期，方便瀏覽結果
  const isOpen = (key) => filtering || Boolean(openSems[key]);
  const toggleSem = (key) => setOpenSems((prev) => ({ ...prev, [key]: !prev[key] }));
  const setAll = (open) =>
    setOpenSems(open ? Object.fromEntries(semesters.map((s) => [s.key, true])) : {});

  return (
    <div>
      <PageHeader
        title="修課紀錄"
        description={`共 ${courses.length} 門課程${filtering ? `，符合條件 ${shownCount} 筆` : ""}`}
      >
        {!filtering && (
          <div className="flex gap-2">
            <button onClick={() => setAll(true)} className={chipClass(false)}>
              展開全部
            </button>
            <button onClick={() => setAll(false)} className={chipClass(false)}>
              收合全部
            </button>
          </div>
        )}
      </PageHeader>

      {/* 搜尋 + 類別篩選 */}
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜尋課程名稱..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-64 rounded-full border border-slate-200 bg-white py-2 pr-4 pl-10 text-sm text-slate-800 shadow-sm transition outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          <button onClick={() => setCategory(null)} className={chipClass(!category)}>
            全部
          </button>
          {CATEGORIES.map((name) => (
            <button
              key={name}
              onClick={() => setCategory(category === name ? null : name)}
              className={chipClass(category === name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* 學期手風琴 */}
      {semesters.length === 0 ? (
        <Card className="px-6 py-14 text-center text-sm text-slate-400">找不到相符的課程</Card>
      ) : (
        <div className="space-y-4">
          {semesters.map((sem) => {
            const open = isOpen(sem.key);
            const credits = sem.courses.reduce((sum, c) => sum + (c.credit || 0), 0);
            return (
              <Card key={sem.key} className="overflow-hidden">
                <button
                  onClick={() => toggleSem(sem.key)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50/70"
                >
                  <span className="flex-1 text-sm font-bold text-slate-800">
                    {sem.year} 學年 第 {sem.semester} 學期
                  </span>
                  <span className="tnum rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600">
                    {sem.courses.length} 門
                  </span>
                  <span className="tnum rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                    {credits.toFixed(1)} 學分
                  </span>
                  <ChevronDownIcon
                    className={`size-4 text-slate-300 transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </button>

                {open && (
                  <table className="w-full border-t border-slate-100">
                    <thead>
                      <tr className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                        <th className="px-5 py-2.5">課程名稱</th>
                        <th className="px-4 py-2.5 text-center">學分</th>
                        <th className="px-4 py-2.5 text-center">成績</th>
                        <th className="px-5 py-2.5 text-center">狀態</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sem.courses.map((c, i) => (
                        <tr key={i} className="border-t border-slate-50 text-sm hover:bg-slate-50/60">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5 font-medium text-slate-700">
                              <CategoryBadge category={c.category} />
                              {c.course_name}
                            </div>
                          </td>
                          <td className="tnum px-4 py-3 text-center text-slate-500">{c.credit}</td>
                          <td className="px-4 py-3 text-center">
                            <ScoreText score={c.score} />
                          </td>
                          <td className="px-5 py-3 text-center">
                            {c.course_status && c.course_status !== "有成績" ? (
                              <span className="inline-block rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-600">
                                {c.course_status}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-300">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
