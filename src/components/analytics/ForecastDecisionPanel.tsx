import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { formatCurrency } from '../../lib/format'
import type { ForecastScenarios } from '../../types'

type ForecastDecisionPanelProps = {
  forecastScenarios: ForecastScenarios | null
}

export function ForecastDecisionPanel({ forecastScenarios }: ForecastDecisionPanelProps) {
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

  const confidenceBand = `${formatCurrency(forecastScenarios.optimistic)} - ${formatCurrency(forecastScenarios.pessimistic)}`

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
                  <p className="text-sm mt-2 text-slate-100">{confidenceBand}</p>
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

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'n/a'
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}
