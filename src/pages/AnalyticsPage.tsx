import { Navbar } from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { useMonthlyAnalytics } from '../hooks/useMonthlyAnalytics'
import { formatCurrency } from '../lib/format'
import { CATEGORY_EMOJI } from '../types/finance'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { TrendingDown, TrendingUp } from 'lucide-react'

const COLORS = ['#34d399', '#22d3ee', '#fda4af', '#67e8f9', '#a7f3d0', '#5eead4', '#fb7185', '#2dd4bf']

export function AnalyticsPage() {
  const { user } = useAuth()
  const { analytics, forecast, loading, error } = useMonthlyAnalytics(user?.id)

  const current = analytics?.monthComparison.current
  const previous = analytics?.monthComparison.previous

  const expenseDelta = current && previous && previous.expense > 0
    ? ((current.expense - previous.expense) / previous.expense) * 100
    : null

  const incomeDelta = current && previous && previous.income > 0
    ? ((current.income - previous.income) / previous.income) * 100
    : null

  const expenseCategories = analytics?.categoryBreakdown ?? []
  const comparisonChartData = (analytics?.comparisonChart.labels ?? []).map((label, i) => ({
    label,
    current: analytics?.comparisonChart.current[i] ?? 0,
    previous: analytics?.comparisonChart.previous[i] ?? 0,
  }))

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto py-10 space-y-10 animate-fade-up">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Analytics</p>
          <h1 className="display-serif text-4xl md:text-5xl font-semibold mt-1">The story of your money</h1>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="h-96 glass-card rounded-3xl animate-pulse" />
        ) : !analytics ? (
          <div className="text-center py-20 glass-card rounded-3xl">
            <div className="display-serif text-2xl text-muted-foreground italic">Not enough data yet</div>
            <p className="text-sm text-muted-foreground mt-2">Add a few transactions to see insights.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <DeltaCard label="Income vs previous" amount={current?.income ?? 0} delta={incomeDelta} positive />
              <DeltaCard label="Expenses vs previous" amount={current?.expense ?? 0} delta={expenseDelta} positive={false} />
            </div>

            <PredictionCard forecast={forecast} />

            <div className="glass-card rounded-3xl p-6">
              <h2 className="display-serif text-2xl font-semibold mb-1">Comparison chart</h2>
              <p className="text-sm text-muted-foreground mb-6">Current period versus previous period by metric.</p>
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
                    <Bar dataKey="previous" name="Previous" fill="#fda4af" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
              <div className="glass-card rounded-3xl p-6">
                <h2 className="display-serif text-2xl font-semibold mb-1">Where it went</h2>
                <p className="text-sm text-muted-foreground mb-6">Expense breakdown this month.</p>
                {expenseCategories.length === 0 ? (
                  <div className="h-64 grid place-items-center text-muted-foreground italic">No expenses yet</div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={expenseCategories} dataKey="total" nameKey="category" innerRadius={60} outerRadius={100} paddingAngle={2}>
                          {expenseCategories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12 }}
                          formatter={(v) => formatCurrency(Number(v ?? 0))}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="glass-card rounded-3xl p-6">
                <h2 className="display-serif text-2xl font-semibold mb-1">Top categories</h2>
                <p className="text-sm text-muted-foreground mb-6">This month, by spend.</p>
                <div className="space-y-2">
                  {expenseCategories.slice(0, 8).map((item, i) => {
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
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {expenseCategories.length === 0 && (
                    <div className="text-muted-foreground italic text-center py-8">No data</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function DeltaCard({ label, amount, delta, positive }: { label: string; amount: number; delta: number | null; positive: boolean }) {
  const Icon = (delta ?? 0) >= 0 ? TrendingUp : TrendingDown
  const good = positive ? (delta ?? 0) >= 0 : (delta ?? 0) <= 0
  const color = delta === null ? 'text-muted-foreground' : good ? 'text-emerald-300' : 'text-rose-300'

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="display-serif text-3xl mt-2 mono tabular-nums">{formatCurrency(amount)}</div>
      <div className={`flex items-center gap-1 mt-2 text-sm ${color}`}>
        <Icon className="h-4 w-4" />
        <span className="mono">
          {delta === null ? 'No prior month' : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`}
        </span>
      </div>
    </div>
  )
}

function PredictionCard({ forecast }: { forecast: ReturnType<typeof useMonthlyAnalytics>['forecast'] }) {
  if (!forecast) {
    return (
      <div className="glass-card rounded-3xl p-6">
        <h2 className="display-serif text-2xl font-semibold mb-1">Prediction</h2>
        <p className="text-sm text-muted-foreground">Prediction is unavailable right now.</p>
      </div>
    )
  }

  if (forecast.isInsufficientData) {
    return (
      <div className="glass-card rounded-3xl p-6">
        <h2 className="display-serif text-2xl font-semibold mb-3">Prediction</h2>
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {forecast.message}
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-3xl p-6">
      <h2 className="display-serif text-2xl font-semibold mb-1">Prediction</h2>
      <p className="text-sm text-muted-foreground mb-6">Expected expense for {forecast.month}.</p>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-4">
          <p className="text-xs uppercase tracking-widest text-cyan-200">Predicted Expense</p>
          <p className="display-serif text-3xl mt-2 text-cyan-100">{formatCurrency(forecast.predictedExpense)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Confidence</p>
          <p className="text-xl mt-2 capitalize">{forecast.confidence.level}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Range</p>
          <p className="mono mt-2 text-slate-200">
            {formatCurrency(forecast.confidence.lower)} - {formatCurrency(forecast.confidence.upper)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage
