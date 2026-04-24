import { Navbar } from '../components/Navbar'
import { BalanceSummary } from '../components/BalanceSummary'
import { TransactionForm } from '../components/TransactionForm.tsx'
import { TransactionList } from '../components/TransactionList.tsx'
import { useTransactions } from '../hooks/useTransactions'

export function DashboardPage() {
  const { transactions, loading, error, income, expense, balance, add, update, remove } = useTransactions()

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
              <TransactionForm onSubmit={add} />
            </div>
          </aside>

          <section>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="display-serif text-2xl font-semibold">Recent activity</h2>
              <span className="text-sm text-muted-foreground">{transactions.length} {transactions.length === 1 ? 'entry' : 'entries'}</span>
            </div>
            <TransactionList transactions={transactions} loading={loading} onUpdate={update} onDelete={remove} />
          </section>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
