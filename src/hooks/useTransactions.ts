import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { FinanceTransaction, TransactionFormData } from '../types'

export function useTransactions(userId?: string) {
  const { user } = useAuth()
  const activeUserId = userId ?? user?.id

  const [transactions, setTransactions] = useState<FinanceTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    if (!activeUserId) return
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('FinanceTransactions')
      .select('*')
      .eq('user_id', activeUserId)
      .order('date', { ascending: false })
    if (error) {
      setError(error.message)
    } else {
      setTransactions(data as FinanceTransaction[])
    }
    setLoading(false)
  }, [activeUserId])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const addTransaction = async (formData: TransactionFormData) => {
    if (!activeUserId) return { error: 'Not authenticated' }
    const { error } = await supabase.from('FinanceTransactions').insert({
      user_id: activeUserId,
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: formData.category,
      date: formData.date,
      note: formData.note || null,
    })
    if (error) return { error: error.message }
    await fetchTransactions()
    return { error: null }
  }

  const updateTransaction = async (id: string, formData: TransactionFormData) => {
    const { error } = await supabase
      .from('FinanceTransactions')
      .update({
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        date: formData.date,
        note: formData.note || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (error) return { error: error.message }
    await fetchTransactions()
    return { error: null }
  }

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase
      .from('FinanceTransactions')
      .delete()
      .eq('id', id)
    if (error) return { error: error.message }
    await fetchTransactions()
    return { error: null }
  }

  const income = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const expense = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const balance = income - expense

  return {
    transactions,
    loading,
    error,
    income,
    expense,
    balance,
    add: addTransaction,
    update: updateTransaction,
    remove: deleteTransaction,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: fetchTransactions,
  }
}
