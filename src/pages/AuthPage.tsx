import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

type AuthMode = 'login' | 'register'

export function AuthPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!email || password.length < 6) {
      setError('Email + 6+ char password')
      return
    }

    setBusy(true)
    const response =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
    setBusy(false)

    if (response.error) {
      setError(response.error.message)
      return
    }

    if (mode === 'register') {
      setSuccess('Account created. You can sign in now.')
      setMode('login')
      setPassword('')
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-950 text-slate-100">
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden border-r border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-sky-500/20" />
        <div className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute bottom-10 -left-20 h-80 w-80 rounded-full bg-emerald-400/15 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 text-slate-950 shadow-lg grid place-items-center font-bold text-xl leading-none">
            T
          </div>
          <span className="text-2xl font-semibold tracking-tight">Trackora</span>
        </div>

        <div className="relative space-y-6 max-w-md">
          <h1 className="text-5xl xl:text-6xl font-semibold leading-[1.05] tracking-tight">
            Your money,
            <br />
            <span className="italic text-emerald-300">beautifully</span> tracked.
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            A personal finance journal. Log income, watch expenses, and discover where your money flows each month.
          </p>
        </div>

        <div className="relative text-xs text-slate-400 uppercase tracking-widest">
          End-to-end secure · Private by design · Just for you
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-2 justify-center">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 text-slate-950 shadow-lg grid place-items-center font-bold leading-none">
              T
            </div>
            <span className="text-2xl font-semibold">Trackora</span>
          </div>

          <div>
            <h2 className="text-3xl font-semibold tracking-tight">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-slate-400 mt-2">
              {mode === 'login' ? 'Sign in to your finance journal.' : 'Start tracking in under a minute.'}
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {success}
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label htmlFor="email" className="text-xs uppercase tracking-wider text-slate-400">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 h-12 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-xs uppercase tracking-wider text-slate-400">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 h-12 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 hover:opacity-90 disabled:opacity-70 font-semibold text-base transition"
            >
              {busy ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="text-center text-sm text-slate-400">
            {mode === 'login' ? "Don't have an account? " : 'Already registered? '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setError(null)
                setSuccess(null)
              }}
              className="text-emerald-300 hover:text-emerald-200 font-medium underline underline-offset-4"
            >
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
