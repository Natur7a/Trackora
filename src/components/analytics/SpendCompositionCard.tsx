import { formatCurrency } from '../../lib/format'
import type { SpendComposition } from '../../types'

type SpendCompositionCardProps = {
  spendComposition: SpendComposition | null
  totalExpense: number
}

export function SpendCompositionCard({ spendComposition, totalExpense }: SpendCompositionCardProps) {
  return (
    <div className="glass-card rounded-3xl p-6">
      <h3 className="display-serif text-2xl font-semibold mb-1">Spend composition</h3>
      <p className="text-sm text-muted-foreground mb-6">Interpretable split of expense behavior.</p>
      {spendComposition ? (
        <>
          <div className="space-y-3">
            <CompositionRow label="Recurring" value={spendComposition.recurring} total={totalExpense} color="#22d3ee" />
            <CompositionRow label="Variable" value={spendComposition.variable} total={totalExpense} color="#a7f3d0" />
            <CompositionRow label="Discretionary" value={spendComposition.discretionary} total={totalExpense} color="#fb7185" />
            <CompositionRow label="Contracted" value={spendComposition.contracted} total={totalExpense} color="#67e8f9" />
          </div>
          <div className="mt-5 rounded-xl border border-cyan-300/20 bg-cyan-500/10 p-4">
            <p className="text-sm text-cyan-100">You are locked into {spendComposition.lockedPct.toFixed(1)}% of your spending.</p>
          </div>
        </>
      ) : (
        <div className="text-sm text-muted-foreground">Composition unavailable.</div>
      )}
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
