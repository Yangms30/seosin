import type { Category } from "./types"

export const CATEGORY_ID_TO_KOREAN: Record<string, Category> = {
  politics: "정치",
  economy: "경제",
  society: "사회",
  international: "국제",
  sports: "스포츠",
  "it-science": "IT/과학",
}

export const KOREAN_TO_CATEGORY_ID: Record<Category, string> = {
  정치: "politics",
  경제: "economy",
  사회: "society",
  국제: "international",
  스포츠: "sports",
  "IT/과학": "it-science",
}

export function categoryIdToKorean(id: string): Category | null {
  return CATEGORY_ID_TO_KOREAN[id] ?? null
}

export function categoryIdsToKorean(ids: string[]): Category[] {
  const out: Category[] = []
  for (const id of ids) {
    const ko = CATEGORY_ID_TO_KOREAN[id]
    if (ko) out.push(ko)
  }
  return out
}
