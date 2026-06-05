import { AlertTriangle } from 'lucide-react'
import { Button } from '../ui/button'
import { formatCurrency } from '../../lib/format'
import type { AnalyticsAlert } from '../../types'

type AlertCenterProps = {
  alerts: AnalyticsAlert[]
  hydrated: boolean
  onOpenAlert: (alert: AnalyticsAlert) => void
  onDismissAlert: (id: string) => void
}

export function AlertCenter({ alerts, hydrated, onOpenAlert, onDismissAlert }: AlertCenterProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="display-serif text-2xl font-semibold">Alert center</h3>
        <p className="text-xs text-muted-foreground">Top 3 only. Action-first.</p>
      </div>

      {hydrated ? (
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
                <Button size="sm" variant="outline" className="border-white/20 bg-white/5" onClick={() => onOpenAlert(alert)}>
                  {alert.action.label}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onDismissAlert(alert.id)}>Dismiss</Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-32 glass-card rounded-2xl animate-pulse" />
      )}
    </section>
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
