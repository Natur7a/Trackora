import { useState, useCallback } from 'react'
import type { FinanceTransaction } from '../types'

// ── Types ─────────────────────────────────────────────────────────────────────
export type AIZone = 'expenses' | 'assets' | 'liabilities'

export interface ClassifiedItem {
  category: string
  amount: number
  zone: AIZone
  reason: string
}

interface AIZoneResult {
  classified: ClassifiedItem[]
  loading: boolean
  error: string | null
  classify: (transactions: FinanceTransaction[]) => Promise<void>
}

// ── Gemini API ────────────────────────────────────────────────────────────────
const GEMINI_API_KEY = import.meta.env.VITE_AI_KEY as string
const GEMINI_MODEL   = 'gemini-2.0-flash-lite'
const GEMINI_URL     = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`

const CACHE_KEY     = 'trackora_ai_zones_v1'
const COOLDOWN_KEY  = 'trackora_ai_cooldown_until'

// ── Cache helpers ─────────────────────────────────────────────────────────────
function getCacheFingerprint(transactions: FinanceTransaction[]): string {
  return transactions
    .filter(t => t.type === 'expense')
    .map(t => t.category.toLowerCase())
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort()
    .join('|')
}

interface CacheEntry {
  fingerprint: string
  result: ClassifiedItem[]
  savedAt: number
}

function readCache(fingerprint: string): ClassifiedItem[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const entry: CacheEntry = JSON.parse(raw)
    const age = Date.now() - entry.savedAt
    if (entry.fingerprint === fingerprint && age < 24 * 60 * 60 * 1000) {
      console.log('[AI] Cache hit — skipping API call')
      return entry.result
    }
  } catch { /* ignore */ }
  return null
}

function writeCache(fingerprint: string, result: ClassifiedItem[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ fingerprint, result, savedAt: Date.now() }))
    console.log('[AI] Result cached to localStorage')
  } catch { /* ignore */ }
}

function isCoolingDown(): boolean {
  try {
    const until = Number(localStorage.getItem(COOLDOWN_KEY) ?? 0)
    return Date.now() < until
  } catch { return false }
}

function setCooldown(seconds: number) {
  try {
    localStorage.setItem(COOLDOWN_KEY, String(Date.now() + seconds * 1000))
    console.log(`[AI] Rate limited — cooling down for ${seconds}s`)
  } catch { /* ignore */ }
}

// ── Rule-based fallback (no API needed) ──────────────────────────────────────
// Used when Gemini is unavailable. Simple keyword matching.
const ASSET_KEYWORDS      = ['stock', 'invest', 'saving', 'property', 'real estate', 'bond', 'crypto', 'fund', 'equipment', 'asset']
const LIABILITY_KEYWORDS  = ['loan', 'mortgage', 'credit', 'debt', 'insurance', 'installment', 'payment', 'lease', 'rent']

function fallbackClassify(category: string): AIZone {
  const c = category.toLowerCase()
  if (ASSET_KEYWORDS.some(k => c.includes(k)))     return 'assets'
  if (LIABILITY_KEYWORDS.some(k => c.includes(k))) return 'liabilities'
  return 'expenses'
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAIZoneClassifier(): AIZoneResult {
  const [classified, setClassified] = useState<ClassifiedItem[]>([])
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const classify = useCallback(async (transactions: FinanceTransaction[]) => {
    const expenses = transactions.filter(t => t.type === 'expense')
    if (expenses.length === 0) { setClassified([]); return }

    // Aggregate amounts (always needed for display)
    const aggregated = Object.values(
      expenses.reduce<Record<string, { category: string; amount: number; notes: string[] }>>(
        (acc, t) => {
          const key = t.category.toLowerCase()
          if (!acc[key]) acc[key] = { category: t.category, amount: 0, notes: [] }
          acc[key].amount += t.amount
          if (t.note) acc[key].notes.push(t.note)
          return acc
        }, {}
      )
    )

    const fingerprint = getCacheFingerprint(transactions)

    // ── 1. Try cache ─────────────────────────────────────────────────────────
    const cached = readCache(fingerprint)
    if (cached) {
      const rehydrated = cached.map(c => ({
        ...c,
        amount: aggregated.find(a => a.category.toLowerCase() === c.category.toLowerCase())?.amount ?? c.amount,
      }))
      setClassified(rehydrated)
      return
    }

    // ── 2. If rate-limited, use fallback immediately ──────────────────────────
    if (isCoolingDown()) {
      console.log('[AI] Still in cooldown — using keyword fallback')
      const fallback: ClassifiedItem[] = aggregated.map(a => ({
        category: a.category,
        amount: a.amount,
        zone: fallbackClassify(a.category),
        reason: 'Classified by keyword (AI on cooldown)',
      }))
      setClassified(fallback)
      return
    }

    // ── 3. Call Gemini ────────────────────────────────────────────────────────
    const itemsText = aggregated
      .map(i => `- "${i.category}"${i.notes.length ? ` (note: ${i.notes[0]})` : ''}`)
      .join('\n')

    const prompt = `Classify each expense category into one of: "expenses", "assets", or "liabilities".
- expenses: food, entertainment, utilities, subscriptions
- assets: stocks, investments, savings, property, equipment
- liabilities: loans, mortgage, credit card payments, insurance

${itemsText}

Reply ONLY with JSON array: [{"category":"...","zone":"...","reason":"..."}]`

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
        }),
      })

      // Handle rate limit — store cooldown, fall back to keywords
      if (res.status === 429) {
        const errBody = await res.json().catch(() => ({}))
        const retrySeconds = Number(
          errBody?.error?.details?.find((d: { retryDelay?: string }) => d.retryDelay)
            ?.retryDelay?.replace('s','') ?? 60
        )
        setCooldown(retrySeconds + 5)
        const fallback: ClassifiedItem[] = aggregated.map(a => ({
          category: a.category,
          amount: a.amount,
          zone: fallbackClassify(a.category),
          reason: 'Classified by keyword (rate limited)',
        }))
        setClassified(fallback)
        return
      }

      if (!res.ok) throw new Error(`Gemini API error ${res.status}: ${await res.text()}`)

      const data = await res.json()
      const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
      const cleaned = rawText.replace(/```json|```/g, '').trim()
      const parsed: Array<{ category: string; zone: AIZone; reason: string }> = JSON.parse(cleaned)

      const result: ClassifiedItem[] = parsed.map(p => ({
        category: p.category,
        amount: aggregated.find(a => a.category.toLowerCase() === p.category.toLowerCase())?.amount ?? 0,
        zone: p.zone,
        reason: p.reason,
      }))

      writeCache(fingerprint, result)
      setClassified(result)
    } catch (err) {
      console.error('[useAIZoneClassifier]', err)
      // Always fall back gracefully — never leave zones empty
      const fallback: ClassifiedItem[] = aggregated.map(a => ({
        category: a.category,
        amount: a.amount,
        zone: fallbackClassify(a.category),
        reason: 'Classified by keyword (AI unavailable)',
      }))
      setClassified(fallback)
      setError(err instanceof Error ? err.message : 'AI classification failed')
    } finally {
      setLoading(false)
    }
  }, [])

  return { classified, loading, error, classify }
}