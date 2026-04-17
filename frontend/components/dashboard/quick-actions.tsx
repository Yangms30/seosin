"use client"

import { Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type QuickActionsProps = {
  categories: string[]
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  dateFilters: string[]
  selectedDate: string
  setSelectedDate: (date: string) => void
  onGenerate: () => void
  generating: boolean
}

export function QuickActions({
  categories,
  selectedCategory,
  setSelectedCategory,
  dateFilters,
  selectedDate,
  setSelectedDate,
  onGenerate,
  generating,
}: QuickActionsProps) {
  return (
    <div className="flex flex-col gap-4 mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
              지금 브리핑 받기
            </>
          )}
        </Button>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
          {dateFilters.map((date) => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                selectedDate === date
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {date}
            </button>
          ))}
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
                ? "bg-primary/20 text-primary border-primary/50"
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
