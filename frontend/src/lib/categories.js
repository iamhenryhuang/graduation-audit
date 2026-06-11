/** 課程類別樣式（必修／群修／通識／國防／選修） */
export const CATEGORY_STYLES = {
  必修: { cls: "bg-violet-50 text-violet-700 ring-violet-200", short: "必" },
  群修: { cls: "bg-blue-50 text-blue-700 ring-blue-200", short: "群" },
  通識: { cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", short: "通" },
  國防: { cls: "bg-slate-100 text-slate-600 ring-slate-200", short: "防" },
  選修: { cls: "bg-amber-50 text-amber-700 ring-amber-200", short: "選" },
};

export const CATEGORIES = Object.keys(CATEGORY_STYLES);
