"use client"

import Link from "next/link"
import { Play, MessageSquare, Mail, Link2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Briefing } from "@/lib/types"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  briefingDetailHref,
  categoryBadgeClass,
  formatRelativeTime,
  importanceScaled,
  sourcesLabel,
} from "@/lib/briefing-display"

type BriefingGridProps = {
  briefings: Briefing[]
}

export function BriefingGrid({ briefings }: BriefingGridProps) {
  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {briefings.map((briefing) => (
          <BriefingCardComponent key={briefing.id} briefing={briefing} />
        ))}
      </div>
    </TooltipProvider>
  )
}

function BriefingCardComponent({ briefing }: { briefing: Briefing }) {
  const importance = importanceScaled(briefing.importance_score)
  const timestamp = formatRelativeTime(briefing.created_at)
  const badge = categoryBadgeClass(briefing.category)
  const sources = sourcesLabel(briefing.source_articles)

  return (
    <article className="group relative rounded-2xl border border-border/50 bg-card/50 p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5">
      <Link
        href={briefingDetailHref(briefing)}
        className="absolute inset-0 rounded-2xl"
        aria-label={`${briefing.title} 상세 보기`}
      />

      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-primary-foreground z-10"
        onClick={(e) => e.preventDefault()}
      >
        <Play className="w-4 h-4 ml-0.5" />
      </Button>

      <div className="flex items-start gap-3 mb-3">
        <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", badge)}>
          {briefing.category}
        </span>
        <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto pr-10">
          <Clock className="w-3 h-3" />
          {timestamp}
        </div>
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-1">
        {briefing.title}
      </h3>

      <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
        {briefing.summary}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">중요도</span>
            <div className="flex items-center gap-1">
              <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(100, importance * 10)}%` }}
                />
              </div>
              <span className="text-xs font-medium text-primary">{importance.toFixed(1)}</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-muted-foreground hover:text-foreground"
                onClick={(e) => e.preventDefault()}
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Slack으로 보내기</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-muted-foreground hover:text-foreground"
                onClick={(e) => e.preventDefault()}
              >
                <Mail className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>이메일로 보내기</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-muted-foreground hover:text-foreground"
                onClick={(e) => e.preventDefault()}
              >
                <Link2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>링크 복사</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-3">{sources}</p>
    </article>
  )
}
