export type TxType = 'income' | 'expense';

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: TxType;
  category: string;
  date: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export const INCOME_CATEGORIES = [
  'Salary', 'Freelance', 'Investments', 'Gifts', 'Refunds', 'Other Income',
] as const;

export const EXPENSE_CATEGORIES = [
  'Groceries', 'Rent', 'Utilities', 'Transport', 'Dining', 'Entertainment',
  'Health', 'Shopping', 'Travel', 'Education', 'Subscriptions', 'Other',
] as const;

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export const CATEGORY_EMOJI: Record<string, string> = {
  Salary: '💼', Freelance: '🧑‍💻', Investments: '📈', Gifts: '🎁',
  Refunds: '↩️', 'Other Income': '✨',
  Groceries: '🛒', Rent: '🏠', Utilities: '💡', Transport: '🚇',
  Dining: '🍽️', Entertainment: '🎬', Health: '💊', Shopping: '🛍️',
  Travel: '✈️', Education: '📚', Subscriptions: '🔁', Other: '📦',
};