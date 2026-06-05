import { useRef, useState } from 'react'
import { AlertTriangle, CheckCircle, Download, FileSpreadsheet, Upload } from 'lucide-react'
import type { FinanceTransaction, TransactionFormData } from '../types'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import { toast } from './ui/sonner'
import { downloadTransactionTemplate, parseTransactionsImportFile, type TemplateFormat } from '../lib/transactionImport'

interface ImportTransactionsDialogProps {
  transactions: FinanceTransaction[]
  onImport: (rows: TransactionFormData[]) => Promise<{ error: string | null }>
}

type Step = 'upload' | 'preview'

function buildDupKey(date: string, amount: string | number, category: string) {
  return `${date}|${Number(amount)}|${category}`
}

function formatAmount(amount: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount))
}

function formatDateDisplay(date: string) {
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}

export function ImportTransactionsDialog({ transactions, onImport }: ImportTransactionsDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('upload')
  const [busy, setBusy] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [parsedRows, setParsedRows] = useState<TransactionFormData[]>([])
  const [duplicateIndices, setDuplicateIndices] = useState<Set<number>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetAndClose = () => {
    setOpen(false)
    setStep('upload')
    setParsedRows([])
    setDuplicateIndices(new Set())
    setSelectedFileName(null)
  }

  const handleTemplateDownload = (format: TemplateFormat) => {
    downloadTransactionTemplate(format)
    toast.success(`${format.toUpperCase()} template downloaded`)
  }

  const processFile = async (file: File) => {
    setBusy(true)
    setSelectedFileName(file.name)

    try {
      const rows = await parseTransactionsImportFile(file)

      const existingKeys = new Set(
        transactions.map((tx) => buildDupKey(tx.date, tx.amount, tx.category))
      )
      const dupIndices = new Set(
        rows.reduce<number[]>((acc, row, i) => {
          if (existingKeys.has(buildDupKey(row.date, row.amount, row.category))) acc.push(i)
          return acc
        }, [])
      )

      setParsedRows(rows)
      setDuplicateIndices(dupIndices)
      setStep('preview')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setBusy(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleConfirmImport = async (rows: TransactionFormData[]) => {
    setBusy(true)
    try {
      const result = await onImport(rows)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(`Imported ${rows.length} ${rows.length === 1 ? 'transaction' : 'transactions'} successfully`)
      resetAndClose()
    } finally {
      setBusy(false)
    }
  }

  const nonDuplicateRows = parsedRows.filter((_, i) => !duplicateIndices.has(i))

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) resetAndClose(); else setOpen(true) }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary">
          <Upload className="h-4 w-4" />
          Import CSV/Excel
        </Button>
      </DialogTrigger>

      <DialogContent className="!w-[min(1200px,95vw)] !max-w-none max-h-[88vh] overflow-y-auto border-white/10 bg-slate-950/95 p-0 text-slate-100">
        <DialogHeader className="border-b border-white/10 px-6 py-5">
          <DialogTitle className="text-2xl display-serif">
            {step === 'upload' ? 'Upload Transactions Data' : 'Review before importing'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {step === 'upload'
              ? 'Download the Trackora template, fill your rows, then upload CSV or Excel.'
              : 'Check the rows below. Duplicates are flagged — you can skip or include them.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' ? (
          <div className="grid gap-5 p-5 md:grid-cols-2 xl:grid-cols-[1.05fr_1.15fr_1.05fr] lg:p-6">
            <div className="rounded-2xl border border-dashed border-primary/35 bg-primary/10 p-6">
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 rounded-full border border-primary/40 bg-primary/20 p-4">
                  <Download className="h-9 w-9 text-primary" />
                </div>
                <h3 className="display-serif text-2xl font-semibold">Download Template</h3>
                <p className="mt-2 text-sm text-slate-300">Use our template headers exactly as provided.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <Button onClick={() => handleTemplateDownload('csv')} className="bg-gradient-to-r from-emerald-400 to-green-300 text-slate-950 hover:opacity-90">
                    CSV Template
                  </Button>
                  <Button
                    onClick={() => handleTemplateDownload('xlsx')}
                    variant="outline"
                    className="border-accent/50 bg-accent/10 text-orange-200 hover:bg-accent/20 hover:text-orange-100"
                  >
                    Excel Template
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:col-span-2 xl:col-span-1">
              <h3 className="text-2xl display-serif font-semibold mb-4">How to Upload Data</h3>
              <ol className="space-y-2 text-sm leading-6 text-slate-300">
                <li>1. Download a template from the left panel (CSV or Excel).</li>
                <li>2. Fill all rows using these columns: amount, type, category, date, note.</li>
                <li>3. Do not rename column headers.</li>
                <li>4. Date format accepted: dd/MM/yyyy or yyyy-MM-dd.</li>
                <li>5. Type must be exactly income or expense.</li>
                <li>6. Upload the completed file from the right panel.</li>
              </ol>
              <p className="mt-5 text-sm italic text-slate-400">
                After a successful upload, your transactions immediately appear in recent activity.
              </p>
            </div>

            <div
              className="rounded-2xl border border-dashed border-accent/45 bg-accent/10 p-6"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                const file = event.dataTransfer.files?.[0]
                if (!file || busy) return
                void processFile(file)
              }}
            >
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 rounded-full border border-accent/50 bg-accent/20 p-4">
                  <FileSpreadsheet className="h-9 w-9 text-orange-200" />
                </div>
                <h3 className="display-serif text-2xl font-semibold">Upload Transactions</h3>
                <p className="mt-2 text-sm text-slate-300">Drop a .csv, .xlsx, or .xls file here, or browse from your device.</p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(event) => { void processFile(event.target.files![0]) }}
                />

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={busy}
                  className="mt-6 bg-gradient-to-r from-orange-400 to-amber-300 text-slate-950 hover:opacity-90"
                >
                  <Upload className="h-4 w-4" />
                  {busy ? 'Reading file...' : 'Upload Transactions Data'}
                </Button>

                <p className="mt-3 text-xs text-slate-400">
                  {selectedFileName ? `Selected: ${selectedFileName}` : 'No file selected'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 lg:p-6 space-y-5">
            {/* Summary */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="text-sm text-slate-300">
                <span className="font-semibold text-slate-100">{parsedRows.length}</span>{' '}
                {parsedRows.length === 1 ? 'row' : 'rows'} parsed from{' '}
                <span className="font-medium text-slate-200">{selectedFileName}</span>
              </p>
              {duplicateIndices.size > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-xs text-amber-400">
                  <AlertTriangle className="h-3 w-3" />
                  {duplicateIndices.size} possible {duplicateIndices.size === 1 ? 'duplicate' : 'duplicates'} detected
                </span>
              )}
            </div>

            {/* Preview table */}
            <div className="overflow-auto rounded-xl border border-white/10 max-h-[340px]">
              <table className="w-full min-w-[620px] text-sm">
                <thead className="sticky top-0 border-b border-white/10 bg-slate-900">
                  <tr>
                    {['#', 'Amount', 'Type', 'Category', 'Date', 'Note', 'Status'].map((h) => (
                      <th key={h} className="whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-widest text-slate-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {parsedRows.map((row, i) => {
                    const isDuplicate = duplicateIndices.has(i)
                    return (
                      <tr key={i} className={isDuplicate ? 'bg-amber-500/5' : undefined}>
                        <td className="px-3 py-2.5 tabular-nums text-slate-500">{i + 1}</td>
                        <td className={`px-3 py-2.5 font-medium tabular-nums ${row.type === 'income' ? 'text-emerald-300' : 'text-orange-300'}`}>
                          {row.type === 'income' ? '+' : '-'}{formatAmount(row.amount)}
                        </td>
                        <td className="px-3 py-2.5 capitalize text-slate-300">{row.type}</td>
                        <td className="px-3 py-2.5 text-slate-200">{row.category}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-slate-300">{formatDateDisplay(row.date)}</td>
                        <td className="max-w-[180px] truncate px-3 py-2.5 text-slate-400">{row.note || '—'}</td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          {isDuplicate ? (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                              <AlertTriangle className="h-3 w-3" /> Duplicate
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                              <CheckCircle className="h-3 w-3" /> New
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Action footer */}
            <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
              <Button
                variant="ghost"
                onClick={() => setStep('upload')}
                disabled={busy}
                className="text-slate-400 hover:bg-white/5 hover:text-slate-200"
              >
                ← Back
              </Button>

              <div className="flex items-center gap-2">
                {duplicateIndices.size > 0 && nonDuplicateRows.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => handleConfirmImport(nonDuplicateRows)}
                    disabled={busy}
                    className="border-white/10 text-slate-300 hover:bg-white/10"
                  >
                    Skip duplicates, import {nonDuplicateRows.length}
                  </Button>
                )}
                <Button
                  onClick={() => handleConfirmImport(parsedRows)}
                  disabled={busy}
                  className="bg-gradient-to-r from-emerald-400 to-green-300 text-slate-950 hover:opacity-90"
                >
                  {busy
                    ? 'Importing...'
                    : `Import ${parsedRows.length === 1 ? '1 transaction' : `${parsedRows.length} transactions`}`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
