import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchMonthlyAnalytics } from '../lib/analytics'
import type { MonthlyAnalytics } from '../types'

function getCurrentMonth() {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${date.getFullYear()}-${month}`
}

export function useMonthlyAnalytics(userId: string | undefined) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth)
  const [analytics, setAnalytics] = useState<MonthlyAnalytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAnalytics = useCallback(async () => {
    if (!userId) {
      setAnalytics(null)
      setError('Not authenticated')
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: requestError } = await fetchMonthlyAnalytics(selectedMonth)

    if (requestError) {
      setError(requestError)
      setAnalytics(null)
    } else {
      setAnalytics(data)
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
      loading,
      error,
      refetch: loadAnalytics,
    }),
    [selectedMonth, analytics, loading, error, loadAnalytics],
  )
}
