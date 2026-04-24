interface BalanceSummaryProps {
  income: number
  expense: number
  balance: number
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export function BalanceSummary({ income, expense, balance }: BalanceSummaryProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <article className="glass-card rounded-3xl p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Income</p>
        <p className="text-2xl font-semibold text-emerald-300 mt-3">{fmt(income)}</p>
      </article>
      <article className="glass-card rounded-3xl p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Expense</p>
        <p className="text-2xl font-semibold text-rose-300 mt-3">{fmt(expense)}</p>
      </article>
      <article className="glass-card rounded-3xl p-5 sm:col-span-2 lg:col-span-1">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Balance</p>
        <p className={`text-2xl font-semibold mt-3 ${balance >= 0 ? 'text-cyan-300' : 'text-rose-300'}`}>
          {fmt(balance)}
        </p>
      </article>
    </section>
  )
}
