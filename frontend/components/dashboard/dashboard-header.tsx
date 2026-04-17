"use client"

import { Settings, User } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/20">
              <svg
                viewBox="0 0 24 24"
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 4h16v16H4z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 8h16" strokeLinecap="round" />
                <path d="M8 4v4" strokeLinecap="round" />
                <circle cx="12" cy="14" r="2" fill="currentColor" stroke="none" />
                <path d="M10 14h-2" strokeLinecap="round" />
                <path d="M16 14h-2" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-xl font-bold text-foreground">BriefBot</span>
          </div>

          {/* User section */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Settings className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3 pl-2 border-l border-border/50">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">김민수</p>
                <p className="text-xs text-muted-foreground">minsu@example.com</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary">
                <User className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
