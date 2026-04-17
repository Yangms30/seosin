"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { RadioPlayerBar } from "@/components/dashboard/radio-player-bar"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { BriefingGrid } from "@/components/dashboard/briefing-grid"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { api, BriefBotApiError } from "@/lib/api"
import { getUserId } from "@/lib/storage"
import type { Briefing } from "@/lib/types"

const categories = ["전체", "정치", "경제", "사회", "국제", "스포츠", "IT/과학"]
const dateFilters = ["오늘", "어제", "이번주"]

function withinDateFilter(createdAt: string, filter: string, now: Date = new Date()): boolean {
  const t = new Date(createdAt).getTime()
  if (Number.isNaN(t)) return true
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const oneDay = 24 * 60 * 60 * 1000
  if (filter === "오늘") return t >= startOfToday
  if (filter === "어제") return t >= startOfToday - oneDay && t < startOfToday
  if (filter === "이번주") return t >= startOfToday - 6 * oneDay
  return true
}

export default function DashboardPage() {
  const router = useRouter()
  const [userId, setUid] = useState<number | null>(null)
  const [briefings, setBriefings] = useState<Briefing[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("전체")
  const [selectedDate, setSelectedDate] = useState("오늘")
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(75)
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    const id = getUserId()
    if (!id) {
      router.replace("/")
      return
    }
    setUid(id)
  }, [router])

  const fetchList = useCallback(
    async (id: number) => {
      try {
        const list = await api.briefings.list(id)
        setBriefings(list)
      } catch (err) {
        const detail = err instanceof BriefBotApiError ? err.detail : (err as Error).message
        toast.error(`브리핑 목록 로딩 실패: ${detail}`)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    if (userId === null) return
    setLoading(true)
    void fetchList(userId)
  }, [userId, fetchList])

  const handleGenerate = async () => {
    if (userId === null || generating) return
    setGenerating(true)
    try {
      await toast.promise(api.briefings.generate(userId), {
        loading: "브리핑 생성 중입니다. 최대 1분 정도 걸려요…",
        success: (res) => `${res.generated}건의 브리핑이 생성됐습니다.`,
        error: (err) =>
          err instanceof BriefBotApiError
            ? `생성 실패: ${err.detail}`
            : `생성 실패: ${(err as Error).message}`,
      }).unwrap()
      await fetchList(userId)
    } catch {
      // toast already reported
    } finally {
      setGenerating(false)
    }
  }

  const filtered = briefings
    .filter((b) => selectedCategory === "전체" || b.category === selectedCategory)
    .filter((b) => withinDateFilter(b.created_at, selectedDate))

  return (
    <div className="min-h-screen">
      <DashboardHeader />

      <RadioPlayerBar
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        currentTime={currentTime}
        setCurrentTime={setCurrentTime}
        totalTime={495}
        volume={volume}
        setVolume={setVolume}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <QuickActions
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          dateFilters={dateFilters}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          onGenerate={handleGenerate}
          generating={generating}
        />

        {loading ? (
          <div className="py-20 text-center text-muted-foreground">
            브리핑을 불러오는 중입니다…
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onGenerate={handleGenerate} generating={generating} hasAny={briefings.length > 0} />
        ) : (
          <BriefingGrid briefings={filtered} />
        )}
      </main>
    </div>
  )
}

function EmptyState({
  onGenerate,
  generating,
  hasAny,
}: {
  onGenerate: () => void
  generating: boolean
  hasAny: boolean
}) {
  return (
    <div className="py-20 text-center space-y-4">
      <p className="text-muted-foreground">
        {hasAny
          ? "선택한 필터 조건에 해당하는 브리핑이 없습니다."
          : "아직 브리핑이 없어요. 첫 브리핑을 생성해 보세요."}
      </p>
      {!hasAny && (
        <Button onClick={onGenerate} disabled={generating} size="lg" className="gap-2">
          <Sparkles className="w-5 h-5" />
          지금 브리핑 받기
        </Button>
      )}
    </div>
  )
}
