import { NavLink } from "react-router-dom";
import { useStudent } from "../context/student";
import {
  ArrowPathIcon,
  BookIcon,
  CapIcon,
  ClipboardCheckIcon,
  HomeIcon,
  TrendIcon,
} from "../components/Icons";

const NAV_ITEMS = [
  { to: "/", label: "總覽", icon: HomeIcon, end: true },
  { to: "/courses", label: "修課紀錄", icon: BookIcon },
  { to: "/audit", label: "畢業審核", icon: ClipboardCheckIcon },
  { to: "/gpa", label: "GPA 分析", icon: TrendIcon },
];

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-950/40">
        <CapIcon className="size-5" strokeWidth={1.9} />
      </div>
      <div className="leading-tight">
        <p className="text-[15px] font-bold text-white">畢業學分審核</p>
        <p className="text-[11px] text-slate-400">NCCU CS · 112 學年度</p>
      </div>
    </div>
  );
}

function navLinkClass({ isActive }) {
  return [
    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
    isActive
      ? "bg-white/10 text-white shadow-inner"
      : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
  ].join(" ");
}

function mobileNavLinkClass({ isActive }) {
  return [
    "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
    isActive ? "bg-white text-slate-900" : "text-slate-300 hover:bg-white/10",
  ].join(" ");
}

export default function AppLayout({ children }) {
  const { setStudentId } = useStudent();

  return (
    <div className="flex min-h-dvh">
      {/* 桌面側邊欄 */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 md:flex">
        <div className="border-b border-white/5 px-5 pt-7 pb-6">
          <Brand />
        </div>

        <nav className="flex-1 space-y-1 px-3 pt-5">
          <p className="px-3.5 pb-2 text-[11px] font-semibold tracking-widest text-slate-500 uppercase">
            選單
          </p>
          {NAV_ITEMS.map(({ to, label, icon: ItemIcon, end }) => (
            <NavLink key={to} to={to} end={end} className={navLinkClass}>
              <ItemIcon className="size-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/5 p-4">
          <button
            onClick={() => setStudentId(null)}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-rose-300"
          >
            <ArrowPathIcon className="size-[18px]" />
            重新上傳 JSON
          </button>
        </div>
      </aside>

      {/* 行動版頂欄 */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex flex-col gap-3 bg-slate-900 px-4 pt-4 pb-3 md:hidden">
          <div className="flex items-center justify-between">
            <Brand />
            <button
              onClick={() => setStudentId(null)}
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200"
            >
              <ArrowPathIcon className="size-3.5" />
              重新上傳
            </button>
          </div>
          <nav className="flex gap-1 overflow-x-auto">
            {NAV_ITEMS.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} className={mobileNavLinkClass}>
                {label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-6xl animate-fade-up">{children}</div>
        </main>
      </div>
    </div>
  );
}
