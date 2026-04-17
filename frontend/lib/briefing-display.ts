import type { Briefing, SourceArticle } from "./types"

const CATEGORY_BADGE: Record<string, string> = {
  정치: "bg-red-500/20 text-red-400 border-red-500/30",
  경제: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  사회: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  국제: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  스포츠: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "IT/과학": "bg-violet-500/20 text-violet-400 border-violet-500/30",
}

const DEFAULT_BADGE = "bg-slate-500/20 text-slate-400 border-slate-500/30"

export function categoryBadgeClass(category: string): string {
  return CATEGORY_BADGE[category] ?? DEFAULT_BADGE
}

export function formatRelativeTime(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return "방금 전"
  if (diffMin < 60) return `${diffMin}분 전`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}시간 전`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}일 전`
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })
}

export function sourcesLabel(articles: SourceArticle[] | null | undefined): string {
  if (!articles || articles.length === 0) return "출처 없음"
  const names = articles.map((a) => a.source).filter((s): s is string => !!s)
  const unique = Array.from(new Set(names))
  if (unique.length === 0) return `${articles.length}건`
  if (unique.length <= 2) return `${unique.join(", ")} 외 ${articles.length}건`
  return `${unique.slice(0, 2).join(", ")} 외 ${articles.length}건`
}

export function importanceScaled(score: number | null | undefined): number {
  if (score === null || score === undefined) return 0
  if (score <= 1) return Math.round(score * 100) / 10
  if (score <= 10) return Math.round(score * 10) / 10
  return Math.min(10, Math.round(score) / 10)
}

export function briefingDetailHref(b: Pick<Briefing, "id">): string {
  return `/dashboard/briefing/${b.id}`
}
