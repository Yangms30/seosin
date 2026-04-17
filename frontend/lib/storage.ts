const USER_ID_KEY = "briefbot_user_id"

function hasWindow(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

export function getUserId(): number | null {
  if (!hasWindow()) return null
  const raw = window.localStorage.getItem(USER_ID_KEY)
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function setUserId(id: number): void {
  if (!hasWindow()) return
  window.localStorage.setItem(USER_ID_KEY, String(id))
}

export function clearUserId(): void {
  if (!hasWindow()) return
  window.localStorage.removeItem(USER_ID_KEY)
}
