import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  ShieldAlert,
  Wallet,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Navbar } from '../components/Navbar'
import { Button } from '../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { useAuth } from '../context/AuthContext'
import { useMonthlyAnalytics } from '../hooks/useMonthlyAnalytics'
import { formatCurrency, formatMonth } from '../lib/format'
import { CATEGORY_EMOJI } from '../types/finance'
import type { AnalyticsAlert, ForecastScenarios } from '../types'

const COLORS = ['#34d399', '#22d3ee', '#fda4af', '#67e8f9', '#a7f3d0', '#5eead4', '#fb7185', '#2dd4bf']

export function AnalyticsPage() {
  const { user } = useAuth()
  const {
    selectedMonth,
    setSelectedMonth,
    monthOptions,
    compareMode,
    setCompareMode,
    lastUpdatedAt,
    analytics,
    executiveSummary,
    alerts,
    forecastScenarios,
    spendComposition,
    pareto,
    comparisonChartData,
    netMoneyTrend,
    loading,
    error,
    refresh,
    acknowledgeAlert,
    dismissAlert,
  } = useMonthlyAnalytics(user?.id)

  const [hydratedSecondary, setHydratedSecondary] = useState(false)
  const [activeAlert, setActiveAlert] = useState<AnalyticsAlert | null>(null)

  useEffect(() => {
    if (!analytics) {
      setHydratedSecondary(false)
      return
    }

    setHydratedSecondary(false)
    const timer = window.setTimeout(() => setHydratedSecondary(true), 120)
    return () => window.clearTimeout(timer)
  }, [analytics, selectedMonth])

  const expenseCategories = analytics?.categoryBreakdown ?? []
  const paretoCutoff = useMemo(() => pareto.find(item => item.cumulativePct >= 80), [pareto])
  const lastUpdatedLabel = lastUpdatedAt
    ? new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(lastUpdatedAt))
    : 'Never'

  const scenarioConfidenceBand = forecastScenarios
    ? `${formatCurrency(forecastScenarios.optimistic)} - ${formatCurrency(forecastScenarios.pessimistic)}`
    : null

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto py-6 md:py-8 space-y-8 animate-fade-up">
        <section className="sticky top-2 z-30 glass-card rounded-2xl p-3 md:p-4 border border-white/15 backdrop-blur-xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:items-center lg:gap-3">
              <div className="min-w-44">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="h-9 bg-white/5 border-white/20">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map(month => (
                      <SelectItem key={month} value={month}>{formatMonth(month)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-44">
                <Select
                  value={compareMode}
                  onValueChange={(value) => setCompareMode(value as typeof compareMode)}
                >
                  <SelectTrigger className="h-9 bg-white/5 border-white/20">
                    <SelectValue placeholder="Compare mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="previous_month">Compare: Previous month</SelectItem>
                    <SelectItem value="avg_3m">Compare: 3M average</SelectItem>
                    <SelectItem value="avg_12m">Compare: 12M average</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">Last updated: {lastUpdatedLabel}</p>
              <Button variant="outline" size="sm" className="border-white/20 bg-white/5" onClick={refresh}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </section>

        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Analytics</p>
          <h1 className="display-serif text-3xl md:text-5xl font-semibold mt-1">Your next money decision</h1>
          <p className="text-sm text-muted-foreground mt-2">Decision-ready view for {formatMonth(selectedMonth)}.</p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="h-40 glass-card rounded-3xl animate-pulse" />
            <div className="h-64 glass-card rounded-3xl animate-pulse" />
          </div>
        ) : !analytics ? (
          <div className="text-center py-20 glass-card rounded-3xl">
            <div className="display-serif text-2xl text-muted-foreground italic">Not enough data yet</div>
            <p className="text-sm text-muted-foreground mt-2">Add a few transactions to see insights.</p>
          </div>
        ) : (
          <>
            <section className="space-y-4">
              <h2 className="text-xs uppercase tracking-widest text-muted-foreground">Decision Layer</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ExecutiveCard
                  icon={<Wallet className="h-4 w-4" />}
                  title="Runway"
                  value={
                    executiveSummary?.runwayMonths === null
                      ? 'Stable runway'
                      : `${executiveSummary?.runwayMonths?.toFixed(1) ?? '0.0'} months`
                  }
                  detail={
                    executiveSummary?.runwayMonths === null
                      ? 'Current net cashflow is non-negative.'
                      : 'Estimated at current monthly deficit pace.'
                  }
                />
                <ExecutiveCard
                  icon={(executiveSummary?.burnTrend.pct ?? 0) >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  title="Burn Trend (3M)"
                  value={formatPercent(executiveSummary?.burnTrend.pct)}
                  detail={`Slope: ${formatNumber(executiveSummary?.burnTrend.slope)}`}
                  status={(executiveSummary?.burnTrend.pct ?? 0) > 0 ? 'bad' : 'good'}
                />
                <ExecutiveCard
                  icon={<ArrowUpRight className="h-4 w-4" />}
                  title="Savings Rate"
                  value={formatPercent(executiveSummary?.savingsRatePct)}
                  detail="Income retained after expenses."
                  status={(executiveSummary?.savingsRatePct ?? 0) >= 0 ? 'good' : 'bad'}
                />
                <ExecutiveCard
                  icon={<ShieldAlert className="h-4 w-4" />}
                  title="Risk Score"
                  value={`${Math.round(executiveSummary?.risk.score ?? 0)}/100`}
                  detail={executiveSummary?.risk.reason ?? 'No risk reason available'}
                  status={(executiveSummary?.risk.score ?? 0) >= 70 ? 'bad' : (executiveSummary?.risk.score ?? 0) >= 45 ? 'neutral' : 'good'}
                />
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="display-serif text-2xl font-semibold">Forecast decision panel</h3>
                <p className="text-xs text-muted-foreground">Choose a scenario, then act on top drivers.</p>
              </div>
              <ForecastDecisionPanel forecastScenarios={forecastScenarios} confidenceBand={scenarioConfidenceBand} />
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="display-serif text-2xl font-semibold">Alert center</h3>
                <p className="text-xs text-muted-foreground">Top 3 only. Action-first.</p>
              </div>

              {hydratedSecondary ? (
                <div className="grid gap-3 md:grid-cols-3">
                  {alerts.length === 0 && (
                    <div className="md:col-span-3 rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                      No critical alert right now. Continue tracking forecast drivers.
                    </div>
                  )}
                  {alerts.map(alert => (
                    <div key={alert.id} className="glass-card rounded-2xl p-4 border border-white/10">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <p className="text-sm font-medium">{alert.title}</p>
                        <SeverityPill severity={alert.severity} />
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.explanation}</p>
                      <p className="text-xs mt-3 text-muted-foreground">Impact: {formatCurrency(alert.impact)}</p>
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" variant="outline" className="border-white/20 bg-white/5" onClick={() => setActiveAlert(alert)}>
                          {alert.action.label}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => dismissAlert(alert.id)}>Dismiss</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-32 glass-card rounded-2xl animate-pulse" />
              )}
            </section>

            <section className="space-y-4">
              <h2 className="text-xs uppercase tracking-widest text-muted-foreground">Insight Layer</h2>
              <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                <div className="glass-card rounded-3xl p-6">
                  <h3 className="display-serif text-2xl font-semibold mb-1">Spend composition</h3>
                  <p className="text-sm text-muted-foreground mb-6">Interpretable split of expense behavior.</p>
                  {spendComposition ? (
                    <>
                      <div className="space-y-3">
                        <CompositionRow label="Recurring" value={spendComposition.recurring} total={analytics.totals.expense} color="#22d3ee" />
                        <CompositionRow label="Variable" value={spendComposition.variable} total={analytics.totals.expense} color="#a7f3d0" />
                        <CompositionRow label="Discretionary" value={spendComposition.discretionary} total={analytics.totals.expense} color="#fb7185" />
                        <CompositionRow label="Contracted" value={spendComposition.contracted} total={analytics.totals.expense} color="#67e8f9" />
                      </div>
                      <div className="mt-5 rounded-xl border border-cyan-300/20 bg-cyan-500/10 p-4">
                        <p className="text-sm text-cyan-100">You are locked into {spendComposition.lockedPct.toFixed(1)}% of your spending.</p>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">Composition unavailable.</div>
                  )}
                </div>

                <div className="glass-card rounded-3xl p-6">
                  <h3 className="display-serif text-2xl font-semibold mb-1">Pareto categories</h3>
                  <p className="text-sm text-muted-foreground mb-6">See how quickly spend concentrates toward 80%.</p>
                  {pareto.length === 0 ? (
                    <div className="h-64 grid place-items-center text-muted-foreground italic">No category data.</div>
                  ) : (
                    <>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={pareto}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" vertical={false} />
                            <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${Number(v).toFixed(0)}%`} />
                            <Tooltip
                              contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12 }}
                              formatter={(value: number) => `${Number(value).toFixed(1)}%`}
                            />
                            <ReferenceLine y={80} stroke="#facc15" strokeDasharray="6 6" label={{ value: '80% cutoff', fill: '#facc15', fontSize: 11 }} />
                            <Bar dataKey="pct" fill="#22d3ee" radius={[6, 6, 0, 0]} />
                            <Line type="monotone" dataKey="cumulativePct" stroke="#fb7185" strokeWidth={2} dot={false} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        80% spend threshold reached at <span className="text-slate-100">{paretoCutoff?.category ?? 'n/a'}</span>.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xs uppercase tracking-widest text-muted-foreground">Legacy Layer</h2>
              {hydratedSecondary ? (
                <>
                  <div className="glass-card rounded-3xl p-6">
                    <h3 className="display-serif text-2xl font-semibold mb-1">Net money by month</h3>
                    <p className="text-sm text-muted-foreground mb-6">Your net position over time (income minus expenses).</p>
                    {netMoneyTrend.length === 0 ? (
                      <div className="h-64 grid place-items-center text-muted-foreground italic">Not enough historical data.</div>
                    ) : (
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={netMoneyTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" vertical={false} />
                            <ReferenceLine y={0} stroke="rgba(255,255,255,0.7)" strokeDasharray="6 6" strokeWidth={1.25} />
                            <XAxis
                              dataKey="month"
                              stroke="#94a3b8"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(value) => formatMonth(String(value))}
                            />
                            <YAxis
                              stroke="#94a3b8"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(value) => `$${Number(value).toFixed(0)}`}
                            />
                            <Tooltip
                              contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12 }}
                              labelFormatter={(value) => formatMonth(String(value))}
                              formatter={(value) => formatCurrency(Number(value ?? 0))}
                            />
                            <Line
                              type="monotone"
                              dataKey="net"
                              name="Net"
                              stroke="#22d3ee"
                              strokeWidth={2.5}
                              dot={{ r: 2 }}
                              activeDot={{ r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  <div className="glass-card rounded-3xl p-6">
                    <h3 className="display-serif text-2xl font-semibold mb-1">Comparison chart</h3>
                    <p className="text-sm text-muted-foreground mb-6">Comfort view: current period versus selected comparison baseline.</p>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparisonChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" vertical={false} />
                          <ReferenceLine y={0} stroke="rgba(255,255,255,0.9)" strokeDasharray="6 6" strokeWidth={1.5} />
                          <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                          <Tooltip
                            contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12 }}
                            labelStyle={{ color: '#e2e8f0' }}
                            formatter={(v) => formatCurrency(Number(v ?? 0))}
                          />
                          <Bar dataKey="current" name="Current" fill="#34d399" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="comparison" name="Comparison" fill="#fda4af" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="glass-card rounded-3xl p-6">
                    <h3 className="display-serif text-2xl font-semibold mb-1">Category pie</h3>
                    <p className="text-sm text-muted-foreground mb-6">Comfort view: where your expenses went this month.</p>
                    {expenseCategories.length === 0 ? (
                      <div className="h-64 grid place-items-center text-muted-foreground italic">No expenses yet</div>
                    ) : (
                      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={expenseCategories} dataKey="total" nameKey="category" innerRadius={60} outerRadius={100} paddingAngle={2}>
                                {expenseCategories.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                              </Pie>
                              <Tooltip
                                contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12 }}
                                formatter={(value) => formatCurrency(Number(value ?? 0))}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="space-y-2">
                          {expenseCategories.slice(0, 8).map((item, index) => {
                            const max = expenseCategories[0]?.total ?? 1
                            const pct = (item.total / max) * 100
                            return (
                              <div key={item.category} className="flex items-center gap-3">
                                <div className="text-xl w-8">{CATEGORY_EMOJI[item.category] ?? '📦'}</div>
                                <div className="flex-1">
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>{item.category}</span>
                                    <span className="mono tabular-nums text-muted-foreground">{formatCurrency(item.total)}</span>
                                  </div>
                                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: COLORS[index % COLORS.length] }} />
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="h-72 glass-card rounded-3xl animate-pulse" />
              )}
            </section>
          </>
        )}

        <Sheet
          open={Boolean(activeAlert)}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setActiveAlert(null)
            }
          }}
        >
          <SheetContent side="right" className="w-[92vw] sm:max-w-md">
            {activeAlert ? (
              <>
                <SheetHeader>
                  <SheetTitle>{activeAlert.title}</SheetTitle>
                  <SheetDescription>{activeAlert.explanation}</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4 text-sm">
                  <div className="rounded-xl border border-white/15 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Why it matters</p>
                    <p>Potential impact: {formatCurrency(activeAlert.impact)}.</p>
                  </div>
                  <div className="rounded-xl border border-cyan-300/20 bg-cyan-500/10 p-4">
                    <p className="text-xs uppercase tracking-widest text-cyan-100 mb-2">Suggested action</p>
                    <p className="text-cyan-50">{activeAlert.action.label}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => { acknowledgeAlert(activeAlert.id); setActiveAlert(null) }}>
                      Mark as reviewed
                    </Button>
                    <Button variant="outline" className="border-white/20" onClick={() => { dismissAlert(activeAlert.id); setActiveAlert(null) }}>
                      Dismiss
                    </Button>
                  </div>
                </div>
              </>
            ) : null}
          </SheetContent>
        </Sheet>
      </main>
    </div>
  )
}

function ExecutiveCard({
  icon,
  title,
  value,
  detail,
  status = 'neutral',
}: {
  icon: React.ReactNode
  title: string
  value: string
  detail: string
  status?: 'good' | 'bad' | 'neutral'
}) {
  const toneClass = status === 'good' ? 'text-emerald-200' : status === 'bad' ? 'text-rose-200' : 'text-slate-200'

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        {icon}
        {title}
      </div>
      <div className={`display-serif text-2xl mt-3 mono tabular-nums ${toneClass}`}>{value}</div>
      <p className="text-sm text-muted-foreground mt-2">{detail}</p>
    </div>
  )
}

function SeverityPill({ severity }: { severity: AnalyticsAlert['severity'] }) {
  const className =
    severity === 'critical'
      ? 'bg-rose-500/20 text-rose-100 border-rose-300/30'
      : severity === 'high'
        ? 'bg-orange-500/20 text-orange-100 border-orange-300/30'
        : severity === 'medium'
          ? 'bg-amber-500/20 text-amber-100 border-amber-300/30'
          : 'bg-emerald-500/20 text-emerald-100 border-emerald-300/30'

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${className}`}>
      <AlertTriangle className="h-3 w-3" />
      {severity}
    </span>
  )
}

function ForecastDecisionPanel({
  forecastScenarios,
  confidenceBand,
}: {
  forecastScenarios: ForecastScenarios | null
  confidenceBand: string | null
}) {
  if (!forecastScenarios) {
    return (
      <div className="glass-card rounded-3xl p-6">
        <p className="text-sm text-muted-foreground">Forecast is unavailable right now.</p>
      </div>
    )
  }

  const previousReference =
    forecastScenarios.deltaFromPrevious === undefined
      ? null
      : forecastScenarios.base / (1 + forecastScenarios.deltaFromPrevious / 100)

  const scenarios = [
    { key: 'base', label: 'Base', value: forecastScenarios.base },
    { key: 'optimistic', label: 'Optimistic', value: forecastScenarios.optimistic },
    { key: 'pessimistic', label: 'Pessimistic', value: forecastScenarios.pessimistic },
  ] as const

  return (
    <div className="glass-card rounded-3xl p-6">
      <Tabs defaultValue="base">
        <TabsList className="bg-white/5 border border-white/10">
          {scenarios.map(scenario => (
            <TabsTrigger key={scenario.key} value={scenario.key}>{scenario.label}</TabsTrigger>
          ))}
        </TabsList>

        {scenarios.map(scenario => {
          const delta = previousReference && previousReference > 0
            ? ((scenario.value - previousReference) / previousReference) * 100
            : null

          return (
            <TabsContent key={scenario.key} value={scenario.key} className="mt-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-4">
                  <p className="text-xs uppercase tracking-widest text-cyan-200">Value</p>
                  <p className="display-serif text-3xl mt-2 text-cyan-100">{formatCurrency(scenario.value)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Delta vs last forecast</p>
                  <p className="text-xl mt-2 mono tabular-nums">{formatPercent(delta)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Confidence band</p>
                  <p className="text-sm mt-2 text-slate-100">{confidenceBand ?? 'n/a'}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Confidence score</p>
                  <p className="text-xl mt-2 mono tabular-nums">{Math.round(forecastScenarios.confidence * 100)}%</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Drivers (top 3)</p>
                {forecastScenarios.drivers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No scenario drivers available yet.</p>
                ) : (
                  <div className="space-y-2">
                    {forecastScenarios.drivers.map(driver => (
                      <div key={driver.category} className="flex items-center justify-between text-sm">
                        <span>{driver.category}</span>
                        <span className="mono tabular-nums text-muted-foreground">{formatCurrency(driver.impact)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}

function CompositionRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="mono tabular-nums text-muted-foreground">{formatCurrency(value)} ({pct.toFixed(1)}%)</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'n/a'
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'n/a'
  return value.toFixed(2)
}

export default AnalyticsPage
