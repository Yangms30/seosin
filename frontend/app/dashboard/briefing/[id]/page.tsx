"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { BriefingHeader } from "@/components/briefing/briefing-header"
import { SummarySection } from "@/components/briefing/summary-section"
import { RadioScriptSection } from "@/components/briefing/radio-script-section"
import { AnalysisSection } from "@/components/briefing/analysis-section"
import { SourceArticlesSection } from "@/components/briefing/source-articles-section"
import { RelatedBriefings } from "@/components/briefing/related-briefings"
import { api, BriefBotApiError } from "@/lib/api"
import { getUserId } from "@/lib/storage"
import type { Briefing, SourceArticle } from "@/lib/types"
import { importanceScaled } from "@/lib/briefing-display"

const CATEGORY_SOLID: Record<string, string> = {
  정치: "bg-red-500",
  경제: "bg-emerald-500",
  사회: "bg-amber-500",
  국제: "bg-blue-500",
  스포츠: "bg-orange-500",
  "IT/과학": "bg-violet-500",
}

const SENTIMENT_KO: Record<string, "긍정" | "부정" | "중립"> = {
  positive: "긍정",
  negative: "부정",
  neutral: "중립",
}

function splitSummary(summary: string): string[] {
  if (!summary) return []
  const parts = summary
    .split(/\n+/)
    .map((s) => s.replace(/^\s*[\d]+[.)\]]\s*/, "").trim())
    .filter((s) => s.length > 0)
  if (parts.length >= 2) return parts
  return summary
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function formatCreatedAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function mapSources(articles: SourceArticle[] | null | undefined) {
  if (!articles) return []
  return articles.map((a) => ({
    name: a.source ?? "출처 미상",
    title: a.title,
    url: a.url,
    publishedAt: "",
    icon: "📰",
  }))
}

export default function BriefingDetailPage() {
  const params = useParams<{ id: string }>()
  const briefingId = Number(params?.id)
  const [briefing, setBriefing] = useState<Briefing | null>(null)
  const [related, setRelated] = useState<Briefing[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedLink, setCopiedLink] = useState(false)

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }, [])

  useEffect(() => {
    if (!Number.isFinite(briefingId) || briefingId <= 0) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const b = await api.briefings.get(briefingId)
        if (cancelled) return
        setBriefing(b)
        const userId = getUserId()
        if (userId !== null) {
          try {
            const list = await api.briefings.list(userId, {
              category: b.category,
              limit: 5,
            })
            if (!cancelled) setRelated(list.filter((x) => x.id !== b.id).slice(0, 3))
          } catch {
            // related is best-effort
          }
        }
      } catch (err) {
        const detail = err instanceof BriefBotApiError ? err.detail : (err as Error).message
        toast.error(`브리핑 로딩 실패: ${detail}`)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [briefingId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1628] to-[#030712]">
        <div className="mx-auto max-w-4xl px-4 py-8 text-center text-muted-foreground">
          브리핑을 불러오는 중입니다…
        </div>
      </div>
    )
  }

  if (!briefing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1628] to-[#030712]">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span>대시보드로 돌아가기</span>
          </Link>
          <div className="mt-8 text-center text-muted-foreground">브리핑을 찾을 수 없습니다.</div>
        </div>
      </div>
    )
  }

  const analysis = briefing.raw_analysis ?? {}
  const entities = Array.isArray(analysis.key_entities) ? analysis.key_entities : []
  const sentiment = SENTIMENT_KO[analysis.sentiment ?? "neutral"] ?? "중립"
  const coreFact = typeof analysis.core_fact === "string" ? analysis.core_fact : briefing.title
  const summaryLines = splitSummary(briefing.summary)
  const importance = importanceScaled(briefing.importance_score)
  const headerData = {
    category: briefing.category,
    categoryColor: CATEGORY_SOLID[briefing.category] ?? "bg-slate-500",
    title: briefing.title,
    createdAt: formatCreatedAt(briefing.created_at),
    importanceScore: importance,
    aiModel: "Gemini Flash",
  }
  const relatedView = related.map((r) => ({
    id: String(r.id),
    category: r.category,
    categoryColor: CATEGORY_SOLID[r.category] ?? "bg-slate-500",
    title: r.title,
    summary: r.summary,
    createdAt: formatCreatedAt(r.created_at),
  }))

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] to-[#030712]">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>대시보드로 돌아가기</span>
          </Link>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground">대시보드</Link>
            <span>/</span>
            <span>{briefing.category}</span>
            <span>/</span>
            <span className="text-foreground truncate max-w-xs">{briefing.title}</span>
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[1fr,280px]">
          <div className="space-y-8">
            <BriefingHeader data={headerData} onCopyLink={handleCopyLink} copiedLink={copiedLink} />
            <SummarySection summary={summaryLines} />
            {briefing.radio_script ? (
              <RadioScriptSection script={briefing.radio_script} />
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-sm text-muted-foreground">
                라디오 스크립트가 아직 생성되지 않았습니다.
              </div>
            )}
            <AnalysisSection entities={entities} sentiment={sentiment} coreFact={coreFact} />
            <SourceArticlesSection sources={mapSources(briefing.source_articles)} />
          </div>

          <div className="lg:sticky lg:top-8 lg:self-start">
            {relatedView.length > 0 ? (
              <RelatedBriefings briefings={relatedView} />
            ) : (
              <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                아직 같은 카테고리의 다른 브리핑이 없어요.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
