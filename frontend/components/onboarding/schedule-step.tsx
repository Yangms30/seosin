"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { OnboardingData } from "@/app/page"
import { ArrowLeft, Clock } from "lucide-react"

type ScheduleStepProps = {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  onNext: () => void
  onPrev: () => void
}

const presetTimes = [
  { id: "morning", label: "매일 아침 8시", time: "08:00" },
  { id: "noon", label: "점심 12시", time: "12:00" },
  { id: "evening", label: "저녁 6시", time: "18:00" },
  { id: "custom", label: "직접 설정", time: "" },
]

export function ScheduleStep({ data, updateData, onNext, onPrev }: ScheduleStepProps) {
  const selectSchedule = (scheduleId: string, time: string) => {
    updateData({ schedule: scheduleId, customTime: time || data.customTime })
  }

  const isValid = data.schedule !== ""

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
        언제 브리핑을 받으시겠어요?
      </h2>
      <p className="text-muted-foreground text-sm mb-6 text-center">
        원하는 시간에 뉴스 브리핑을 받아보세요
      </p>

      <div className="space-y-3 mb-8">
        {presetTimes.map((preset) => {
          const isSelected = data.schedule === preset.id
          return (
            <button
              key={preset.id}
              onClick={() => selectSchedule(preset.id, preset.time)}
              className={cn(
                "flex items-center gap-3 w-full p-4 rounded-xl border-2 transition-all duration-200 text-left",
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-muted-foreground"
              )}
            >
              <Clock className={cn("w-5 h-5", isSelected ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("font-medium", isSelected ? "text-primary" : "text-foreground")}>
                {preset.label}
              </span>
            </button>
          )
        })}
      </div>

      {data.schedule === "custom" && (
        <div className="mb-8">
          <label className="block text-sm font-medium text-foreground mb-2">
            브리핑 시간 선택
          </label>
          <Input
            type="time"
            value={data.customTime}
            onChange={(e) => updateData({ customTime: e.target.value })}
            className="bg-card border-border"
          />
        </div>
      )}

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
