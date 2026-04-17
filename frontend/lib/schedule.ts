export type SchedulePreset = "morning" | "noon" | "evening" | "custom" | ""

export function scheduleToCron(preset: SchedulePreset, customTime?: string): string | null {
  switch (preset) {
    case "morning":
      return "0 8 * * *"
    case "noon":
      return "0 12 * * *"
    case "evening":
      return "0 18 * * *"
    case "custom": {
      const [hhRaw, mmRaw] = (customTime ?? "08:00").split(":")
      const hh = clampInt(hhRaw, 0, 23, 8)
      const mm = clampInt(mmRaw, 0, 59, 0)
      return `${mm} ${hh} * * *`
    }
    default:
      return null
  }
}

function clampInt(raw: string | undefined, min: number, max: number, fallback: number): number {
  const n = Number(raw)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.trunc(n)))
}
