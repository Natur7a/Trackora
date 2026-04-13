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

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = income - expense

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
        <div className="text-gray-500">Loading transactions...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <div className="text-xs text-green-600 font-medium uppercase tracking-wide">Income</div>
          <div className="text-xl font-bold text-green-700 mt-1">{fmt(income)}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <div className="text-xs text-red-600 font-medium uppercase tracking-wide">Expenses</div>
          <div className="text-xl font-bold text-red-700 mt-1">{fmt(expense)}</div>
        </div>
        <div className={`${balance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'} border rounded-xl p-4 text-center`}>
          <div className={`text-xs font-medium uppercase tracking-wide ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Balance</div>
          <div className={`text-xl font-bold mt-1 ${balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{fmt(balance)}</div>
        </div>
      </div>

      {deleteError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {deleteError}
        </div>
      )}

      {transactions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-3">💸</div>
          <p>No transactions yet. Add your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map(tx => (
            <div key={tx.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              {editingId === tx.id ? (
                <div className="p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Edit Transaction</h4>
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
                      <div className="font-semibold text-gray-800 text-sm">{tx.category}</div>
                      <div className="text-xs text-gray-500">
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
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
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
