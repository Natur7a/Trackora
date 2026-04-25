import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchMonthlyAnalytics, fetchNextMonthExpenseForecast } from '../lib/analytics'
import {
  buildMonthWindow,
  deriveAlerts,
  deriveExecutiveSummary,
  deriveForecastScenarios,
  deriveNetMoneyTrend,
  derivePareto,
  deriveSpendComposition,
  getCompareBaseline,
} from '../lib/analyticsEngine'
import type {
  CompareMode,
  MonthlyAnalytics,
  NextMonthExpenseForecast,
} from '../types'

function getCurrentMonth() {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${date.getFullYear()}-${month}`
}

export function useMonthlyAnalytics(userId: string | undefined) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth)
  const [compareMode, setCompareMode] = useState<CompareMode>('previous_month')
  const [analytics, setAnalytics] = useState<MonthlyAnalytics | null>(null)
  const [analyticsByMonth, setAnalyticsByMonth] = useState<Record<string, MonthlyAnalytics>>({})
  const [forecast, setForecast] = useState<NextMonthExpenseForecast | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState('')
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([])
  const [acknowledgedAlertIds, setAcknowledgedAlertIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAnalytics = useCallback(async () => {
    if (!userId) {
      setAnalytics(null)
      setAnalyticsByMonth({})
      setForecast(null)
      setError('Not authenticated')
      return
    }

    setLoading(true)
    setError(null)

    const monthWindow = buildMonthWindow(selectedMonth, 13)
    const [forecastResult, ...analyticsResults] = await Promise.all([
      fetchNextMonthExpenseForecast(),
      ...monthWindow.map(month => fetchMonthlyAnalytics(month)),
    ])

    const analyticsError = analyticsResults.find(result => result.error)?.error ?? null
    const forecastError = forecastResult.error

    if (analyticsError || forecastError) {
      setError(analyticsError ?? forecastError ?? 'Failed to load analytics')
      setAnalytics(null)
      setAnalyticsByMonth({})
      setForecast(null)
    } else {
      const monthMap = analyticsResults.reduce<Record<string, MonthlyAnalytics>>((acc, result) => {
        if (result.data) {
          acc[result.data.month] = result.data
        }
        return acc
      }, {})

      setAnalytics(monthMap[selectedMonth] ?? null)
      setAnalyticsByMonth(monthMap)
      setForecast(forecastResult.data)
      setLastUpdatedAt(new Date().toISOString())
    }

    setLoading(false)
  }, [selectedMonth, userId])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  const baselineTotals = useMemo(() => {
    if (!analytics) return null
    return getCompareBaseline(compareMode, analytics, analyticsByMonth)
  }, [analytics, analyticsByMonth, compareMode])

  const executiveSummary = useMemo(() => {
    if (!analytics) return null
    return deriveExecutiveSummary(analytics, analyticsByMonth)
  }, [analytics, analyticsByMonth])

  const forecastScenarios = useMemo(() => {
    if (!analytics || !baselineTotals) return null
    return deriveForecastScenarios(analytics, forecast, baselineTotals)
  }, [analytics, baselineTotals, forecast])

  const spendComposition = useMemo(() => {
    if (!analytics) return null
    return deriveSpendComposition(analytics, analyticsByMonth)
  }, [analytics, analyticsByMonth])

  const pareto = useMemo(() => {
    if (!analytics) return []
    return derivePareto(analytics)
  }, [analytics])

  const alerts = useMemo(() => {
    if (!analytics || !executiveSummary || !baselineTotals) return []

    const allAlerts = deriveAlerts(analytics, executiveSummary, baselineTotals, analyticsByMonth)
    return allAlerts.filter(
      alert => !dismissedAlertIds.includes(alert.id) && !acknowledgedAlertIds.includes(alert.id),
    )
  }, [analytics, executiveSummary, baselineTotals, analyticsByMonth, dismissedAlertIds, acknowledgedAlertIds])

  const comparisonChartData = useMemo(() => {
    if (!analytics || !baselineTotals) return []

    const baselineByLabel: Record<string, number> = {
      Income: baselineTotals.income,
      Expense: baselineTotals.expense,
      Net: baselineTotals.net,
    }

    return (analytics.comparisonChart.labels ?? []).map((label, index) => ({
      label,
      current: analytics.comparisonChart.current[index] ?? 0,
      comparison: baselineByLabel[label] ?? 0,
    }))
  }, [analytics, baselineTotals])

  const netMoneyTrend = useMemo(() => deriveNetMoneyTrend(analyticsByMonth), [analyticsByMonth])

  const monthOptions = useMemo(() => buildMonthWindow(getCurrentMonth(), 12), [])

  const acknowledgeAlert = useCallback((id: string) => {
    setAcknowledgedAlertIds(prev => (prev.includes(id) ? prev : [...prev, id]))
  }, [])

  const dismissAlert = useCallback((id: string) => {
    setDismissedAlertIds(prev => (prev.includes(id) ? prev : [...prev, id]))
  }, [])

  return useMemo(
    () => ({
      selectedMonth,
      setSelectedMonth,
      monthOptions,
      compareMode,
      setCompareMode,
      lastUpdatedAt,
      analytics,
      forecast,
      executiveSummary,
      alerts,
      forecastScenarios,
      spendComposition,
      pareto,
      comparisonChartData,
      netMoneyTrend,
      loading,
      error,
      refresh: loadAnalytics,
      acknowledgeAlert,
      dismissAlert,
    }),
    [
      selectedMonth,
      monthOptions,
      compareMode,
      lastUpdatedAt,
      analytics,
      forecast,
      executiveSummary,
      alerts,
      forecastScenarios,
      spendComposition,
      pareto,
      comparisonChartData,
      netMoneyTrend,
      loading,
      error,
      loadAnalytics,
      acknowledgeAlert,
      dismissAlert,
    ],
  )
}
