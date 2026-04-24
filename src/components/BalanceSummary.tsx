interface BalanceSummaryProps {
  income: number
  expense: number
  balance: number
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export function BalanceSummary({ income, expense, balance }: BalanceSummaryProps) {
  const savingsRate = income > 0 ? Math.max(0, Math.min(100, Math.round((balance / income) * 100))) : 0

  return (
    <section className="space-y-4">
      <article className="glass-card rounded-3xl p-6 md:p-8 bg-gradient-to-r from-emerald-500/15 via-cyan-500/8 to-transparent">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Current Balance</p>
        <p className="display-serif text-5xl md:text-6xl mt-2 mono tabular-nums">{fmt(balance)}</p>
      </article>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="glass-card rounded-2xl p-4">
          <p className="text-xs uppercase tracking-widest text-emerald-300">Income</p>
          <p className="display-serif text-4xl mt-1 mono tabular-nums">{fmt(income)}</p>
        </article>
        <article className="glass-card rounded-2xl p-4">
          <p className="text-xs uppercase tracking-widest text-orange-300">Expenses</p>
          <p className="display-serif text-4xl mt-1 mono tabular-nums">{fmt(expense)}</p>
        </article>
        <article className="glass-card rounded-2xl p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Savings Rate</p>
          <p className="display-serif text-4xl mt-1 mono tabular-nums">{savingsRate}%</p>
        </article>
      </div>
    </section>
  )
}
