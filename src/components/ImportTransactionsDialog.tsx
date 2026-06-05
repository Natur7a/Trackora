import { useRef, useState } from 'react'
import { Download, FileSpreadsheet, Upload } from 'lucide-react'
import type { TransactionFormData } from '../types'
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
  onImport: (rows: TransactionFormData[]) => Promise<{ error: string | null }>
}

export function ImportTransactionsDialog({ onImport }: ImportTransactionsDialogProps) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleTemplateDownload = (format: TemplateFormat) => {
    downloadTransactionTemplate(format)
    toast.success(`${format.toUpperCase()} template downloaded`)
  }

  const processFile = async (file: File) => {
    setBusy(true)
    setSelectedFileName(file.name)

    try {
      const rows = await parseTransactionsImportFile(file)
      const result = await onImport(rows)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(`Imported ${rows.length} ${rows.length === 1 ? 'transaction' : 'transactions'} successfully`)
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setBusy(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    await processFile(file)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary">
          <Upload className="h-4 w-4" />
          Import CSV/Excel
        </Button>
      </DialogTrigger>

      <DialogContent className="!w-[min(1200px,95vw)] !max-w-none max-h-[88vh] overflow-y-auto border-white/10 bg-slate-950/95 p-0 text-slate-100">
        <DialogHeader className="border-b border-white/10 px-6 py-5">
          <DialogTitle className="text-2xl display-serif">Upload Transactions Data</DialogTitle>
          <DialogDescription className="text-slate-400">
            Download the Trackora template, fill your rows, then upload CSV or Excel.
          </DialogDescription>
        </DialogHeader>

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
                onChange={(event) => {
                  void handleFileSelection(event)
                }}
              />

              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                className="mt-6 bg-gradient-to-r from-orange-400 to-amber-300 text-slate-950 hover:opacity-90"
              >
                <Upload className="h-4 w-4" />
                {busy ? 'Uploading...' : 'Upload Transactions Data'}
              </Button>

              <p className="mt-3 text-xs text-slate-400">{selectedFileName ? `Selected: ${selectedFileName}` : 'No file selected'}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
