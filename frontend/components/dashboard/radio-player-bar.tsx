"use client"

import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Headphones,
  ChevronUp,
  ChevronDown,
  Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

type RadioPlayerBarProps = {
  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void
  currentTime: number
  setCurrentTime: (time: number) => void
  totalTime: number
  volume: number
  setVolume: (volume: number) => void
  isExpanded: boolean
  setIsExpanded: (expanded: boolean) => void
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

const categoryProgress = [
  { name: "정치", done: true },
  { name: "경제", playing: true },
  { name: "스포츠", done: false },
]

export function RadioPlayerBar({
  isPlaying,
  setIsPlaying,
  currentTime,
  setCurrentTime,
  totalTime,
  volume,
  setVolume,
  isExpanded,
  setIsExpanded,
}: RadioPlayerBarProps) {
  if (!isExpanded) {
    return (
      <div className="sticky top-16 z-40 border-b border-border/50 bg-card/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </Button>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Headphones className="w-4 h-4" />
                <span className="text-sm font-medium">오늘의 브리핑 전체 듣기</span>
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
    <div className="sticky top-16 z-40 border-b border-border/50 bg-card/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col gap-4">
          {/* Top row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Headphones className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">오늘의 브리핑 전체 듣기</span>
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

          {/* Main controls row */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            {/* Playback controls */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>

            {/* Progress bar */}
            <div className="flex-1 w-full sm:w-auto flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-12 text-right">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                max={totalTime}
                step={1}
                onValueChange={(value) => setCurrentTime(value[0])}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-12">
                {formatTime(totalTime)}
              </span>
            </div>

            {/* Volume */}
            <div className="hidden md:flex items-center gap-2 w-32">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={[volume]}
                max={100}
                step={1}
                onValueChange={(value) => setVolume(value[0])}
              />
            </div>
          </div>

          {/* Category progress */}
          <div className="flex items-center justify-center gap-2 text-sm">
            {categoryProgress.map((cat, index) => (
              <div key={cat.name} className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                    cat.done && "bg-emerald-500/20 text-emerald-400",
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
        </div>
      </div>
    </div>
  )
}
