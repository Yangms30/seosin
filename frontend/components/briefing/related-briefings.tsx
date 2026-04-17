"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Layers } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface RelatedBriefing {
  id: string
  category: string
  categoryColor: string
  title: string
  summary: string
  createdAt: string
}

interface RelatedBriefingsProps {
  briefings: RelatedBriefing[]
}

export function RelatedBriefings({ briefings }: RelatedBriefingsProps) {
  return (
    <motion.section
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Layers className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">관련 브리핑</h2>
      </div>
      <div className="space-y-3">
        {briefings.map((briefing) => (
          <Link
            key={briefing.id}
            href={`/dashboard/briefing/${briefing.id}`}
            className="block rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-card/80"
          >
            <Badge
              className={`${briefing.categoryColor} text-white text-xs mb-2`}
            >
              {briefing.category}
            </Badge>
            <h3 className="text-sm font-medium text-foreground mb-2 line-clamp-2">
              {briefing.title}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {briefing.summary}
            </p>
            <span className="text-xs text-muted-foreground">
              {briefing.createdAt}
            </span>
          </Link>
        ))}
      </div>
    </motion.section>
  )
}
