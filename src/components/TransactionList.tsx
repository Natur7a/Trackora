import { useState } from 'react'
import type { FinanceTransaction, TransactionFormData } from '../types'
import { TransactionForm } from './TransactionForm'

interface TransactionListProps {
  transactions: FinanceTransaction[]
  loading: boolean
  onDelete: (id: string) => Promise<{ error: string | null }>
  onUpdate: (id: string, data: TransactionFormData) => Promise<{ error: string | null }>
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export function TransactionList({ transactions, loading, onDelete, onUpdate }: TransactionListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return
    setDeleteError(null)
    const { error } = await onDelete(id)
    if (error) setDeleteError(error)
  }

  const handleUpdate = async (id: string, data: TransactionFormData) => {
    const result = await onUpdate(id, data)
    if (!result.error) setEditingId(null)
    return result
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">Loading transactions...</div>
      </div>
    )
  }

  return (
    <div>
      {deleteError && (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 mb-4">
          {deleteError}
        </div>
      )}

      {transactions.length === 0 ? (
        <div className="text-center py-12 text-slate-300 bg-white/5 border border-white/10 rounded-2xl">
          <div className="text-4xl mb-3">$</div>
          <p>No transactions yet. Add your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map(tx => (
            <div key={tx.id} className="bg-white/5 border border-white/10 rounded-2xl shadow-sm overflow-hidden">
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
                    onSubmit={(data) => handleUpdate(tx.id, data)}
                    onCancel={() => setEditingId(null)}
                    submitLabel="Save Changes"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${tx.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <div className="font-semibold text-slate-100 text-sm">{tx.category}</div>
                      <div className="text-xs text-slate-400">
                        {tx.date}{tx.note ? ` · ${tx.note}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold text-sm ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                    </span>
                    <button
                      onClick={() => setEditingId(tx.id)}
                      className="text-xs text-cyan-300 hover:text-cyan-200 font-medium px-2 py-1 rounded hover:bg-cyan-500/10 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="text-xs text-rose-300 hover:text-rose-200 font-medium px-2 py-1 rounded hover:bg-rose-500/10 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
