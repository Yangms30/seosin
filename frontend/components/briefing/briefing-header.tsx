"use client"

import { motion } from "framer-motion"
import {
  Headphones,
  Mail,
  MessageSquare,
  Link2,
  Star,
  Clock,
  Cpu,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface BriefingHeaderProps {
  data: {
    category: string
    categoryColor: string
    title: string
    createdAt: string
    importanceScore: number
    aiModel: string
  }
  onCopyLink: () => void
  copiedLink: boolean
}

export function BriefingHeader({ data, onCopyLink, copiedLink }: BriefingHeaderProps) {
  const renderStars = (score: number) => {
    const fullStars = Math.floor(score)
    const hasHalf = score % 1 >= 0.5
    const stars = []

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        )
      } else if (i === fullStars && hasHalf) {
        stars.push(
          <div key={i} className="relative">
            <Star className="h-4 w-4 text-muted-foreground/30" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        )
      } else {
        stars.push(
          <Star key={i} className="h-4 w-4 text-muted-foreground/30" />
        )
      }
    }
    return stars
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-6"
    >
      {/* Category Badge */}
      <Badge className={`${data.categoryColor} text-white`}>
        {data.category}
      </Badge>

      {/* Title */}
      <h1 className="text-2xl font-bold leading-tight text-foreground md:text-3xl text-balance">
        {data.title}
      </h1>

      {/* Metadata Row */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          <span>{data.createdAt}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>중요도</span>
          <div className="flex items-center gap-0.5">
            {renderStars(data.importanceScore)}
          </div>
          <span className="text-foreground">({data.importanceScore})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Cpu className="h-4 w-4" />
          <span>{data.aiModel}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button variant="default" size="sm" className="gap-2 bg-primary hover:bg-primary/90">
          <Headphones className="h-4 w-4" />
          듣기
        </Button>
        <Button variant="outline" size="sm" className="gap-2">
          <Mail className="h-4 w-4" />
          이메일 발송
        </Button>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Slack 발송
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={onCopyLink}
        >
          {copiedLink ? (
            <>
              <Check className="h-4 w-4 text-green-500" />
              복사됨
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4" />
              링크 복사
            </>
          )}
        </Button>
      </div>
    </motion.div>
  )
}
