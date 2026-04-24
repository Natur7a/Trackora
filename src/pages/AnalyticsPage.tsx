import { Navbar } from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { useMonthlyAnalytics } from '../hooks/useMonthlyAnalytics'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value)
}

function formatChange(value: number) {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${formatCurrency(value)}`
}

export function AnalyticsPage() {
  const { user } = useAuth()
  const { selectedMonth, setSelectedMonth, analytics, forecast, loading, error } = useMonthlyAnalytics(user?.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Monthly Analytics</h2>
            <p className="text-gray-600 text-sm mt-1">Track totals, category spending, and month-over-month changes.</p>
          </div>
          <div>
            <label htmlFor="month" className="block text-sm text-gray-600 mb-1">Month</label>
            <input
              id="month"
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-gray-500 text-sm">
            Loading analytics...
          </div>
        )}

        {!loading && analytics && (
          <>
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Next Month Expense Forecast</h3>

              {!forecast ? (
                <p className="text-sm text-gray-500">Forecast is unavailable right now.</p>
              ) : forecast.isInsufficientData ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">{forecast.message}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
                      <p className="text-xs uppercase text-blue-700">Predicted Expense ({forecast.month})</p>
                      <p className="text-2xl font-bold text-blue-900 mt-2">{formatCurrency(forecast.predictedExpense)}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
                      <p className="text-xs uppercase text-gray-600">Confidence Level</p>
                      <p className="text-xl font-bold text-gray-900 mt-2 capitalize">{forecast.confidence.level}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
                      <p className="text-xs uppercase text-gray-600">Confidence Range</p>
                      <p className="text-sm font-semibold text-gray-900 mt-2">
                        {formatCurrency(forecast.confidence.lower)} - {formatCurrency(forecast.confidence.upper)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 mb-2">Trend Factor</p>
                      <p className="text-sm text-gray-700">
                        Direction: <span className="font-medium capitalize">{forecast.factors.trendDirection}</span>
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        Change rate: <span className="font-medium">{forecast.factors.trendPercent.toFixed(2)}%</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-2">Based on {forecast.dataPoints} months of expense history.</p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-800 mb-2">Top Influencing Categories</p>
                      {forecast.factors.topCategories.length === 0 ? (
                        <p className="text-sm text-gray-500">No category signal available yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {forecast.factors.topCategories.map(item => (
                            <div key={item.category} className="flex items-center justify-between text-sm">
                              <span className="text-gray-700">{item.category}</span>
                              <span className="font-medium text-gray-900">
                                {formatCurrency(item.average)} ({item.sharePercent.toFixed(1)}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <p className="text-xs uppercase text-gray-500">Income</p>
                <p className="text-2xl font-bold text-emerald-600 mt-2">{formatCurrency(analytics.totals.income)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <p className="text-xs uppercase text-gray-500">Expense</p>
                <p className="text-2xl font-bold text-rose-600 mt-2">{formatCurrency(analytics.totals.expense)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <p className="text-xs uppercase text-gray-500">Net Balance</p>
                <p className={`text-2xl font-bold mt-2 ${analytics.totals.net >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                  {formatCurrency(analytics.totals.net)}
                </p>
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Spending by Category</h3>
                {analytics.categoryBreakdown.length === 0 ? (
                  <p className="text-sm text-gray-500">No expenses recorded for this month.</p>
                ) : (
                  <div className="space-y-3">
                    {analytics.categoryBreakdown.map(item => (
                      <div key={item.category}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-700">{item.category}</span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(item.total)} ({item.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${Math.min(item.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Month-over-Month</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <p className="text-gray-500">Metric</p>
                    <p className="text-gray-500">Current</p>
                    <p className="text-gray-500">Previous</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm border-t border-gray-100 pt-3">
                    <p className="font-medium text-gray-800">Income</p>
                    <p className="text-emerald-700">{formatCurrency(analytics.monthComparison.current.income)}</p>
                    <p className="text-gray-700">{formatCurrency(analytics.monthComparison.previous.income)}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <p className="font-medium text-gray-800">Expense</p>
                    <p className="text-rose-700">{formatCurrency(analytics.monthComparison.current.expense)}</p>
                    <p className="text-gray-700">{formatCurrency(analytics.monthComparison.previous.expense)}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <p className="font-medium text-gray-800">Net</p>
                    <p className={analytics.monthComparison.current.net >= 0 ? 'text-blue-700' : 'text-rose-700'}>
                      {formatCurrency(analytics.monthComparison.current.net)}
                    </p>
                    <p className={analytics.monthComparison.previous.net >= 0 ? 'text-gray-700' : 'text-rose-700'}>
                      {formatCurrency(analytics.monthComparison.previous.net)}
                    </p>
                  </div>

                  <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                    <p className="font-medium text-gray-800">Change vs Previous Month</p>
                    <p className="text-gray-700">Income: <span className={analytics.monthComparison.change.income >= 0 ? 'text-emerald-700' : 'text-rose-700'}>{formatChange(analytics.monthComparison.change.income)}</span></p>
                    <p className="text-gray-700">Expense: <span className={analytics.monthComparison.change.expense <= 0 ? 'text-emerald-700' : 'text-rose-700'}>{formatChange(analytics.monthComparison.change.expense)}</span></p>
                    <p className="text-gray-700">Net: <span className={analytics.monthComparison.change.net >= 0 ? 'text-emerald-700' : 'text-rose-700'}>{formatChange(analytics.monthComparison.change.net)}</span></p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
