"use client"

import { Loader2, Mail, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type QuickActionsProps = {
  categories: string[]
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  onGenerate: () => void
  generating: boolean
  onSend: () => void
  sending: boolean
  hasReports: boolean
}

export function QuickActions({
  categories,
  selectedCategory,
  setSelectedCategory,
  onGenerate,
  generating,
  onSend,
  sending,
  hasReports,
}: QuickActionsProps) {
  return (
    <div className="flex flex-col gap-4 mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="lg"
            onClick={onGenerate}
            disabled={generating}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 gap-2 shadow-lg shadow-primary/25"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                생성 중…
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                지금 리포트 받기
              </>
            )}
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={onSend}
            disabled={sending || !hasReports}
            className="gap-2"
            title={hasReports ? undefined : "리포트를 먼저 생성해야 발송할 수 있어요"}
          >
            {sending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                발송 중…
              </>
            ) : (
              <>
                <Mail className="w-5 h-5" />
                다시 발송
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all border",
              selectedCategory === category
                ? "bg-primary/15 text-primary border-primary/50"
                : "bg-transparent text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
            )}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  )
}
