"use client"

import { motion } from "framer-motion"
import { ClipboardList } from "lucide-react"

interface SummarySectionProps {
  summary: string[]
}

export function SummarySection({ summary }: SummarySectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <ClipboardList className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">3줄 브리핑</h2>
      </div>
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
        <ol className="space-y-4">
          {summary.map((item, index) => (
            <li key={index} className="flex gap-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {index + 1}
              </span>
              <p className="text-foreground leading-relaxed">{item}</p>
            </li>
          ))}
        </ol>
      </div>
    </motion.section>
  )
}
