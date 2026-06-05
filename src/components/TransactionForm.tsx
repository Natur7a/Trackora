import { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, type TxType } from '../types/finance';
import type { TransactionFormData, FinanceTransaction } from '../types';
import { ArrowDownCircle, ArrowUpCircle, Plus, Sparkles, X } from 'lucide-react';
import { toast } from '../components/ui/sonner';
import { suggestCategory } from '../lib/categorySuggestion';

type TxInput = TransactionFormData;

interface Props {
  onSubmit: (input: TxInput) => Promise<{ error: string | null }>;
  initial?: Partial<TxInput>;
  submitLabel?: string;
  onCancel?: () => void;
  transactions?: FinanceTransaction[];
}

export const TransactionForm = ({ onSubmit, initial, submitLabel = 'Add transaction', onCancel, transactions = [] }: Props) => {
  const [type, setType] = useState<TxType>(initial?.type ?? 'expense');
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState(initial?.note ?? '');
  const [busy, setBusy] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // Suggest category based on note input
  useEffect(() => {
    if (dismissed) return;
    setSuggestion(null);
    if (!note.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSuggesting(true);
      try {
        const s = await suggestCategory(note, type, transactions);
        setSuggestion(s && s !== category ? s : null);
      } finally {
        setSuggesting(false);
      }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [note, type, transactions]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNoteChange = (val: string) => {
    setNote(val);
    setDismissed(false);
  };

  const acceptSuggestion = () => {
    if (suggestion) {
      setCategory(suggestion);
      setSuggestion(null);
      setDismissed(true);
    }
  };

  const dismissSuggestion = () => {
    setSuggestion(null);
    setDismissed(true);
  };

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (!num || num <= 0) return toast.error('Enter a valid amount');
    if (!category) return toast.error('Pick a category');
    setBusy(true);
    const { error } = await onSubmit({ amount: String(num), type, category, date, note: note || '' });
    setBusy(false);
    if (error) return toast.error(error);
    toast.success('Saved');
    if (!initial) { setAmount(''); setNote(''); setCategory(''); }
  };

  return (
    <form onSubmit={handle} className="space-y-5">
      <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 border border-white/10 rounded-xl">
        <button
          type="button" onClick={() => { setType('expense'); setCategory(''); }}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            type === 'expense' ? 'bg-[#ff6b47] text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowDownCircle className="h-4 w-4" /> Expense
        </button>
        <button
          type="button" onClick={() => { setType('income'); setCategory(''); }}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            type === 'income' ? 'bg-emerald-400 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowUpCircle className="h-4 w-4" /> Income
        </button>
      </div>

      <div>
        <Label htmlFor="amount" className="text-xs uppercase tracking-widest text-slate-400">Amount</Label>
        <div className="relative mt-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 display-serif text-lg">$</span>
          <Input
            id="amount" type="number" step="0.01" inputMode="decimal" placeholder="0.00"
            value={amount} onChange={(e) => setAmount(e.target.value)}
            className="pl-7 mono text-2xl h-14 bg-white/10 border-white/10 rounded-xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs uppercase tracking-widest text-slate-400">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="mt-1 h-12 bg-white/10 border-white/10 rounded-xl"><SelectValue placeholder="Choose..." /></SelectTrigger>
            <SelectContent>
              {cats.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="date" className="text-xs uppercase tracking-widest text-slate-400">Date</Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 h-12 bg-white/10 border-white/10 rounded-xl" />
        </div>
      </div>

      <div>
        <Label htmlFor="note" className="text-xs uppercase tracking-widest text-slate-400">Note (optional)</Label>
        <Input id="note" placeholder="Coffee, rent, paycheck..." value={note ?? ''} onChange={(e) => handleNoteChange(e.target.value)} className="mt-1 h-12 bg-white/10 border-white/10 rounded-xl" />
      </div>

      {suggesting && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-400">
          <Sparkles className="h-3.5 w-3.5 text-violet-400 animate-pulse shrink-0" />
          Suggesting category…
        </div>
      )}

      {!suggesting && suggestion && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-400/20 text-sm">
          <Sparkles className="h-3.5 w-3.5 text-violet-400 shrink-0" />
          <span className="text-slate-300 flex-1">Suggested: <span className="font-semibold text-violet-300">{suggestion}</span></span>
          <button type="button" onClick={acceptSuggestion} className="text-xs font-semibold text-violet-300 hover:text-violet-100 transition-colors px-2 py-0.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30">
            Use
          </button>
          <button type="button" onClick={dismissSuggestion} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={busy} className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-400 to-green-300 text-slate-950 hover:opacity-90 shadow-glow font-semibold">
          <Plus className="h-4 w-4 mr-1" />
          {busy ? 'Saving…' : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" onClick={onCancel}>Cancel</Button>
        )}
      </div>
    </form>
  );
};