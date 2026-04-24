export type TransactionType = 'income' | 'expense'

export const CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment',
  'Gift',
  'Food & Dining',
  'Transport',
  'Housing',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Education',
  'Travel',
  'Utilities',
  'Insurance',
  'Other',
] as const

export type Category = typeof CATEGORIES[number]

export interface FinanceTransaction {
  id: string
  user_id: string
  amount: number
  type: TransactionType
  category: string
  date: string
  note?: string
  created_at: string
  updated_at: string
}

export interface TransactionFormData {
  amount: string
  type: TransactionType
  category: string
  date: string
  note: string
}

export interface MonthlyTotals {
  income: number
  expense: number
  net: number
}

export interface CategorySpending {
  category: string
  total: number
  percentage: number
}

export interface AnalyticsChartSeries {
  labels: string[]
  values: number[]
}

export interface MonthComparison {
  current: MonthlyTotals
  previous: MonthlyTotals
  change: MonthlyTotals
}

export interface MonthlyAnalytics {
  month: string
  totals: MonthlyTotals
  categoryBreakdown: CategorySpending[]
  categoryChart: AnalyticsChartSeries
  monthComparison: MonthComparison
  comparisonChart: {
    labels: string[]
    current: number[]
    previous: number[]
  }
}

export interface ForecastInfluencingFactors {
  trendDirection: 'up' | 'down' | 'flat'
  trendPercent: number
  topCategories: Array<{
    category: string
    average: number
    sharePercent: number
  }>
}

export interface NextMonthExpenseForecast {
  month: string
  predictedExpense: number
  confidence: {
    level: 'low' | 'medium' | 'high'
    lower: number
    upper: number
  }
  factors: ForecastInfluencingFactors
  dataPoints: number
  isInsufficientData: boolean
  message: string
}
