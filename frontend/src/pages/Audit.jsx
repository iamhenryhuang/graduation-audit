import { useState } from "react";
import { useStudent } from "../context/student";
import { useApi } from "../hooks/useApi";
import {
  Card,
  ErrorState,
  Loading,
  PageHeader,
  PassBadge,
  ProgressBar,
  Tag,
} from "../components/ui";
import { BulbIcon, ChevronDownIcon } from "../components/Icons";

function SimulateToggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5 rounded-full bg-white py-1.5 pr-4 pl-1.5 shadow-sm ring-1 ring-slate-200 ring-inset transition hover:ring-slate-300"
    >
      <span
        className={`h-5.5 w-10 shrink-0 rounded-full p-0.5 transition-colors ${
          checked ? "bg-indigo-500" : "bg-slate-200"
        }`}
      >
        <span
          className={`block size-4.5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-[18px]" : ""
          }`}
        />
      </span>
      <span className={`text-[13px] font-medium ${checked ? "text-indigo-700" : "text-slate-600"}`}>
        假設本學期全數通過
      </span>
    </button>
  );
}

function SectionCard({ title, passed, summary, children }) {
  const [open, setOpen] = useState(true);
  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50/70"
      >
        <span className="flex-1 text-sm font-semibold text-slate-800">{title}</span>
        {summary && <span className="tnum text-xs text-slate-400">{summary}</span>}
        <PassBadge passed={passed} />
        <ChevronDownIcon
          className={`size-4 text-slate-300 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="border-t border-slate-100 px-5 py-4">{children}</div>}
    </Card>
  );
}

function Recommendations({ title = "建議補修", names }) {
  if (!names?.length) return null;
  return (
    <div className="mt-3 rounded-xl bg-sky-50/60 p-3 ring-1 ring-sky-100 ring-inset">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-sky-700">
        <BulbIcon className="size-4" />
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {names.map((name) => (
          <Tag key={name} tone="info">
            {name}
          </Tag>
        ))}
      </div>
    </div>
  );
}

function CreditRow({ label, earned, required, shortage }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-50 py-2.5 last:border-0">
      <div>
        <span className="text-sm text-slate-600">{label}</span>
        {shortage && <p className="mt-0.5 text-xs text-rose-500">{shortage}</p>}
      </div>
      <span className="tnum ml-4 text-sm whitespace-nowrap text-slate-500">
        <span className="font-semibold text-slate-800">{earned}</span> / {required} 學分
      </span>
    </div>
  );
}

function GroupBar({ label, credit, target }) {
  const ok = credit >= target;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[13px] font-medium text-slate-600">{label}</span>
        <span className={`tnum text-xs ${ok ? "font-semibold text-emerald-600" : "text-slate-400"}`}>
          {credit.toFixed(1)} / {target} 學分
        </span>
      </div>
      <ProgressBar value={credit} max={target} barClass={ok ? "bg-emerald-400" : "bg-blue-400"} />
    </div>
  );
}

export default function Audit() {
  const { studentId } = useStudent();
  const [simulate, setSimulate] = useState(false);
  const { data: audit, loading, error, retry } = useApi(
    `/audit/${studentId}${simulate ? "?assume_current_passed=true" : ""}`
  );

  if (error) return <ErrorState message={error} onRetry={retry} />;

  return (
    <div>
      <PageHeader title="畢業審核" description="各項畢業條件達標狀況與補修建議">
        <div className="flex flex-wrap items-center gap-3">
          <SimulateToggle checked={simulate} onChange={setSimulate} />
          {audit && (
            <PassBadge
              passed={audit.summary.is_graduated}
              passText={simulate ? "預計符合畢業資格" : "符合畢業資格"}
              failText={simulate ? "預計仍未符合資格" : "尚未符合畢業資格"}
            />
          )}
        </div>
      </PageHeader>

      {simulate && (
        <div className="mb-5 flex items-start gap-2.5 rounded-2xl bg-indigo-50 px-5 py-3.5 text-[13px] leading-relaxed text-indigo-900 ring-1 ring-indigo-100 ring-inset">
          <BulbIcon className="mt-0.5 size-4 shrink-0 text-indigo-500" />
          模擬模式：以下為「假設成績尚未公布的課程（本學期修課）全數通過」後的預估結果，僅供參考。
        </div>
      )}

      {loading || !audit ? <Loading /> : <AuditBody audit={audit} />}
    </div>
  );
}

function AuditBody({ audit }) {
  const { summary, required, group, general, physical, elective, recommendations } = audit;
  const remain = Math.max(summary.total_required - summary.total_earned, 0);
  const percent = Math.min((summary.total_earned / summary.total_required) * 100, 100);
  const generalShortages = Object.entries(general.display?.["缺額"] ?? {}).filter(([, v]) => v > 0);
  const core = general.display?.["核通"];

  return (
    <div>
      {/* 總進度 */}
      <Card className="mb-5 px-6 py-5">
        <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-slate-800">總學分進度</p>
          <p className="tnum text-sm text-slate-500">
            <span className="text-lg font-bold text-slate-900">{summary.total_earned.toFixed(1)}</span>
            <span className="mx-1 text-slate-300">/</span>
            {summary.total_required.toFixed(0)} 學分
            {remain > 0 && <span className="ml-2 text-xs text-rose-500">尚缺 {remain.toFixed(1)}</span>}
          </p>
        </div>
        <ProgressBar
          value={summary.total_earned}
          max={summary.total_required}
          barClass={summary.is_graduated ? "bg-emerald-500" : "bg-indigo-500"}
        />
        <p className="tnum mt-2 text-right text-xs text-slate-400">{percent.toFixed(1)}%</p>
      </Card>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        {/* 左欄 */}
        <div className="space-y-5">
          <SectionCard
            title="專業必修"
            passed={required.is_passed}
            summary={`${required.credits.toFixed(1)} / ${required.required_credits} 學分`}
          >
            <CreditRow
              label="必修學分"
              earned={required.credits.toFixed(1)}
              required={required.required_credits}
            />
            {required.missing.length > 0 && (
              <div className="mt-3">
                <p className="mb-2 text-xs font-medium text-slate-500">尚缺課程</p>
                <div className="flex flex-wrap gap-1.5">
                  {required.missing.map((name) => (
                    <Tag key={name}>{name}</Tag>
                  ))}
                </div>
              </div>
            )}
            <Recommendations names={recommendations?.required} />
          </SectionCard>

          <SectionCard
            title="專業群修"
            passed={group.is_passed}
            summary={`${group.used_credits.toFixed(1)} / ${group.required_credits} 學分`}
          >
            <div className="mb-4 flex flex-wrap gap-2.5">
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-[13px] ring-1 ring-slate-100 ring-inset">
                <span className="text-slate-500">總計入學分：</span>
                <strong className="tnum text-slate-800">
                  {group.used_credits.toFixed(1)} / {group.required_credits}
                </strong>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-[13px] ring-1 ring-slate-100 ring-inset">
                <span className="text-slate-500">B–E 達標群數：</span>
                <strong className={`tnum ${group.domain_ok ? "text-emerald-600" : "text-rose-600"}`}>
                  {group.domain_count} / 3
                </strong>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <GroupBar label="群A（資訊專題）" credit={group.group_credits["群A"] ?? 0} target={6} />
                <Recommendations title="群A 建議補修" names={recommendations?.group?.["群A"]} />
              </div>
              {Object.entries(group.group_credits)
                .filter(([name]) => name !== "群A")
                .map(([name, credit]) => (
                  <div key={name}>
                    <GroupBar label={name} credit={credit} target={3} />
                    <Recommendations title={`${name} 建議補修`} names={recommendations?.group?.[name]} />
                  </div>
                ))}
            </div>
          </SectionCard>
        </div>

        {/* 右欄 */}
        <div className="space-y-5">
          <SectionCard title="通識教育" passed={general.is_passed}>
            {Object.entries(general.display ?? {})
              .filter(([key]) => key !== "核通" && key !== "缺額")
              .map(([key, val]) => (
                <CreditRow
                  key={key}
                  label={key}
                  earned={typeof val === "number" ? val.toFixed(1) : String(val)}
                  required="—"
                />
              ))}

            {core && (
              <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100 ring-inset">
                <p className="text-[13px] font-medium text-slate-700">
                  核心通識：
                  <span className="tnum font-bold">
                    {core.completed_count} / {core.required_domains}
                  </span>{" "}
                  領域
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {core.completed_domains?.length
                    ? `已達標：${core.completed_domains.join("、")}`
                    : "尚無已達標領域"}
                </p>
              </div>
            )}

            {generalShortages.length > 0 && (
              <div className="mt-3">
                <p className="mb-2 text-xs font-medium text-slate-500">尚缺</p>
                <div className="flex flex-wrap gap-1.5">
                  {generalShortages.map(([label, val]) => (
                    <Tag key={label}>
                      {label}：{val.toFixed(1)} 學分
                    </Tag>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="體育"
            passed={physical.is_passed}
            summary={`${physical.used_credits.toFixed(1)} / ${physical.required_credits} 學分`}
          >
            <CreditRow
              label="體育學分"
              earned={physical.used_credits.toFixed(1)}
              required={physical.required_credits}
              shortage={physical.shortage > 0 ? `尚缺 ${physical.shortage.toFixed(1)} 學分` : undefined}
            />
          </SectionCard>

          <SectionCard
            title="自由選修"
            passed={elective.is_passed}
            summary={`${elective.total_credits.toFixed(1)} / ${elective.required_credits.toFixed(0)} 學分`}
          >
            <CreditRow
              label="選修學分"
              earned={elective.total_credits.toFixed(1)}
              required={elective.required_credits.toFixed(0)}
              shortage={
                !elective.is_passed
                  ? `尚缺 ${(elective.required_credits - elective.total_credits).toFixed(1)} 學分`
                  : undefined
              }
            />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
