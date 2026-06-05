import * as XLSX from 'xlsx'
import type { FinanceTransaction, TransactionFormData, TransactionType } from '../types'

export type TemplateFormat = 'csv' | 'xlsx'

const REQUIRED_HEADERS = ['amount', 'type', 'category', 'date', 'note'] as const

const EXAMPLE_ROW = {
  amount: '1250.50',
  type: 'income',
  category: 'Salary',
  date: '27/04/2026',
  note: 'Monthly salary',
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

export function downloadTransactionTemplate(format: TemplateFormat) {
  if (format === 'csv') {
    const content = [
      REQUIRED_HEADERS.join(','),
      `${EXAMPLE_ROW.amount},${EXAMPLE_ROW.type},${EXAMPLE_ROW.category},${EXAMPLE_ROW.date},${EXAMPLE_ROW.note}`,
    ].join('\n')

    downloadBlob(new Blob([content], { type: 'text/csv;charset=utf-8;' }), 'trackora-transactions-template.csv')
    return
  }

  const worksheet = XLSX.utils.json_to_sheet([EXAMPLE_ROW], { header: [...REQUIRED_HEADERS] })
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions')
  const data = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  downloadBlob(
    new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    'trackora-transactions-template.xlsx',
  )
}

function escapeCsvCell(value: string | number): string {
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportTransactions(transactions: FinanceTransaction[], format: TemplateFormat): void {
  const rows = transactions
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((tx) => ({
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      date: tx.date,
      note: tx.note ?? '',
    }))

  const fileName = `trackora-transactions-${new Date().toISOString().slice(0, 10)}`

  if (format === 'csv') {
    const lines = [
      REQUIRED_HEADERS.join(','),
      ...rows.map((r) => [r.amount, r.type, r.category, r.date, r.note].map(escapeCsvCell).join(',')),
    ]
    downloadBlob(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' }), `${fileName}.csv`)
    return
  }

  const worksheet = XLSX.utils.json_to_sheet(rows, { header: [...REQUIRED_HEADERS] })
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions')
  const data = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  downloadBlob(
    new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${fileName}.xlsx`,
  )
}

function formatDateParts(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

function normalizeDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDateParts(value.getFullYear(), value.getMonth() + 1, value.getDate())
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (parsed) {
      return formatDateParts(parsed.y, parsed.m, parsed.d)
    }
  }

  const input = String(value ?? '').trim()
  if (!input) return null

  const isoMatch = input.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    return formatDateParts(Number(year), Number(month), Number(day))
  }

  const slashMatch = input.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (slashMatch) {
    const [, day, month, year] = slashMatch
    return formatDateParts(Number(year), Number(month), Number(day))
  }

  return null
}

function isType(value: string): value is TransactionType {
  return value === 'income' || value === 'expense'
}

export async function parseTransactionsImportFile(file: File): Promise<TransactionFormData[]> {
  const bytes = await file.arrayBuffer()
  const workbook = XLSX.read(bytes, { type: 'array', cellDates: true })
  const sheetName = workbook.SheetNames[0]
  const sheet = sheetName ? workbook.Sheets[sheetName] : undefined

  if (!sheet) {
    throw new Error('No sheet found in the uploaded file.')
  }

  const matrixRows = XLSX.utils.sheet_to_json<(string | number | Date)[]>(sheet, {
    header: 1,
    blankrows: true,
    defval: '',
  })

  const uploadedHeaders = (matrixRows[0] ?? []).map((header) => String(header).trim().toLowerCase())
  const missingHeaders = REQUIRED_HEADERS.filter((header) => !uploadedHeaders.includes(header))

  if (missingHeaders.length > 0) {
    throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`)
  }

  if (matrixRows.length <= 1) {
    throw new Error('The file has no transaction rows. Add at least one row below the headers.')
  }

  const headerIndexMap = uploadedHeaders.reduce<Record<string, number>>((acc, header, index) => {
    if (header && !(header in acc)) {
      acc[header] = index
    }
    return acc
  }, {})

  const parsedRows: TransactionFormData[] = []

  for (let index = 1; index < matrixRows.length; index += 1) {
    const rowNumber = index + 1
    const row = matrixRows[index] ?? []

    const amountRaw = String(row[headerIndexMap.amount] ?? '').trim()
    const typeRaw = String(row[headerIndexMap.type] ?? '').trim().toLowerCase()
    const categoryRaw = String(row[headerIndexMap.category] ?? '').trim()
    const dateRaw = row[headerIndexMap.date]
    const noteRaw = String(row[headerIndexMap.note] ?? '').trim()

    const isEmptyRow = [amountRaw, typeRaw, categoryRaw, String(dateRaw ?? '').trim(), noteRaw].every((value) => value.length === 0)
    if (isEmptyRow) continue

    const amount = Number(amountRaw.replace(/,/g, ''))
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(`Row ${rowNumber}: amount must be a positive number.`)
    }

    if (!isType(typeRaw)) {
      throw new Error(`Row ${rowNumber}: type must be either "income" or "expense".`)
    }

    if (!categoryRaw) {
      throw new Error(`Row ${rowNumber}: category is required.`)
    }

    const date = normalizeDate(dateRaw)
    if (!date) {
      throw new Error(`Row ${rowNumber}: invalid date. Use dd/MM/yyyy or yyyy-MM-dd.`)
    }

    parsedRows.push({
      amount: String(amount),
      type: typeRaw,
      category: categoryRaw,
      date,
      note: noteRaw,
    })
  }

  if (parsedRows.length === 0) {
    throw new Error('No valid rows were found in the file.')
  }

  return parsedRows
}
