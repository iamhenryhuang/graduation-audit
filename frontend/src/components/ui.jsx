import { AlertIcon, CheckCircleIcon, XCircleIcon } from "./Icons";
import { CATEGORY_STYLES } from "../lib/categories";

export function Card({ className = "", children }) {
  return (
    <div className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({ title, description, children }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function StatCard({ label, value, sub, tone = "default" }) {
  const valueColor = {
    default: "text-slate-900",
    success: "text-emerald-600",
    danger: "text-rose-600",
    brand: "text-indigo-600",
  }[tone];

  return (
    <Card className="flex-1 px-5 py-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`tnum mt-1.5 text-2xl font-bold ${valueColor}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </Card>
  );
}

export function PassBadge({ passed, passText = "達標", failText = "未達標" }) {
  return passed ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 ring-inset">
      <CheckCircleIcon className="size-3.5" />
      {passText}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 ring-inset">
      <XCircleIcon className="size-3.5" />
      {failText}
    </span>
  );
}

export function Tag({ tone = "danger", children }) {
  const styles = {
    danger: "bg-rose-50 text-rose-700 ring-rose-200",
    info: "bg-sky-50 text-sky-700 ring-sky-200",
    brand: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  }[tone];
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${styles}`}>
      {children}
    </span>
  );
}

export function ProgressBar({ value, max, barClass = "bg-indigo-500", trackClass = "bg-slate-100" }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full ${trackClass}`}>
      <div
        className={`h-full rounded-full transition-[width] duration-700 ease-out ${barClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Spinner({ className = "size-4" }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-slate-200 border-t-slate-500 ${className}`}
    />
  );
}

export function Loading({ text = "載入中..." }) {
  return (
    <div className="flex min-h-[320px] items-center justify-center gap-2.5 text-sm text-slate-400">
      <Spinner />
      {text}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-3">
      <AlertIcon className="size-8 text-rose-400" />
      <p className="text-sm text-slate-600">{message || "載入失敗"}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          重試
        </button>
      )}
    </div>
  );
}

export function ScoreText({ score }) {
  if (score === null || score === undefined) return <span className="text-slate-300">—</span>;
  return (
    <span className={`tnum font-semibold ${score >= 60 ? "text-emerald-600" : "text-rose-600"}`}>
      {score}
    </span>
  );
}

export function CategoryBadge({ category, full = false }) {
  const style = CATEGORY_STYLES[category];
  if (!style) return null;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-md text-[11px] font-bold ring-1 ring-inset ${style.cls} ${
        full ? "px-2 py-0.5" : "size-[22px]"
      }`}
    >
      {full ? category : style.short}
    </span>
  );
}
