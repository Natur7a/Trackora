import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ParetoRow } from '../../types'

type ParetoAnalysisCardProps = {
  pareto: ParetoRow[]
}

export function ParetoAnalysisCard({ pareto }: ParetoAnalysisCardProps) {
  const paretoCutoff = pareto.find(item => item.cumulativePct >= 80)

  return (
    <div className="glass-card rounded-3xl p-6">
      <h3 className="display-serif text-2xl font-semibold mb-1">Pareto categories</h3>
      <p className="text-sm text-muted-foreground mb-6">See how quickly spend concentrates toward 80%.</p>
      {pareto.length === 0 ? (
        <div className="h-64 grid place-items-center text-muted-foreground italic">No category data.</div>
      ) : (
        <>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={pareto}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" vertical={false} />
                <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${Number(v).toFixed(0)}%`} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12 }}
                  formatter={(value: number) => `${Number(value).toFixed(1)}%`}
                />
                <ReferenceLine y={80} stroke="#facc15" strokeDasharray="6 6" label={{ value: '80% cutoff', fill: '#facc15', fontSize: 11 }} />
                <Bar dataKey="pct" fill="#22d3ee" radius={[6, 6, 0, 0]} />
                <Line type="monotone" dataKey="cumulativePct" stroke="#fb7185" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            80% spend threshold reached at <span className="text-slate-100">{paretoCutoff?.category ?? 'n/a'}</span>.
          </p>
        </>
      )}
    </div>
  )
}
