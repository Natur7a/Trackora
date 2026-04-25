import type {
  AnalyticsAlert,
  CompareMode,
  ExecutiveSummary,
  ForecastScenarios,
  MonthlyAnalytics,
  MonthlyTotals,
  NextMonthExpenseForecast,
  ParetoRow,
  SpendComposition,
} from '../types'

const CONTRACTED_CATEGORIES = new Set(['Housing', 'Insurance', 'Utilities', 'Education'])
const DISCRETIONARY_CATEGORIES = new Set(['Entertainment', 'Travel', 'Shopping', 'Food & Dining'])

export function shiftMonth(month: string, delta: number) {
  const [year, monthPart] = month.split('-').map(Number)
  const date = new Date(year, (monthPart ?? 1) - 1 + delta, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function buildMonthWindow(anchorMonth: string, count: number) {
  return Array.from({ length: count }, (_, index) => shiftMonth(anchorMonth, -index))
}

function toPctChange(current: number, baseline: number) {
  if (baseline <= 0) return null
  return ((current - baseline) / baseline) * 100
}

function average(values: number[]) {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function stdDev(values: number[]) {
  if (values.length < 2) return 0
  const avg = average(values)
  const variance = average(values.map(value => (value - avg) ** 2))
  return Math.sqrt(variance)
}

function trendSlope(values: number[]) {
  if (values.length < 2) return null

  const n = values.length
  const xMean = (n - 1) / 2
  const yMean = average(values)

  let numerator = 0
  let denominator = 0

  values.forEach((value, index) => {
    const xDelta = index - xMean
    numerator += xDelta * (value - yMean)
    denominator += xDelta * xDelta
  })

  if (denominator === 0) return null
  return numerator / denominator
}

function getHistoryWindow(monthMap: Record<string, MonthlyAnalytics>, anchorMonth: string, count: number) {
  return buildMonthWindow(anchorMonth, count)
    .map(month => monthMap[month])
    .filter((item): item is MonthlyAnalytics => Boolean(item))
}

export function getCompareBaseline(compareMode: CompareMode, analytics: MonthlyAnalytics, monthMap: Record<string, MonthlyAnalytics>) {
  if (compareMode === 'previous_month') {
    return analytics.monthComparison.previous
  }

  const windowSize = compareMode === 'avg_3m' ? 3 : 12
  const history = getHistoryWindow(monthMap, analytics.month, windowSize + 1)
    .slice(1)
    .map(item => item.totals)

  if (history.length === 0) {
    return analytics.monthComparison.previous
  }

  return {
    income: average(history.map(item => item.income)),
    expense: average(history.map(item => item.expense)),
    net: average(history.map(item => item.net)),
  }
}

export function deriveExecutiveSummary(analytics: MonthlyAnalytics, monthMap: Record<string, MonthlyAnalytics>): ExecutiveSummary {
  if (analytics.executiveSummary) {
    return analytics.executiveSummary
  }

  const currentTotals = analytics.totals
  const trendWindow = getHistoryWindow(monthMap, analytics.month, 3)
    .map(item => item.totals.expense)
    .reverse()

  const burnPct =
    trendWindow.length >= 2 && trendWindow[0] > 0
      ? ((trendWindow[trendWindow.length - 1] - trendWindow[0]) / trendWindow[0]) * 100
      : null

  const slope = trendSlope(trendWindow)
  const savingsRatePct = currentTotals.income > 0 ? ((currentTotals.income - currentTotals.expense) / currentTotals.income) * 100 : null
  const runwayMonths =
    currentTotals.net >= 0
      ? null
      : currentTotals.income > 0
        ? Number((currentTotals.income / Math.abs(currentTotals.net)).toFixed(1))
        : 0

  let score = 25
  const reasons: string[] = []

  if ((savingsRatePct ?? 0) < 0) {
    score += 35
    reasons.push('You are spending more than you earn.')
  }

  if ((burnPct ?? 0) > 8) {
    score += 20
    reasons.push('Your 3-month burn is accelerating.')
  }

  if (runwayMonths !== null && runwayMonths < 6) {
    score += runwayMonths < 3 ? 25 : 10
    reasons.push(`Runway is limited to about ${runwayMonths.toFixed(1)} months at current burn.`)
  }

  score = Math.min(100, Math.max(0, score))
  const reason = reasons[0] ?? 'Cashflow looks stable based on recent spending behavior.'

  return {
    runwayMonths,
    burnTrend: {
      pct: burnPct,
      slope,
    },
    savingsRatePct,
    risk: {
      score,
      reason,
    },
  }
}

export function deriveForecastScenarios(
  analytics: MonthlyAnalytics,
  forecast: NextMonthExpenseForecast | null,
  baseline: MonthlyTotals,
): ForecastScenarios {
  if (analytics.forecastScenarios) {
    return analytics.forecastScenarios
  }

  const base = forecast?.predictedExpense ?? analytics.totals.expense
  const optimistic = forecast?.confidence.lower ?? base * 0.92
  const pessimistic = forecast?.confidence.upper ?? base * 1.08
  const deltaFromPrevious = toPctChange(base, baseline.expense) ?? undefined

  const drivers = (forecast?.factors.topCategories ?? []).slice(0, 3).map(item => ({
    category: item.category,
    impact: item.average,
  }))

  const confidence =
    forecast?.confidence.level === 'high' ? 0.82 : forecast?.confidence.level === 'medium' ? 0.62 : 0.38

  return {
    base,
    optimistic,
    pessimistic,
    deltaFromPrevious,
    drivers,
    confidence,
  }
}

export function deriveSpendComposition(analytics: MonthlyAnalytics, monthMap: Record<string, MonthlyAnalytics>): SpendComposition {
  if (analytics.spendComposition) {
    return analytics.spendComposition
  }

  const currentBreakdown = analytics.categoryBreakdown
  const currentExpense = analytics.totals.expense
  const recentHistory = getHistoryWindow(monthMap, analytics.month, 3)

  const appearances = new Map<string, number>()
  recentHistory.forEach(month => {
    month.categoryBreakdown.forEach(item => {
      appearances.set(item.category, (appearances.get(item.category) ?? 0) + 1)
    })
  })

  const recurringCategories = new Set(
    currentBreakdown
      .map(item => item.category)
      .filter(category => (appearances.get(category) ?? 0) >= 2),
  )

  const totals = currentBreakdown.reduce(
    (acc, item) => {
      if (CONTRACTED_CATEGORIES.has(item.category)) {
        acc.contracted += item.total
      } else if (DISCRETIONARY_CATEGORIES.has(item.category)) {
        acc.discretionary += item.total
      } else if (recurringCategories.has(item.category)) {
        acc.recurring += item.total
      } else {
        acc.variable += item.total
      }

      return acc
    },
    { recurring: 0, variable: 0, discretionary: 0, contracted: 0 },
  )

  const lockedBase = totals.contracted + totals.recurring

  return {
    ...totals,
    lockedPct: currentExpense > 0 ? (lockedBase / currentExpense) * 100 : 0,
  }
}

export function derivePareto(analytics: MonthlyAnalytics): ParetoRow[] {
  if (analytics.pareto) {
    return analytics.pareto
  }

  const sorted = [...analytics.categoryBreakdown].sort((a, b) => b.total - a.total)
  const total = sorted.reduce((sum, row) => sum + row.total, 0)

  let running = 0

  return sorted.map(row => {
    const pct = total > 0 ? (row.total / total) * 100 : 0
    running += pct

    return {
      category: row.category,
      amount: row.total,
      pct,
      cumulativePct: running,
    }
  })
}

export function deriveAlerts(
  analytics: MonthlyAnalytics,
  executiveSummary: ExecutiveSummary,
  baseline: MonthlyTotals,
  monthMap: Record<string, MonthlyAnalytics>,
): AnalyticsAlert[] {
  if (analytics.alerts) {
    return analytics.alerts
  }

  const alerts: AnalyticsAlert[] = []
  const currentExpense = analytics.totals.expense
  const expenseDelta = toPctChange(currentExpense, baseline.expense)

  if ((expenseDelta ?? 0) >= 12) {
    const deltaValue = expenseDelta ?? 0
    alerts.push({
      id: `spike-${analytics.month}`,
      severity: deltaValue >= 25 ? 'critical' : deltaValue >= 18 ? 'high' : 'medium',
      type: 'spike',
      title: 'Expense spike detected',
      explanation: `Spending is ${deltaValue.toFixed(1)}% above your selected baseline for ${analytics.month}.`,
      impact: Math.max(0, currentExpense - baseline.expense),
      confidence: 'high',
      action: {
        label: 'Review top categories now',
        intent: 'review',
      },
    })
  }

  const recentExpenseSeries = getHistoryWindow(monthMap, analytics.month, 6)
    .map(item => item.totals.expense)
    .reverse()

  if (recentExpenseSeries.length >= 4) {
    const recentBaseline = average(recentExpenseSeries.slice(0, recentExpenseSeries.length - 1))
    const sigma = stdDev(recentExpenseSeries.slice(0, recentExpenseSeries.length - 1))
    const current = recentExpenseSeries[recentExpenseSeries.length - 1]
    const zScore = sigma > 0 ? (current - recentBaseline) / sigma : 0

    if (zScore >= 1.25 || ((executiveSummary.burnTrend.pct ?? 0) > 8 && (executiveSummary.burnTrend.slope ?? 0) > 0)) {
      alerts.push({
        id: `trend-${analytics.month}`,
        severity: zScore >= 2 ? 'critical' : zScore >= 1.5 ? 'high' : 'medium',
        type: 'trend_break',
        title: 'Burn trend is breaking upward',
        explanation: zScore >= 1.25
          ? 'Current month burn is meaningfully above your recent pattern, indicating a trend break.'
          : `Your 3-month burn trend increased by ${(executiveSummary.burnTrend.pct ?? 0).toFixed(1)}%, raising monthly cash pressure.`,
        impact: Math.max(0, currentExpense - recentBaseline),
        confidence: zScore >= 1.5 ? 'high' : 'medium',
        action: {
          label: 'Cut one discretionary category',
          intent: 'cut',
        },
      })
    }
  }

  const recent = getHistoryWindow(monthMap, analytics.month, 4).slice(1)
  const historicalCategories = new Set(recent.flatMap(month => month.categoryBreakdown.map(item => item.category)))
  const newCategories = analytics.categoryBreakdown.filter(item => !historicalCategories.has(item.category))
  const biggestNew = [...newCategories].sort((a, b) => b.total - a.total)[0]

  if (biggestNew && biggestNew.total > 0) {
    alerts.push({
      id: `new-merchant-${analytics.month}-${biggestNew.category}`,
      severity: biggestNew.total > analytics.totals.expense * 0.12 ? 'medium' : 'low',
      type: 'new_merchant',
      title: `New spending pocket: ${biggestNew.category}`,
      explanation: `${biggestNew.category} is new versus recent months and already represents ${biggestNew.percentage.toFixed(1)}% of spending.`,
      impact: biggestNew.total,
      confidence: 'medium',
      action: {
        label: 'Investigate this category',
        intent: 'investigate',
      },
    })
  }

  const severityRank: Record<AnalyticsAlert['severity'], number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  }

  return alerts
    .sort((a, b) => {
      const severityDelta = severityRank[b.severity] - severityRank[a.severity]
      if (severityDelta !== 0) return severityDelta
      return b.impact - a.impact
    })
    .slice(0, 3)
}

export function deriveNetMoneyTrend(analyticsByMonth: Record<string, MonthlyAnalytics>) {
  const months = Object.keys(analyticsByMonth).sort((a, b) => a.localeCompare(b))

  return months.map(month => ({
    month,
    net: analyticsByMonth[month]?.totals.net ?? 0,
  }))
}
