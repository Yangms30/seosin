"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Headphones, Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RadioScriptSectionProps {
  script: string
}

export function RadioScriptSection({ script }: RadioScriptSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Headphones className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">라디오 스크립트</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? (
            <>
              <Pause className="h-4 w-4" />
              일시정지
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              재생하기
            </>
          )}
        </Button>
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="prose prose-invert max-w-none">
          {script.split("\n\n").map((paragraph, index) => (
            <p
              key={index}
              className="text-muted-foreground leading-relaxed mb-4 last:mb-0"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </motion.section>
  )
}
