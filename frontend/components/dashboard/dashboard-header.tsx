"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Archive, Mail, Settings, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { api, BriefBotApiError } from "@/lib/api"
import { getUserId } from "@/lib/storage"

export function DashboardHeader() {
  const [name, setName] = useState<string>("")
  const [email, setEmail] = useState<string>("")

  useEffect(() => {
    let cancelled = false
    const userId = getUserId()
    api.users
      .get(userId)
      .then((u) => {
        if (cancelled) return
        setName(u.name)
        setEmail(u.email)
      })
      .catch((err) => {
        // Header is non-critical: silently degrade if the user lookup fails.
        if (!(err instanceof BriefBotApiError)) return
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo: envelope icon + wordmark (한자 병기) + tagline */}
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15 border border-primary/20">
              <Mail className="w-5 h-5 text-primary" strokeWidth={2} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-bold text-foreground tracking-tight">
                서신 <span className="text-primary/80 font-semibold text-base">書信</span>
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5">
                오늘의 AI 뉴스 편지
              </span>
            </div>
          </Link>

          {/* User section */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              aria-label="보관함"
              asChild
            >
              <Link href="/dashboard/history">
                <Archive className="w-5 h-5" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              aria-label="설정"
              asChild
            >
              <Link href="/dashboard/settings">
                <Settings className="w-5 h-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-3 pl-2 border-l border-border/50">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">{name || "—"}</p>
                <p className="text-xs text-muted-foreground">{email || ""}</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary">
                <UserIcon className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
