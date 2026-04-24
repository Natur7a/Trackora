import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchMonthlyAnalytics, fetchNextMonthExpenseForecast } from '../lib/analytics'
import type { MonthlyAnalytics, NextMonthExpenseForecast } from '../types'

function getCurrentMonth() {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${date.getFullYear()}-${month}`
}

export function useMonthlyAnalytics(userId: string | undefined) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth)
  const [analytics, setAnalytics] = useState<MonthlyAnalytics | null>(null)
  const [forecast, setForecast] = useState<NextMonthExpenseForecast | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAnalytics = useCallback(async () => {
    if (!userId) {
      setAnalytics(null)
      setForecast(null)
      setError('Not authenticated')
      return
    }

    setLoading(true)
    setError(null)

    const [{ data: analyticsData, error: analyticsError }, { data: forecastData, error: forecastError }] = await Promise.all([
      fetchMonthlyAnalytics(selectedMonth),
      fetchNextMonthExpenseForecast(),
    ])

    if (analyticsError || forecastError) {
      setError(analyticsError ?? forecastError ?? 'Failed to load analytics')
      setAnalytics(null)
      setForecast(null)
    } else {
      setAnalytics(analyticsData)
      setForecast(forecastData)
    }

    setLoading(false)
  }, [selectedMonth, userId])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  return useMemo(
    () => ({
      selectedMonth,
      setSelectedMonth,
      analytics,
      forecast,
      loading,
      error,
      refetch: loadAnalytics,
    }),
    [selectedMonth, analytics, forecast, loading, error, loadAnalytics],
  )
}
