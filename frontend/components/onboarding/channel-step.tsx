"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { OnboardingData } from "@/app/page"
import { ArrowLeft, Monitor, Mail, MessageSquare, Check } from "lucide-react"

type ChannelStepProps = {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  onNext: () => void
  onPrev: () => void
}

const channels = [
  { id: "web", label: "웹 대시보드", icon: Monitor, description: "브라우저에서 확인", alwaysOn: true },
  { id: "email", label: "이메일", icon: Mail, description: "이메일로 받기" },
  { id: "slack", label: "Slack", icon: MessageSquare, description: "슬랙 채널로 받기" },
]

export function ChannelStep({ data, updateData, onNext, onPrev }: ChannelStepProps) {
  const toggleChannel = (channelId: string) => {
    if (channelId === "web") return // Web is always on
    
    const current = data.channels
    const updated = current.includes(channelId)
      ? current.filter((c) => c !== channelId)
      : [...current, channelId]
    updateData({ channels: updated })
  }

  const handleSubmit = () => {
    onNext()
  }

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
        어떤 채널로 받으시겠어요?
      </h2>
      <p className="text-muted-foreground text-sm mb-6 text-center">
        여러 채널을 동시에 선택할 수 있어요
      </p>

      <div className="space-y-3 mb-6">
        {channels.map((channel) => {
          const isSelected = data.channels.includes(channel.id)
          const Icon = channel.icon
          return (
            <div key={channel.id}>
              <button
                onClick={() => toggleChannel(channel.id)}
                disabled={channel.alwaysOn}
                className={cn(
                  "flex items-center gap-4 w-full p-4 rounded-xl border-2 transition-all duration-200 text-left",
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-muted-foreground",
                  channel.alwaysOn && "cursor-default"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  isSelected ? "bg-primary/20" : "bg-muted"
                )}>
                  <Icon className={cn("w-5 h-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("font-medium", isSelected ? "text-primary" : "text-foreground")}>
                      {channel.label}
                    </span>
                    {channel.alwaysOn && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        기본
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{channel.description}</span>
                </div>
                {isSelected && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </button>

              {channel.id === "email" && isSelected && (
                <div className="mt-3 ml-2">
                  <Input
                    type="email"
                    placeholder="이메일 주소"
                    value={data.email}
                    onChange={(e) => updateData({ email: e.target.value })}
                    className="bg-card border-border"
                  />
                </div>
              )}

              {channel.id === "slack" && isSelected && (
                <div className="mt-3 ml-2">
                  <Input
                    type="url"
                    placeholder="Slack Webhook URL"
                    value={data.slackWebhook}
                    onChange={(e) => updateData({ slackWebhook: e.target.value })}
                    className="bg-card border-border"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Slack 앱 설정에서 Incoming Webhook URL을 복사해주세요
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full"
        size="lg"
      >
        설정 완료
      </Button>
    </div>
  )
}
