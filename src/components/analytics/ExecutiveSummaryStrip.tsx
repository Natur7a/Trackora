import { ArrowDownRight, ArrowUpRight, ShieldAlert, Wallet } from 'lucide-react'
import type { ExecutiveSummary } from '../../types'

type ExecutiveSummaryStripProps = {
  executiveSummary: ExecutiveSummary | null
}

export function ExecutiveSummaryStrip({ executiveSummary }: ExecutiveSummaryStripProps) {
  return (
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

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'n/a'
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'n/a'
  return value.toFixed(2)
}
