import { useState } from 'react'
import { Navbar } from '../components/Navbar'
import { TransactionForm } from '../components/TransactionForm'
import { TransactionList } from '../components/TransactionList'
import { useAuth } from '../context/AuthContext'
import { useTransactions } from '../hooks/useTransactions'

type View = 'add' | 'list'

export function DashboardPage() {
  const { user } = useAuth()
  const { transactions, loading, error, addTransaction, updateTransaction, deleteTransaction } = useTransactions(user?.id)
  const [view, setView] = useState<View>('add')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Finance Dashboard</h2>

        {/* View Toggle */}
        <div className="flex rounded-lg bg-gray-200 p-1 mb-6">
          <button
            onClick={() => setView('add')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${view === 'add' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-800'}`}
          >
            + Add Transaction
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${view === 'list' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-800'}`}
          >
            📋 Transactions ({transactions.length})
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {view === 'add' ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">New Transaction</h3>
            <TransactionForm onSubmit={addTransaction} />
          </div>
        ) : (
          <TransactionList
            transactions={transactions}
            loading={loading}
            onDelete={deleteTransaction}
            onUpdate={updateTransaction}
          />
        )}
      </main>
    </div>
  )
}
