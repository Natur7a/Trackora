import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Navbar() {
  const { user, signOut } = useAuth()

  return (
    <nav className="border-b border-white/10 bg-slate-950/95 text-slate-100 px-6 py-4 flex items-center justify-between shadow-lg backdrop-blur">
      <div className="flex items-center gap-3 sm:gap-6">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 text-slate-950 grid place-items-center font-bold text-sm">
          T
        </div>
        <span className="font-semibold text-lg tracking-tight">Trackora</span>
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `px-3 py-1 rounded-full transition-colors ${isActive ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950' : 'bg-white/10 text-slate-200 hover:bg-white/20'}`}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/analytics"
            className={({ isActive }) => `px-3 py-1 rounded-full transition-colors ${isActive ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950' : 'bg-white/10 text-slate-200 hover:bg-white/20'}`}
          >
            Analytics
          </NavLink>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <>
            <span className="text-sm bg-white/10 text-slate-200 px-3 py-1 rounded-full">{user.email}</span>
            <button
              onClick={signOut}
              className="text-sm bg-white/10 hover:bg-rose-500/20 text-slate-100 px-3 py-1 rounded-full transition-colors"
            >
              Sign out
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
