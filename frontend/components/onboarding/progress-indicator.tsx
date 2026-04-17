"use client"

import { cn } from "@/lib/utils"

type ProgressIndicatorProps = {
  currentStep: number
  totalSteps: number
}

export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            index + 1 === currentStep
              ? "w-8 bg-primary"
              : index + 1 < currentStep
              ? "w-2 bg-primary"
              : "w-2 bg-muted"
          )}
        />
      ))}
    </div>
  )
}
