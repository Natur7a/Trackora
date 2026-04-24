# Trackora — Personal Finance Tracker

A personal finance tracking app built with **React + TypeScript + Tailwind CSS + Supabase**.

## Features

- 🔐 **Authentication** — Email/password login & registration via Supabase Auth, with session persistence
- 💸 **Transactions** — Add, view, edit, and delete income/expense transactions
- 🏷️ **Categories** — Predefined categories for each transaction
- 📊 **Dashboard** — Balance summary with income/expense totals
- 📈 **Monthly Analytics** — Monthly totals, category spending breakdown, and month-over-month comparison
- 🛡️ **Row-Level Security** — Only the owner can access their own data

## Tech Stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) — Fast build tool
- [Tailwind CSS v4](https://tailwindcss.com/) — Utility-first CSS
- [Supabase](https://supabase.com/) — Auth + PostgreSQL database
- [React Router](https://reactrouter.com/) — Client-side routing

## Getting Started

### 1. Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com/) project

### 2. Clone and install

```bash
git clone https://github.com/Natur7a/Trackora.git
cd Trackora
npm install
```

### 3. Configure environment variables

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Find these values in your Supabase project under **Settings → API**.

### 4. Apply the database migration

In your [Supabase SQL Editor](https://app.supabase.com/project/_/sql), run the migration file:

```
supabase/migrations/20240101000000_create_finance_transactions.sql
supabase/migrations/20260424000000_create_monthly_analytics_function.sql
```

This creates the `FinanceTransactions` table with:
- All required columns (`id`, `user_id`, `amount`, `type`, `category`, `date`, `note`, `created_at`, `updated_at`)
- Row Level Security (RLS) enabled
- Policies so only the owner can select/insert/update/delete their own rows
- `get_monthly_analytics` RPC function that returns chart-ready monthly aggregates for the authenticated user

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 6. Build for production

```bash
npm run build
```

## Project Structure

```
src/
├── lib/
│   └── supabase.ts          # Supabase client (reads env vars)
│   └── analytics.ts         # Analytics RPC wrapper
├── types/
│   └── index.ts             # TypeScript types and constants (CATEGORIES)
├── context/
│   └── AuthContext.tsx      # Auth context with session state
├── hooks/
│   └── useTransactions.ts   # Transactions CRUD hook
│   └── useMonthlyAnalytics.ts # Monthly analytics hook
├── components/
│   ├── Navbar.tsx            # Top navigation bar
│   ├── ProtectedRoute.tsx    # Route guard (redirects if unauthenticated)
│   ├── TransactionForm.tsx   # Add/Edit transaction form
│   └── TransactionList.tsx  # Transaction list with inline edit/delete
├── pages/
│   ├── AuthPage.tsx          # Login / Register page
│   └── DashboardPage.tsx     # Main protected dashboard
│   └── AnalyticsPage.tsx     # Protected analytics page
├── App.tsx                   # Router setup
├── main.tsx                  # App entry point
└── index.css                 # Tailwind CSS import
supabase/
└── migrations/
    └── 20240101000000_create_finance_transactions.sql
    └── 20260424000000_create_monthly_analytics_function.sql
```

## Testing the Auth Flow

1. Open the app at `http://localhost:5173`
2. Click **Register**, enter your email and password (min 6 chars), click **Create Account**
3. Check your email for confirmation (if email confirmations are enabled in Supabase)
4. Click **Login** and sign in with your credentials
5. You'll be redirected to the dashboard

## Testing the Transactions Flow

1. Log in to the app
2. Fill in the **Add Transaction** form with amount, type, category, and date
3. Click **Add Transaction** — it will be saved to Supabase
4. Switch to the **Transactions** tab to see your list
5. Click **Edit** to update a transaction inline, or **Delete** to remove it

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase project anon (public) key |

> ⚠️ Never use the `service_role` key in the frontend. Only the `anon` key is safe to expose.

## Known Limitations

- Email confirmation is required by default in Supabase — you may need to disable it in **Supabase Auth Settings** for local testing
- No OAuth providers (Google, GitHub, etc.) are implemented
- No pagination for the transaction list
- Currency is displayed in USD by default
