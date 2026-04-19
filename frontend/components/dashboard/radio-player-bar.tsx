"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Headphones,
  ChevronUp,
  ChevronDown,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import type { Report } from "@/lib/types"

type RadioPlayerBarProps = {
  reports: Report[]
  isExpanded: boolean
  setIsExpanded: (expanded: boolean) => void
  externalCategory?: string | null
  onExternalConsumed?: () => void
  onPlayingCategoryChange?: (category: string | null) => void
}

const CHARS_PER_SECOND = 5

function formatTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  const mins = Math.floor(s / 60)
  const secs = s % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

function estimateDuration(text: string): number {
  return Math.max(10, Math.round(text.length / CHARS_PER_SECOND))
}

function pickKoreanVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null
  return (
    voices.find((v) => v.lang === "ko-KR") ??
    voices.find((v) => v.lang?.startsWith("ko")) ??
    null
  )
}

export function RadioPlayerBar({
  reports,
  isExpanded,
  setIsExpanded,
  externalCategory,
  onExternalConsumed,
  onPlayingCategoryChange,
}: RadioPlayerBarProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(0.75)
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [voicesLoaded, setVoicesLoaded] = useState(false)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)
  const tickRef = useRef<number | null>(null)

  const playable = useMemo(
    () => reports.filter((r) => (r.radio_script ?? "").trim().length > 0),
    [reports]
  )
  const current = playable[currentIndex]
  const totalTime = current ? estimateDuration(current.radio_script ?? "") : 0

  const hasTTS = typeof window !== "undefined" && "speechSynthesis" in window

  useEffect(() => {
    if (!hasTTS) return
    const update = () => {
      const list = window.speechSynthesis.getVoices()
      setVoice(pickKoreanVoice(list))
      setVoicesLoaded(list.length > 0)
    }
    update()
    window.speechSynthesis.onvoiceschanged = update
    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [hasTTS])

  useEffect(() => {
    return () => {
      utterRef.current = null
      if (hasTTS) window.speechSynthesis.cancel()
      if (tickRef.current) window.clearInterval(tickRef.current)
    }
  }, [hasTTS])

  useEffect(() => {
    if (currentIndex >= playable.length && playable.length > 0) {
      setCurrentIndex(0)
      setCurrentTime(0)
    }
  }, [playable.length, currentIndex])

  const stopTicking = () => {
    if (tickRef.current) {
      window.clearInterval(tickRef.current)
      tickRef.current = null
    }
  }

  const startTicking = (duration: number) => {
    stopTicking()
    tickRef.current = window.setInterval(() => {
      setCurrentTime((t) => (t >= duration ? duration : t + 1))
    }, 1000)
  }

  const speakCurrent = useCallback(() => {
    if (!hasTTS || !current) return
    const script = (current.radio_script ?? "").trim()
    if (!script) return
    const utter = new SpeechSynthesisUtterance(script)
    utter.lang = voice?.lang ?? "ko-KR"
    if (voice) utter.voice = voice
    utter.volume = Math.max(0, Math.min(1, volume))
    utter.rate = 1.0
    const duration = estimateDuration(script)
    utter.onend = () => {
      if (utterRef.current !== utter) return
      stopTicking()
      setCurrentTime(duration)
      setCurrentIndex((idx) => {
        if (idx + 1 < playable.length) return idx + 1
        setIsPlaying(false)
        return idx
      })
    }
    utter.onerror = () => {
      if (utterRef.current !== utter) return
      stopTicking()
      setIsPlaying(false)
    }
    utterRef.current = utter
    window.speechSynthesis.cancel()
    setCurrentTime(0)
    window.speechSynthesis.speak(utter)
    startTicking(duration)
  }, [hasTTS, current, voice, volume, playable.length])

  useEffect(() => {
    if (!isPlaying || isPaused) return
    speakCurrent()
    return () => {
      utterRef.current = null
      if (hasTTS) window.speechSynthesis.cancel()
      stopTicking()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentIndex])

  // Bridge: when parent requests a specific category, jump to it.
  useEffect(() => {
    if (!externalCategory) return
    const idx = playable.findIndex((r) => r.category === externalCategory)
    if (idx === -1) {
      onExternalConsumed?.()
      return
    }
    setIsPaused(false)
    setCurrentIndex(idx)
    setCurrentTime(0)
    setIsPlaying(true)
    onExternalConsumed?.()
  }, [externalCategory, playable, onExternalConsumed])

  // Notify parent of current playing category for UI sync.
  useEffect(() => {
    if (!onPlayingCategoryChange) return
    if (isPlaying && !isPaused && current) {
      onPlayingCategoryChange(current.category)
    } else {
      onPlayingCategoryChange(null)
    }
  }, [isPlaying, isPaused, current, onPlayingCategoryChange])

  const handlePlayPause = () => {
    if (!hasTTS || !current) return
    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause()
      stopTicking()
      setIsPaused(true)
      return
    }
    if (isPlaying && isPaused) {
      window.speechSynthesis.resume()
      startTicking(totalTime)
      setIsPaused(false)
      return
    }
    setIsPaused(false)
    setIsPlaying(true)
  }

  const handleSkipForward = () => {
    if (currentIndex + 1 >= playable.length) return
    setIsPaused(false)
    setCurrentIndex((i) => i + 1)
    setCurrentTime(0)
  }

  const handleSkipBackward = () => {
    setIsPaused(false)
    setCurrentTime(0)
    if (currentIndex === 0) {
      if (isPlaying) speakCurrent()
      return
    }
    setCurrentIndex((i) => i - 1)
  }

  const handleVolumeChange = (v: number) => {
    setVolume(v / 100)
  }

  const handleSeek = () => {
    setCurrentTime(0)
    if (isPlaying && !isPaused) speakCurrent()
  }

  const warning = !hasTTS
    ? "이 브라우저는 음성 재생을 지원하지 않습니다."
    : voicesLoaded && !voice
      ? "한국어 음성이 없어 기본 음성으로 재생됩니다."
      : null

  const categoryProgress = playable.map((r, i) => ({
    name: r.category,
    done: i < currentIndex,
    playing: i === currentIndex && isPlaying && !isPaused,
  }))

  if (playable.length === 0) return null

  const label = current ? `${current.category} 분야 라디오` : "오늘의 분야별 라디오"

  if (!isExpanded) {
    return (
      <div className="sticky top-16 z-40 border-b border-border/50 bg-card/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handlePlayPause}
                disabled={!hasTTS}
              >
                {isPlaying && !isPaused ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </Button>
              <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                <Headphones className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium truncate max-w-[260px]">{label}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(totalTime)}</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => setIsExpanded(true)}
            >
              <ChevronDown className="w-4 h-4 mr-1" />
              확장
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="sticky top-16 z-40 border-b border-border/50 bg-card/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground min-w-0">
              <Headphones className="w-5 h-5 text-primary shrink-0" />
              <span className="font-medium text-foreground truncate">{label}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => setIsExpanded(false)}
            >
              <ChevronUp className="w-4 h-4 mr-1" />
              축소
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={handleSkipBackward}
                disabled={!hasTTS}
              >
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handlePlayPause}
                disabled={!hasTTS}
              >
                {isPlaying && !isPaused ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-0.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={handleSkipForward}
                disabled={!hasTTS || currentIndex + 1 >= playable.length}
              >
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 w-full sm:w-auto flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-12 text-right">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                max={totalTime || 1}
                step={1}
                onValueChange={() => handleSeek()}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-12">{formatTime(totalTime)}</span>
            </div>

            <div className="hidden md:flex items-center gap-2 w-32">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={[Math.round(volume * 100)]}
                max={100}
                step={1}
                onValueChange={(value) => handleVolumeChange(value[0])}
              />
            </div>
          </div>

          {categoryProgress.length > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm flex-wrap">
              {categoryProgress.map((cat, index) => (
                <div key={`${cat.name}-${index}`} className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                      cat.done && "bg-emerald-500/20 text-emerald-600",
                      cat.playing && "bg-primary/20 text-primary animate-pulse",
                      !cat.done && !cat.playing && "bg-muted text-muted-foreground"
                    )}
                  >
                    {cat.done && <Check className="w-3 h-3" />}
                    {cat.name}
                    {cat.playing && " (재생 중)"}
                  </span>
                  {index < categoryProgress.length - 1 && (
                    <span className="text-muted-foreground">→</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {warning && <div className="text-center text-xs text-muted-foreground">{warning}</div>}
        </div>
      </div>
    </div>
  )
}
