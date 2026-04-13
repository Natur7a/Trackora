import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { FinanceTransaction, TransactionFormData } from '../types'

export function useTransactions(userId: string | undefined) {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('FinanceTransactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
    if (error) {
      setError(error.message)
    } else {
      setTransactions(data as FinanceTransaction[])
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const addTransaction = async (formData: TransactionFormData) => {
    if (!userId) return { error: 'Not authenticated' }
    const { error } = await supabase.from('FinanceTransactions').insert({
      user_id: userId,
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

  return { transactions, loading, error, addTransaction, updateTransaction, deleteTransaction, refetch: fetchTransactions }
}
