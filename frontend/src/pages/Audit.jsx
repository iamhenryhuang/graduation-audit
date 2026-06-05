import { useEffect, useState } from "react";

const API = "http://localhost:8000";

function RequirementRow({ label, earned, required, detail }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "11px 0",
      borderBottom: "1px solid #f5f5f4",
    }}>
      <div>
        <span style={{ fontSize: "14px", color: "#44403c" }}>{label}</span>
        {detail && <p style={{ fontSize: "12px", color: "#dc2626", marginTop: "2px" }}>{detail}</p>}
      </div>
      <span style={{ fontSize: "13px", color: "#78716c", whiteSpace: "nowrap", marginLeft: "16px" }}>
        {earned} / {required} 學分
      </span>
    </div>
  );
}

function SectionCard({ title, passed, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="card" style={{ overflow: "hidden", marginBottom: "12px" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", padding: "14px 18px",
          display: "flex", alignItems: "center", gap: "10px",
          background: "none", border: "none", cursor: "pointer",
          borderBottom: open ? "1px solid #f5f5f4" : "none",
        }}
      >
        <span style={{ flex: 1, fontWeight: "500", fontSize: "14px", color: "#1c1917", textAlign: "left" }}>
          {title}
        </span>
        <span className={passed ? "badge-pass" : "badge-fail"}>
          {passed ? "達標" : "未達標"}
        </span>
        <span style={{ color: "#a8a29e", fontSize: "12px", marginLeft: "4px" }}>
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && <div style={{ padding: "4px 18px 14px" }}>{children}</div>}
    </div>
  );
}

function MissingTag({ name }) {
  return (
    <span style={{
      display: "inline-block", padding: "3px 8px", borderRadius: "4px",
      background: "#fef2f2", color: "#dc2626",
      fontSize: "12px", margin: "2px 3px",
      border: "1px solid #fecaca",
    }}>{name}</span>
  );
}

function GroupBar({ label, credit, target }) {
  const pct = Math.min((credit / target) * 100, 100);
  const ok = credit >= target;
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "13px", color: "#57534e" }}>{label}</span>
        <span style={{ fontSize: "12px", color: ok ? "#16a34a" : "#78716c" }}>
          {credit.toFixed(1)} / {target} 學分
        </span>
      </div>
      <div className="progress-bar">
        <div style={{
          height: "100%", width: `${pct}%`, borderRadius: "9999px",
          background: ok ? "#86efac" : "#d6d3d1",
          transition: "width 0.4s ease",
        }} />
      </div>
    </div>
  );
}

export default function Audit({ studentId }) {
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/audit/${studentId}`)
      .then((r) => r.json())
      .then(setAudit)
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <div className="loading-screen"><div className="spinner" />載入中...</div>;
  if (!audit) return <div className="loading-screen">載入失敗</div>;

  const { summary, required, group, general, physical, elective } = audit;
  const remain = summary.total_required - summary.total_earned;

  return (
    <div style={{ maxWidth: "1200px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "20px", marginBottom: "4px" }}>畢業審核</h1>
        <p style={{ color: "#78716c", fontSize: "13px" }}>各項畢業條件達標狀況</p>
      </div>

      {/* Summary */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        {[
          { label: "已修總學分", value: `${summary.total_earned.toFixed(1)} / ${summary.total_required}` },
          { label: "剩餘學分", value: remain <= 0 ? "0.0" : remain.toFixed(1) },
          { label: "畢業資格", value: summary.is_graduated ? "符合資格" : "尚未符合",
            color: summary.is_graduated ? "#15803d" : "#dc2626" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ flex: 1, minWidth: "160px", padding: "16px 20px" }}>
            <p style={{ color: "#78716c", fontSize: "12px", marginBottom: "6px" }}>{label}</p>
            <p style={{ fontSize: "22px", fontWeight: "600", color: color || "#1c1917" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* 兩欄 grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px", alignItems: "start" }}>
        {/* 左欄 */}
        <div>
          <SectionCard title="專業必修" passed={required.is_passed}>
            <RequirementRow
              label="專業必修學分"
              earned={required.credits.toFixed(1)}
              required={required.required_credits}
              detail={required.missing.length > 0 ? undefined : undefined}
            />
            {required.missing.length > 0 && (
              <div style={{ marginTop: "8px" }}>
                <p style={{ fontSize: "12px", color: "#78716c", marginBottom: "5px" }}>尚缺課程</p>
                <div>{required.missing.map((name, i) => <MissingTag key={i} name={name} />)}</div>
              </div>
            )}
          </SectionCard>

          <SectionCard title="專業群修" passed={group.is_passed}>
            <div style={{ paddingTop: "8px" }}>
              <div style={{ display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
                <div style={{ padding: "8px 12px", borderRadius: "6px", background: "#fafaf9", border: "1px solid #e7e5e4", fontSize: "13px" }}>
                  <span style={{ color: "#78716c" }}>總計入學分：</span>
                  <strong style={{ color: "#1c1917" }}>{group.used_credits.toFixed(1)} / {group.required_credits}</strong>
                </div>
                <div style={{ padding: "8px 12px", borderRadius: "6px", background: "#fafaf9", border: "1px solid #e7e5e4", fontSize: "13px" }}>
                  <span style={{ color: "#78716c" }}>BCDE 達標群數：</span>
                  <strong style={{ color: group.domain_ok ? "#16a34a" : "#dc2626" }}>
                    {group.domain_count} / 3
                  </strong>
                </div>
              </div>
              <GroupBar label="群A（需 6 學分）" credit={group.group_credits["群A"] || 0} target={6} />
              {Object.entries(group.group_credits)
                .filter(([name]) => name !== "群A")
                .map(([name, credit]) => (
                  <GroupBar key={name} label={name} credit={credit} target={3} />
                ))}
            </div>
          </SectionCard>
        </div>

        {/* 右欄 */}
        <div>
          <SectionCard title="通識教育" passed={general.is_passed}>
            <div style={{ paddingTop: "4px" }}>
              {Object.entries(general.display)
                .filter(([key]) => key !== "核通" && key !== "缺額")
                .map(([key, val]) => (
                  <RequirementRow
                    key={key}
                    label={key}
                    earned={typeof val === "number" ? val.toFixed(1) : val}
                    required="—"
                  />
                ))}
              <div style={{
                padding: "10px 12px", borderRadius: "6px",
                background: "#fafaf9", border: "1px solid #e7e5e4", marginTop: "8px",
              }}>
                <p style={{ fontSize: "13px", color: "#44403c", marginBottom: "3px" }}>
                  核心通識：{general.display["核通"]?.completed_count} / {general.display["核通"]?.required_domains} 領域
                </p>
                <p style={{ fontSize: "12px", color: "#78716c" }}>
                  {general.display["核通"]?.completed_domains?.join("、") || "尚無已達標領域"}
                </p>
              </div>
              {Object.entries(general.display["缺額"] || {}).some(([, v]) => v > 0) && (
                <div style={{ marginTop: "10px" }}>
                  <p style={{ fontSize: "12px", color: "#78716c", marginBottom: "5px" }}>尚缺</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                    {Object.entries(general.display["缺額"])
                      .filter(([, v]) => v > 0)
                      .map(([label, val]) => (
                        <span key={label} style={{
                          padding: "3px 8px", borderRadius: "4px",
                          background: "#fef2f2", color: "#dc2626",
                          fontSize: "12px", border: "1px solid #fecaca",
                        }}>
                          {label}：{val.toFixed(1)} 學分
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* 下方並排 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <SectionCard title="體育" passed={physical.is_passed}>
          <RequirementRow
            label="體育學分"
            earned={physical.used_credits.toFixed(1)}
            required={physical.required_credits}
            detail={physical.shortage > 0 ? `尚缺 ${physical.shortage.toFixed(1)} 學分` : undefined}
          />
        </SectionCard>

        <SectionCard title="自由選修" passed={elective.is_passed}>
          <RequirementRow
            label="選修學分"
            earned={elective.total_credits.toFixed(1)}
            required={elective.required_credits.toFixed(1)}
            detail={!elective.is_passed
              ? `尚缺 ${(elective.required_credits - elective.total_credits).toFixed(1)} 學分`
              : undefined}
          />
        </SectionCard>
      </div>
    </div>
  );
}
