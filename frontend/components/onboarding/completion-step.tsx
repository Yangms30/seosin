"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import type { OnboardingData } from "@/app/page"
import { CheckCircle2, Newspaper, Bot, Loader2 } from "lucide-react"
import { api, BriefBotApiError } from "@/lib/api"
import { setUserId, getUserId } from "@/lib/storage"
import { scheduleToCron, type SchedulePreset } from "@/lib/schedule"
import { categoryIdsToKorean } from "@/lib/categories"
import type { ChannelConfig, SettingPayload } from "@/lib/types"

type CompletionStepProps = {
  data: OnboardingData
}

const categoryLabels: Record<string, string> = {
  politics: "정치",
  economy: "경제",
  society: "사회",
  international: "국제",
  sports: "스포츠",
  "it-science": "IT/과학",
}

const scheduleLabels: Record<string, string> = {
  morning: "매일 아침 8시",
  noon: "매일 점심 12시",
  evening: "매일 저녁 6시",
  custom: "직접 설정",
}

const channelLabels: Record<string, string> = {
  web: "웹 대시보드",
  email: "이메일",
  slack: "Slack",
}

function buildSettingPayload(data: OnboardingData): SettingPayload {
  const categories = categoryIdsToKorean(data.categories)
  const cron =
    scheduleToCron(data.schedule as SchedulePreset, data.customTime) ?? "0 8 * * *"
  const channels: ChannelConfig = { web: data.channels.includes("web") }
  if (data.channels.includes("email") && data.email.trim()) {
    channels.email = data.email.trim()
  }
  if (data.channels.includes("slack") && data.slackWebhook.trim()) {
    channels.slack = data.slackWebhook.trim()
  }
  return { categories, schedule_cron: cron, channels }
}

export function CompletionStep({ data }: CompletionStepProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const getScheduleDisplay = () => {
    if (data.schedule === "custom") {
      return `매일 ${data.customTime}`
    }
    return scheduleLabels[data.schedule] || data.schedule
  }

  const handleStart = async () => {
    if (submitting) return
    setSubmitting(true)
    const payload = buildSettingPayload(data)

    const run = async () => {
      const existing = getUserId()
      let userId = existing
      if (!userId) {
        const user = await api.users.create({
          name: data.name.trim(),
          email: data.email.trim(),
        })
        userId = user.id
        setUserId(userId)
      }
      await api.settings.save(userId, payload)
      return userId
    }

    try {
      await toast.promise(run(), {
        loading: "계정 생성 및 설정 저장 중…",
        success: "설정이 저장됐습니다. 대시보드로 이동합니다.",
        error: (err) =>
          err instanceof BriefBotApiError
            ? `저장 실패: ${err.detail}`
            : `저장 실패: ${(err as Error).message}`,
      }).unwrap()
      router.push("/dashboard")
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="mb-6"
      >
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-2xl font-bold text-foreground mb-2">
          설정이 완료되었습니다!
        </h2>
        <p className="text-muted-foreground mb-8">
          {data.name}님, BriefBot이 곧 첫 브리핑을 보내드릴게요
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-card border border-border rounded-xl p-6 text-left mb-8"
      >
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <div className="relative">
            <Newspaper className="w-5 h-5 text-primary" />
            <Bot className="w-3 h-3 text-primary absolute -bottom-0.5 -right-0.5" />
          </div>
          설정 요약
        </h3>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">관심 분야</span>
            <span className="text-foreground font-medium">
              {data.categories.map((c) => categoryLabels[c]).join(", ")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">브리핑 시간</span>
            <span className="text-foreground font-medium">{getScheduleDisplay()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">수신 채널</span>
            <span className="text-foreground font-medium">
              {data.channels.map((c) => channelLabels[c]).join(", ")}
            </span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <Button size="lg" className="w-full" onClick={handleStart} disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              저장 중…
            </>
          ) : (
            "대시보드로 이동"
          )}
        </Button>
      </motion.div>
    </div>
  )
}
