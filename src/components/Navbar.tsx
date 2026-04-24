import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Navbar() {
  const { user, signOut } = useAuth()

  return (
    <nav className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-3 sm:gap-6">
        <span className="text-2xl">💰</span>
        <span className="font-bold text-lg">Trackora</span>
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `px-3 py-1 rounded-full transition-colors ${isActive ? 'bg-white text-blue-700' : 'bg-white/20 hover:bg-white/30'}`}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/analytics"
            className={({ isActive }) => `px-3 py-1 rounded-full transition-colors ${isActive ? 'bg-white text-blue-700' : 'bg-white/20 hover:bg-white/30'}`}
          >
            Analytics
          </NavLink>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <>
            <span className="text-sm bg-white/20 px-3 py-1 rounded-full">{user.email}</span>
            <button
              onClick={signOut}
              className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors"
            >
              Sign out
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
