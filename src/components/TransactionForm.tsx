import { useState } from 'react'
import type { TransactionFormData } from '../types'
import { CATEGORIES } from '../types'

interface TransactionFormProps {
  initial?: TransactionFormData
  onSubmit: (data: TransactionFormData) => Promise<{ error: string | null }>
  onCancel?: () => void
  submitLabel?: string
}

const defaultForm: TransactionFormData = {
  amount: '',
  type: 'expense',
  category: 'Other',
  date: new Date().toISOString().split('T')[0],
  note: '',
}

export function TransactionForm({ initial, onSubmit, onCancel, submitLabel = 'Add Transaction' }: TransactionFormProps) {
  const [form, setForm] = useState<TransactionFormData>(initial ?? defaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError(null)
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    if (!form.amount || isNaN(amount) || amount <= 0) {
      setError('Please enter a valid positive amount.')
      return
    }
    if (!form.date) {
      setError('Please select a date.')
      return
    }
    setSubmitting(true)
    const { error } = await onSubmit(form)
    setSubmitting(false)
    if (error) {
      setError(error)
    } else {
      setSuccess(true)
      if (!initial) setForm(defaultForm)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}
      {success && !initial && (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Transaction added successfully!
        </div>
      )}

      <div>
        <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Amount *</label>
        <input
          type="number"
          name="amount"
          value={form.amount}
          onChange={handleChange}
          placeholder="0.00"
          min="0.01"
          step="0.01"
          required
          className="w-full border border-white/15 bg-white/5 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Type *</label>
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="w-full border border-white/15 bg-white/5 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
        >
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Category *</label>
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="w-full border border-white/15 bg-white/5 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
        >
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Date *</label>
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          required
          className="w-full border border-white/15 bg-white/5 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Note</label>
        <textarea
          name="note"
          value={form.note}
          onChange={handleChange}
          placeholder="Optional note..."
          rows={2}
          className="w-full border border-white/15 bg-white/5 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-300/60 resize-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 hover:opacity-90 disabled:opacity-70 font-semibold py-2 px-4 rounded-xl text-sm transition"
        >
          {submitting ? 'Saving...' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-white/10 hover:bg-white/20 text-slate-100 font-medium py-2 px-4 rounded-xl text-sm transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
