import { supabase } from './supabase'
import type { MonthlyAnalytics, NextMonthExpenseForecast } from '../types'

interface RawDriver {
  category: string
  impact: number
}

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
  executiveSummary?: {
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
  alerts?: Array<{
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
  }>
  forecastScenarios?: {
    base: number
    optimistic: number
    pessimistic: number
    deltaFromPrevious?: number
    drivers: RawDriver[]
    confidence: number
  }
  spendComposition?: {
    recurring: number
    variable: number
    discretionary: number
    contracted: number
    lockedPct: number
  }
  pareto?: Array<{
    category: string
    amount: number
    pct: number
    cumulativePct: number
  }>
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
    executiveSummary: raw.executiveSummary
      ? {
          runwayMonths: raw.executiveSummary.runwayMonths === null ? null : toNumber(raw.executiveSummary.runwayMonths),
          burnTrend: {
            pct: raw.executiveSummary.burnTrend?.pct === null ? null : toNumber(raw.executiveSummary.burnTrend?.pct),
            slope: raw.executiveSummary.burnTrend?.slope === null ? null : toNumber(raw.executiveSummary.burnTrend?.slope),
          },
          savingsRatePct:
            raw.executiveSummary.savingsRatePct === null ? null : toNumber(raw.executiveSummary.savingsRatePct),
          risk: {
            score: toNumber(raw.executiveSummary.risk?.score),
            reason: raw.executiveSummary.risk?.reason ?? '',
          },
        }
      : undefined,
    alerts: raw.alerts?.map(alert => ({
      id: alert.id,
      severity: alert.severity,
      type: alert.type,
      title: alert.title,
      explanation: alert.explanation,
      impact: toNumber(alert.impact),
      confidence: alert.confidence,
      action: {
        label: alert.action?.label ?? 'Review',
        intent: alert.action?.intent ?? 'review',
      },
    })),
    forecastScenarios: raw.forecastScenarios
      ? {
          base: toNumber(raw.forecastScenarios.base),
          optimistic: toNumber(raw.forecastScenarios.optimistic),
          pessimistic: toNumber(raw.forecastScenarios.pessimistic),
          deltaFromPrevious:
            raw.forecastScenarios.deltaFromPrevious === undefined
              ? undefined
              : toNumber(raw.forecastScenarios.deltaFromPrevious),
          drivers: (raw.forecastScenarios.drivers ?? []).map(driver => ({
            category: driver.category,
            impact: toNumber(driver.impact),
          })),
          confidence: toNumber(raw.forecastScenarios.confidence),
        }
      : undefined,
    spendComposition: raw.spendComposition
      ? {
          recurring: toNumber(raw.spendComposition.recurring),
          variable: toNumber(raw.spendComposition.variable),
          discretionary: toNumber(raw.spendComposition.discretionary),
          contracted: toNumber(raw.spendComposition.contracted),
          lockedPct: toNumber(raw.spendComposition.lockedPct),
        }
      : undefined,
    pareto: raw.pareto?.map(row => ({
      category: row.category,
      amount: toNumber(row.amount),
      pct: toNumber(row.pct),
      cumulativePct: toNumber(row.cumulativePct),
    })),
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
