import { useState } from 'react'
import type { FinanceTransaction, TransactionFormData } from '../types'
import { CATEGORY_EMOJI } from '../types/finance'
import { TransactionForm } from './TransactionForm'

interface TransactionListProps {
  transactions: FinanceTransaction[]
  loading: boolean
  onDelete: (id: string) => Promise<{ error: string | null }>
  onUpdate: (id: string, data: TransactionFormData) => Promise<{ error: string | null }>
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

function formatDateLabel(date: string) {
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return date

  return parsed.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

export function TransactionList({ transactions, loading, onDelete, onUpdate }: TransactionListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return

    setDeleteError(null)
    const result = await onDelete(id)
    if (result.error) {
      setDeleteError(result.error)
    }
  }

  const handleUpdate = async (id: string, data: TransactionFormData) => {
    const result = await onUpdate(id, data)
    if (!result.error) {
      setEditingId(null)
    }
    return result
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-slate-300 bg-white/5 border border-white/10 rounded-2xl">
        <div className="text-4xl mb-3">$</div>
        <p>No transactions yet. Add your first one!</p>
      </div>
    )
  }

  const grouped = transactions.reduce<Record<string, FinanceTransaction[]>>((acc, tx) => {
    if (!acc[tx.date]) {
      acc[tx.date] = []
    }
    acc[tx.date].push(tx)
    return acc
  }, {})

  const groupedEntries = Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a))

  return (
    <div>
      {deleteError && (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 mb-4">
          {deleteError}
        </div>
      )}

      <div className="space-y-6">
        {groupedEntries.map(([date, items]) => (
          <div key={date}>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 px-2">
              {formatDateLabel(date)}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl shadow-sm overflow-hidden">
              {items.map((tx) => (
                <div key={tx.id} className="border-b last:border-b-0 border-white/5">
                  {editingId === tx.id ? (
                    <div className="p-4">
                      <h4 className="text-sm font-semibold text-slate-200 mb-3">Edit Transaction</h4>
                      <TransactionForm
                        initial={{
                          amount: String(tx.amount),
                          type: tx.type,
                          category: tx.category,
                          date: tx.date,
                          note: tx.note ?? '',
                        }}
                        submitLabel="Save changes"
                        onCancel={() => setEditingId(null)}
                        onSubmit={(data) => handleUpdate(tx.id, data)}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`h-10 w-10 rounded-xl flex items-center justify-center text-base shrink-0 ${
                            tx.type === 'income'
                              ? 'bg-emerald-400/10 border border-emerald-400/30'
                              : 'bg-orange-400/10 border border-orange-400/30'
                          }`}
                        >
                          {CATEGORY_EMOJI[tx.category] ?? '📦'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-100 text-sm truncate">{tx.category}</div>
                          <div className="text-xs text-slate-400 truncate">{tx.note || tx.date}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`font-bold text-sm mono ${tx.type === 'income' ? 'text-emerald-300' : 'text-orange-300'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                        <button
                          onClick={() => setEditingId(tx.id)}
                          className="text-[11px] text-cyan-300 hover:text-cyan-200 font-medium px-2 py-1 rounded hover:bg-cyan-500/10 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="text-[11px] text-rose-300 hover:text-rose-200 font-medium px-2 py-1 rounded hover:bg-rose-500/10 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
