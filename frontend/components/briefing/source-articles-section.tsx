"use client"

import { motion } from "framer-motion"
import { Newspaper, ExternalLink } from "lucide-react"

interface Source {
  name: string
  title: string
  url: string
  publishedAt: string
  icon: string
}

interface SourceArticlesSectionProps {
  sources: Source[]
}

export function SourceArticlesSection({ sources }: SourceArticlesSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">원문 기사</h2>
      </div>
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {sources.map((source, index) => (
          <a
            key={index}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 p-4 transition-colors hover:bg-secondary/30 group"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-lg">
              {source.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-primary">
                  {source.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {source.publishedAt}
                </span>
              </div>
              <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {source.title}
              </h3>
            </div>
            <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </div>
    </motion.section>
  )
}
