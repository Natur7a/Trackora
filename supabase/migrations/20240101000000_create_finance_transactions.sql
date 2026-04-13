-- Create FinanceTransactions table for personal income/expense tracking
CREATE TABLE IF NOT EXISTS public."FinanceTransactions" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  amount numeric NOT NULL CHECK (amount > 0),
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT finance_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT finance_transactions_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Enable Row Level Security
ALTER TABLE public."FinanceTransactions" ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own transactions
CREATE POLICY "Users can view own transactions"
  ON public."FinanceTransactions"
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own transactions
CREATE POLICY "Users can insert own transactions"
  ON public."FinanceTransactions"
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own transactions
CREATE POLICY "Users can update own transactions"
  ON public."FinanceTransactions"
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own transactions
CREATE POLICY "Users can delete own transactions"
  ON public."FinanceTransactions"
  FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster user-based queries
CREATE INDEX IF NOT EXISTS finance_transactions_user_id_idx
  ON public."FinanceTransactions" (user_id);

CREATE INDEX IF NOT EXISTS finance_transactions_date_idx
  ON public."FinanceTransactions" (date DESC);
