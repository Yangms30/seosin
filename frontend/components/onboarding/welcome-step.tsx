"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import type { OnboardingData } from "@/app/page"
import { Newspaper, Bot } from "lucide-react"

type WelcomeStepProps = {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  onNext: () => void
}

export function WelcomeStep({ data, updateData, onNext }: WelcomeStepProps) {
  const isValid = data.name.trim() !== "" && data.email.trim() !== "" && data.email.includes("@")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isValid) {
      onNext()
    }
  }

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="relative">
          <Newspaper className="w-10 h-10 text-primary" />
          <Bot className="w-5 h-5 text-primary absolute -bottom-1 -right-1" />
        </div>
      </div>
      
      <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">
        BriefBot
      </h1>
      
      <p className="text-muted-foreground text-lg mb-8">
        AI가 매일 핵심 뉴스를 브리핑해드립니다
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">이름</FieldLabel>
            <Input
              id="name"
              type="text"
              placeholder="홍길동"
              value={data.name}
              onChange={(e) => updateData({ name: e.target.value })}
              className="bg-card border-border"
            />
          </Field>
          
          <Field>
            <FieldLabel htmlFor="email">이메일</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={data.email}
              onChange={(e) => updateData({ email: e.target.value })}
              className="bg-card border-border"
            />
          </Field>
        </FieldGroup>

        <Button
          type="submit"
          className="w-full mt-6"
          size="lg"
          disabled={!isValid}
        >
          시작하기
        </Button>
      </form>
    </div>
  )
}
