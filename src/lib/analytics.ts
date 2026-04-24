import { supabase } from './supabase'
import type { MonthlyAnalytics, NextMonthExpenseForecast } from '../types'

interface AnalyticsRpcResponse {
  month: string
  totals: {
    income: number
    expense: number
    net: number
  }
  categoryBreakdown: Array<{
    category: string
    total: number
    percentage: number
  }>
  categoryChart: {
    labels: string[]
    values: number[]
  }
  monthComparison: {
    current: {
      income: number
      expense: number
      net: number
    }
    previous: {
      income: number
      expense: number
      net: number
    }
    change: {
      income: number
      expense: number
      net: number
    }
  }
  comparisonChart: {
    labels: string[]
    current: number[]
    previous: number[]
  }
}

interface ForecastRpcResponse {
  month: string
  predictedExpense: number
  confidence: {
    level: 'low' | 'medium' | 'high'
    lower: number
    upper: number
  }
  factors: {
    trendDirection: 'up' | 'down' | 'flat'
    trendPercent: number
    topCategories: Array<{
      category: string
      average: number
      sharePercent: number
    }>
  }
  dataPoints: number
  isInsufficientData: boolean
  message: string
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value)
  return 0
}

function normalizeAnalytics(raw: AnalyticsRpcResponse): MonthlyAnalytics {
  return {
    month: raw.month,
    totals: {
      income: toNumber(raw.totals?.income),
      expense: toNumber(raw.totals?.expense),
      net: toNumber(raw.totals?.net),
    },
    categoryBreakdown: (raw.categoryBreakdown ?? []).map(item => ({
      category: item.category,
      total: toNumber(item.total),
      percentage: toNumber(item.percentage),
    })),
    categoryChart: {
      labels: raw.categoryChart?.labels ?? [],
      values: (raw.categoryChart?.values ?? []).map(toNumber),
    },
    monthComparison: {
      current: {
        income: toNumber(raw.monthComparison?.current?.income),
        expense: toNumber(raw.monthComparison?.current?.expense),
        net: toNumber(raw.monthComparison?.current?.net),
      },
      previous: {
        income: toNumber(raw.monthComparison?.previous?.income),
        expense: toNumber(raw.monthComparison?.previous?.expense),
        net: toNumber(raw.monthComparison?.previous?.net),
      },
      change: {
        income: toNumber(raw.monthComparison?.change?.income),
        expense: toNumber(raw.monthComparison?.change?.expense),
        net: toNumber(raw.monthComparison?.change?.net),
      },
    },
    comparisonChart: {
      labels: raw.comparisonChart?.labels ?? [],
      current: (raw.comparisonChart?.current ?? []).map(toNumber),
      previous: (raw.comparisonChart?.previous ?? []).map(toNumber),
    },
  }
}

function normalizeForecast(raw: ForecastRpcResponse): NextMonthExpenseForecast {
  return {
    month: raw.month,
    predictedExpense: toNumber(raw.predictedExpense),
    confidence: {
      level: raw.confidence?.level ?? 'low',
      lower: toNumber(raw.confidence?.lower),
      upper: toNumber(raw.confidence?.upper),
    },
    factors: {
      trendDirection: raw.factors?.trendDirection ?? 'flat',
      trendPercent: toNumber(raw.factors?.trendPercent),
      topCategories: (raw.factors?.topCategories ?? []).map(category => ({
        category: category.category,
        average: toNumber(category.average),
        sharePercent: toNumber(category.sharePercent),
      })),
    },
    dataPoints: toNumber(raw.dataPoints),
    isInsufficientData: Boolean(raw.isInsufficientData),
    message: raw.message ?? '',
  }
}

export async function fetchMonthlyAnalytics(selectedMonth: string) {
  const { data, error } = await supabase.rpc('get_monthly_analytics', {
    target_month: `${selectedMonth}-01`,
  })

  if (error) {
    return { data: null, error: error.message }
  }

  return {
    data: normalizeAnalytics(data as AnalyticsRpcResponse),
    error: null,
  }
}

export async function fetchNextMonthExpenseForecast() {
  const { data, error } = await supabase.rpc('get_next_month_expense_forecast')

  if (error) {
    return { data: null, error: error.message }
  }

  return {
    data: normalizeForecast(data as ForecastRpcResponse),
    error: null,
  }
}
