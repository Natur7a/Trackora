import { useMemo, useState } from 'react'
import { Navbar } from '../components/Navbar'
import { BalanceSummary } from '../components/BalanceSummary'
import { TransactionForm } from '../components/TransactionForm.tsx'
import { TransactionList } from '../components/TransactionList.tsx'
import { ImportTransactionsDialog } from '../components/ImportTransactionsDialog'
import { ExportTransactionsButton } from '../components/ExportTransactionsButton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { useTransactions } from '../hooks/useTransactions'

function formatMonthLabel(ym: string) {
  const [year, month] = ym.split('-')
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export function DashboardPage() {
  const { transactions, loading, error, income, expense, balance, add, update, remove, importTransactions } = useTransactions()
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const availableMonths = useMemo(() => {
    const months = new Set(transactions.map((tx) => tx.date.slice(0, 7)))
    return Array.from(months).sort().reverse()
  }, [transactions])

  const availableCategories = useMemo(() => {
    const cats = new Set(transactions.map((tx) => tx.category))
    return Array.from(cats).sort()
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (selectedMonth !== 'all' && !tx.date.startsWith(selectedMonth)) return false
      if (selectedCategory !== 'all' && tx.category !== selectedCategory) return false
      return true
    })
  }, [transactions, selectedMonth, selectedCategory])

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto py-10 space-y-10 animate-fade-up">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Dashboard</p>
          <h1 className="display-serif text-4xl md:text-5xl font-semibold mt-1">Your finance journal</h1>
        </div>

        <BalanceSummary income={income} expense={expense} balance={balance} />

        {error && (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="lg:sticky lg:top-24 self-start">
            <div className="glass-card rounded-3xl p-6">
              <h2 className="display-serif text-xl font-semibold mb-4">Add transaction</h2>
              <TransactionForm onSubmit={add} transactions={transactions} />
            </div>
          </aside>

          <section>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="display-serif text-2xl font-semibold">Recent activity</h2>
              <div className="flex items-center gap-3">
                <ImportTransactionsDialog transactions={transactions} onImport={importTransactions} />
                <ExportTransactionsButton transactions={filteredTransactions} />
                <span className="text-sm text-muted-foreground">{filteredTransactions.length} {filteredTransactions.length === 1 ? 'entry' : 'entries'}</span>
              </div>
            </div>

            {!loading && transactions.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="h-8 w-auto min-w-[130px] bg-white/5 border-white/10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All months</SelectItem>
                    {availableMonths.map((m) => (
                      <SelectItem key={m} value={m}>{formatMonthLabel(m)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-8 w-auto min-w-[130px] bg-white/5 border-white/10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {availableCategories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <TransactionList transactions={filteredTransactions} loading={loading} onUpdate={update} onDelete={remove} />
          </section>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
