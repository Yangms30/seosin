"use client"

import { motion } from "framer-motion"
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AnalysisSectionProps {
  entities: string[]
  sentiment: "긍정" | "부정" | "중립"
  coreFact: string
}

export function AnalysisSection({ entities, sentiment, coreFact }: AnalysisSectionProps) {
  const sentimentConfig = {
    긍정: {
      color: "text-green-400",
      bgColor: "bg-green-400",
      icon: TrendingUp,
    },
    부정: {
      color: "text-red-400",
      bgColor: "bg-red-400",
      icon: TrendingDown,
    },
    중립: {
      color: "text-yellow-400",
      bgColor: "bg-yellow-400",
      icon: Minus,
    },
  }

  const config = sentimentConfig[sentiment]
  const SentimentIcon = config.icon

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">분석 데이터</h2>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        {/* Key Entities */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            핵심 개체
          </h3>
          <div className="flex flex-wrap gap-2">
            {entities.map((entity, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-secondary/50 text-foreground"
              >
                {entity}
              </Badge>
            ))}
          </div>
        </div>

        {/* Sentiment */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            감성 분석
          </h3>
          <div className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${config.bgColor}`} />
            <SentimentIcon className={`h-4 w-4 ${config.color}`} />
            <span className={`font-medium ${config.color}`}>{sentiment}</span>
          </div>
        </div>

        {/* Core Fact */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            핵심 팩트
          </h3>
          <p className="rounded-lg bg-primary/10 border border-primary/20 px-4 py-3 text-foreground">
            {coreFact}
          </p>
        </div>
      </div>
    </motion.section>
  )
}
