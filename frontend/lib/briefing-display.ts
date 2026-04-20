const CATEGORY_BADGE: Record<string, string> = {
  정치: "bg-rose-500/10 text-rose-600 border-rose-500/30",
  경제: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  사회: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  국제: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  스포츠: "bg-[#f26930]/10 text-[#f26930] border-[#f26930]/30",
  "IT/과학": "bg-violet-500/10 text-violet-600 border-violet-500/30",
}

const DEFAULT_BADGE = "bg-slate-500/10 text-slate-600 border-slate-500/30"

export function categoryBadgeClass(category: string): string {
  return CATEGORY_BADGE[category] ?? DEFAULT_BADGE
}

/**
 * Backend stores timestamps as naive UTC (datetime.utcnow()). Pydantic
 * serializes them without a tz suffix, so `new Date(iso)` in the browser
 * silently treats the string as *local* time — which is wrong. For KST
 * (UTC+9) this makes everything look ~9 hours old. Force UTC interpretation
 * by appending "Z" when no timezone indicator is present.
 */
export function parseUtcIso(iso: string | null | undefined): Date {
  if (!iso) return new Date(NaN)
  const hasTz = iso.endsWith("Z") || /[+-]\d{2}:?\d{2}$/.test(iso)
  return new Date(hasTz ? iso : `${iso}Z`)
}

/**
 * Formats a timestamp as absolute local time, e.g. "4/20 00:41".
 * (Previously showed relative "N시간 전" style — changed per user preference
 * to make the exact generation moment immediately visible on every card.)
 */
export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = parseUtcIso(iso)
  if (Number.isNaN(d.getTime())) return ""
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hh = String(d.getHours()).padStart(2, "0")
  const mm = String(d.getMinutes()).padStart(2, "0")
  return `${month}/${day} ${hh}:${mm}`
}
