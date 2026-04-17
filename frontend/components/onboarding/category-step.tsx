"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { OnboardingData } from "@/app/page"
import { Building2, TrendingUp, Users, Globe, Trophy, Monitor } from "lucide-react"
import { ArrowLeft } from "lucide-react"

type CategoryStepProps = {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  onNext: () => void
  onPrev: () => void
}

const categories = [
  { id: "politics", label: "정치", icon: Building2 },
  { id: "economy", label: "경제", icon: TrendingUp },
  { id: "society", label: "사회", icon: Users },
  { id: "international", label: "국제", icon: Globe },
  { id: "sports", label: "스포츠", icon: Trophy },
  { id: "it-science", label: "IT/과학", icon: Monitor },
]

export function CategoryStep({ data, updateData, onNext, onPrev }: CategoryStepProps) {
  const toggleCategory = (categoryId: string) => {
    const current = data.categories
    const updated = current.includes(categoryId)
      ? current.filter((c) => c !== categoryId)
      : [...current, categoryId]
    updateData({ categories: updated })
  }

  const isValid = data.categories.length > 0

  return (
    <div>
      <button
        onClick={onPrev}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">이전</span>
      </button>

      <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
        관심 있는 분야를 선택하세요
      </h2>
      <p className="text-muted-foreground text-sm mb-6 text-center">
        최소 1개 이상 선택해주세요
      </p>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {categories.map((category) => {
          const isSelected = data.categories.includes(category.id)
          const Icon = category.icon
          return (
            <button
              key={category.id}
              onClick={() => toggleCategory(category.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 transition-all duration-200",
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card hover:border-muted-foreground text-foreground"
              )}
            >
              <Icon className="w-8 h-8" />
              <span className="font-medium">{category.label}</span>
            </button>
          )
        })}
      </div>

      <Button
        onClick={onNext}
        className="w-full"
        size="lg"
        disabled={!isValid}
      >
        다음
      </Button>
    </div>
  )
}
