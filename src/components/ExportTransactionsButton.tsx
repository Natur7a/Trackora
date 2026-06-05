import { Download } from 'lucide-react'
import type { FinanceTransaction } from '../types'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { toast } from './ui/sonner'
import { exportTransactions, type TemplateFormat } from '../lib/transactionImport'

interface ExportTransactionsButtonProps {
  transactions: FinanceTransaction[]
}

export function ExportTransactionsButton({ transactions }: ExportTransactionsButtonProps) {
  const handleExport = (format: TemplateFormat) => {
    if (transactions.length === 0) {
      toast.error('No transactions to export')
      return
    }
    exportTransactions(transactions, format)
    toast.success(`Exported ${transactions.length} ${transactions.length === 1 ? 'transaction' : 'transactions'} as ${format.toUpperCase()}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={transactions.length === 0}
          className="border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          CSV (.csv)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('xlsx')}>
          Excel (.xlsx)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
