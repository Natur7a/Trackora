import { GoogleGenerativeAI } from '@google/generative-ai'
import type { FinanceTransaction } from '../types'
import type { TxType } from '../types/finance'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../types/finance'

const EXPENSE_KEYWORDS: Record<string, string[]> = {
  Groceries: ['grocery', 'groceries', 'supermarket', 'market', 'walmart', 'costco', 'trader joe', 'whole foods', 'safeway', 'kroger', 'aldi'],
  Rent: ['rent', 'lease', 'apartment', 'landlord', 'housing'],
  Utilities: ['electric', 'electricity', 'water', 'gas', 'internet', 'phone', 'utility', 'utilities', 'power', 'cable', 'bill'],
  Transport: ['uber', 'lyft', 'taxi', 'bus', 'train', 'metro', 'fuel', 'parking', 'toll', 'transit', 'commute', 'grab'],
  Dining: ['restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonald', 'pizza', 'sushi', 'lunch', 'dinner', 'breakfast', 'doordash', 'grubhub', 'eat out', 'takeout', 'takeaway'],
  Entertainment: ['netflix', 'spotify', 'movie', 'cinema', 'concert', 'game', 'steam', 'disney', 'hulu', 'youtube', 'ticket'],
  Health: ['doctor', 'pharmacy', 'medicine', 'hospital', 'gym', 'fitness', 'dental', 'medical', 'clinic', 'health', 'prescription'],
  Shopping: ['amazon', 'shop', 'store', 'mall', 'clothing', 'shoes', 'fashion', 'target', 'ebay', 'online order'],
  Travel: ['hotel', 'flight', 'airbnb', 'booking', 'airline', 'vacation', 'trip', 'airfare', 'hostel'],
  Education: ['tuition', 'course', 'textbook', 'school', 'university', 'college', 'udemy', 'coursera', 'class', 'study'],
  Subscriptions: ['subscription', 'monthly plan', 'annual plan', 'membership', 'premium', 'renewal'],
}

const INCOME_KEYWORDS: Record<string, string[]> = {
  Salary: ['salary', 'paycheck', 'payroll', 'wage', 'pay'],
  Freelance: ['freelance', 'client', 'invoice', 'contract', 'project payment'],
  Investments: ['dividend', 'interest', 'stock', 'crypto', 'investment', 'return', 'capital gain'],
  Gifts: ['gift', 'birthday', 'present', 'bonus'],
  Refunds: ['refund', 'cashback', 'cash back', 'reimbursement', 'return'],
}

function matchKeywords(note: string, map: Record<string, string[]>): string | null {
  const lower = note.toLowerCase()
  for (const [category, keywords] of Object.entries(map)) {
    if (keywords.some(kw => lower.includes(kw))) return category
  }
  return null
}

function historyBasedSuggestion(note: string, type: TxType, history: FinanceTransaction[]): string | null {
  if (!note.trim()) return null
  const lower = note.toLowerCase()
  const words = lower.split(/\s+/).filter(w => w.length > 2)
  if (!words.length) return null

  const counts: Record<string, number> = {}
  for (const tx of history) {
    if (tx.type !== type || !tx.note) continue
    const txNote = tx.note.toLowerCase()
    if (words.some(w => txNote.includes(w))) {
      counts[tx.category] = (counts[tx.category] ?? 0) + 1
    }
  }

  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  return best ? best[0] : null
}

async function geminiSuggest(note: string, type: TxType): Promise<string | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) return null

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `You are a finance categorization assistant. Given a transaction note, pick the single best matching category from the list. Reply with ONLY the category name, nothing else.

Transaction note: "${note}"
Transaction type: ${type}
Categories: ${categories.join(', ')}

Category:`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()

  const match = (categories as readonly string[]).find(
    c => c.toLowerCase() === text.toLowerCase()
  )
  return match ?? null
}

export async function suggestCategory(
  note: string,
  type: TxType,
  history: FinanceTransaction[],
): Promise<string | null> {
  if (!note.trim()) return null

  try {
    const fromGemini = await geminiSuggest(note, type)
    if (fromGemini) return fromGemini
  } catch {
    // fall through to local fallback
  }

  const fromHistory = historyBasedSuggestion(note, type, history)
  if (fromHistory) return fromHistory

  const map = type === 'income' ? INCOME_KEYWORDS : EXPENSE_KEYWORDS
  return matchKeywords(note, map)
}
