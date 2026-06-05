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
  executiveSummary?: ExecutiveSummary
  alerts?: AnalyticsAlert[]
  forecastScenarios?: ForecastScenarios
  spendComposition?: SpendComposition
  pareto?: ParetoRow[]
}

export type CompareMode = 'previous_month' | 'avg_3m' | 'avg_12m'

export interface ExecutiveSummary {
  runwayMonths: number | null
  burnTrend: {
    pct: number | null
    slope: number | null
  }
  savingsRatePct: number | null
  risk: {
    score: number
    reason: string
  }
}

export interface AnalyticsAlert {
  id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: 'spike' | 'duplicate' | 'new_merchant' | 'trend_break'
  title: string
  explanation: string
  impact: number
  confidence: 'low' | 'medium' | 'high'
  action: {
    label: string
    intent: 'review' | 'cut' | 'investigate'
  }
}

export interface ForecastDriver {
  category: string
  impact: number
}

export interface ForecastScenarios {
  base: number
  optimistic: number
  pessimistic: number
  deltaFromPrevious?: number
  drivers: ForecastDriver[]
  confidence: number
}

export interface SpendComposition {
  recurring: number
  variable: number
  discretionary: number
  contracted: number
  lockedPct: number
}

export interface ParetoRow {
  category: string
  amount: number
  pct: number
  cumulativePct: number
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
