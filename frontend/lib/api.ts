import type {
  Briefing,
  GenerateResult,
  SendResult,
  Setting,
  SettingPayload,
  User,
} from "./types"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

const DEFAULT_TIMEOUT_MS = 15_000
const GENERATE_TIMEOUT_MS = 60_000

export class BriefBotApiError extends Error {
  readonly status: number
  readonly detail: string

  constructor(status: number, detail: string) {
    super(`[${status}] ${detail}`)
    this.name = "BriefBotApiError"
    this.status = status
    this.detail = detail
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE"
  body?: unknown
  query?: Record<string, string | number | boolean | undefined | null>
  timeoutMs?: number
  signal?: AbortSignal
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, timeoutMs = DEFAULT_TIMEOUT_MS, signal } = opts

  const url = new URL(path, BASE_URL)
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue
      url.searchParams.set(k, String(v))
    }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  // Bridge external signal
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener("abort", () => controller.abort(), { once: true })
  }

  let res: Response
  try {
    res = await fetch(url.toString(), {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timer)
    if ((err as Error).name === "AbortError") {
      throw new BriefBotApiError(0, "요청이 시간 초과됐거나 취소됐습니다")
    }
    throw new BriefBotApiError(0, `네트워크 오류: ${(err as Error).message}`)
  }
  clearTimeout(timer)

  if (!res.ok) {
    const detail = await parseErrorDetail(res)
    throw new BriefBotApiError(res.status, detail)
  }

  // 204 or empty body
  if (res.status === 204) return undefined as T
  const text = await res.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

async function parseErrorDetail(res: Response): Promise<string> {
  try {
    const data = await res.json()
    if (typeof data?.detail === "string") return data.detail
    if (Array.isArray(data?.detail)) {
      // FastAPI validation errors: [{loc, msg, type}]
      return data.detail.map((d: { msg?: string }) => d.msg ?? "invalid").join("; ")
    }
    return JSON.stringify(data)
  } catch {
    return res.statusText || "unknown error"
  }
}

// ---------- Namespace API ----------

export const api = {
  users: {
    create(input: { name: string; email: string }): Promise<User> {
      return request<User>("/api/users", { method: "POST", body: input })
    },
    get(id: number): Promise<User> {
      return request<User>(`/api/users/${id}`)
    },
  },

  settings: {
    save(userId: number, payload: SettingPayload): Promise<Setting> {
      return request<Setting>(`/api/settings/${userId}`, { method: "PUT", body: payload })
    },
    get(userId: number): Promise<Setting> {
      return request<Setting>(`/api/settings/${userId}`)
    },
  },

  briefings: {
    list(userId: number, opts: { category?: string; limit?: number } = {}): Promise<Briefing[]> {
      return request<Briefing[]>("/api/briefings", {
        query: { user_id: userId, category: opts.category, limit: opts.limit },
      })
    },
    get(id: number): Promise<Briefing> {
      return request<Briefing>(`/api/briefings/${id}`)
    },
    generate(userId: number, signal?: AbortSignal): Promise<GenerateResult> {
      return request<GenerateResult>("/api/briefings/generate", {
        method: "POST",
        query: { user_id: userId },
        timeoutMs: GENERATE_TIMEOUT_MS,
        signal,
      })
    },
  },

  send: {
    dispatch(briefingId: number): Promise<SendResult[]> {
      return request<SendResult[]>(`/api/send/${briefingId}`, { method: "POST" })
    },
  },
}
