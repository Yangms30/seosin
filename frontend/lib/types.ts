// Mirrors backend/schemas.py — keep in sync when backend types change.

export type User = {
  id: number
  name: string
  email: string
  created_at: string
}

export type ChannelConfig = {
  web?: boolean
  slack?: string
  email?: string
}

export type Setting = {
  id: number
  user_id: number
  categories: string[]
  schedule_cron: string | null
  channels: ChannelConfig
  updated_at: string
}

export type SettingPayload = {
  categories: string[]
  schedule_cron: string | null
  channels: ChannelConfig
}

// Known primary categories; keep as string for forward-compat with custom ones.
export type Category = "정치" | "경제" | "사회" | "국제" | "스포츠" | "IT/과학"

export const CATEGORIES: Category[] = ["정치", "경제", "사회", "국제", "스포츠", "IT/과학"]

export type Sentiment = "positive" | "neutral" | "negative"

export type SourceArticle = {
  title: string
  url: string
  source: string | null
}

export type RawAnalysis = {
  topic?: string
  key_entities?: string[]
  core_fact?: string
  sentiment?: Sentiment
  importance_score?: number
} & Record<string, unknown>

export type Briefing = {
  id: number
  user_id: number
  category: string
  title: string
  summary: string
  radio_script: string | null
  source_articles: SourceArticle[]
  importance_score: number | null
  raw_analysis: RawAnalysis | null
  created_at: string
}

export type GenerateResult = {
  user_id: number
  generated: number
  briefings: Briefing[]
}

export type SendResult = {
  channel: string
  status: string
  error_msg?: string | null
}
