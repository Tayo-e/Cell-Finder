import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await logout()
    navigate('/')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-harvest-border bg-harvest-black/90 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">

        {/* Logo + wordmark */}
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-3 group">
          <img
            src="/logo.png"
            alt="Harvesters"
            className="h-8 w-8 object-contain group-hover:opacity-80 transition-opacity"
          />
          <div className="leading-tight">
            <p className="font-display text-harvest-white text-base font-semibold tracking-wide">
              Harvesters
            </p>
            <p className="font-body text-harvest-muted text-[10px] tracking-widest uppercase">
              CellFinder
            </p>
          </div>
        </Link>

        {/* Right side */}
        {user ? (
          <div className="flex items-center gap-4">
            <span className="font-body text-harvest-silver text-sm hidden sm:block">
              Hi, <span className="text-harvest-gold">{profile?.name?.split(' ')[0] ?? 'Friend'}</span>
            </span>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="font-body text-sm text-harvest-muted hover:text-harvest-white border border-harvest-border hover:border-harvest-gold px-4 py-1.5 rounded-full transition-all duration-200 disabled:opacity-50"
            >
              {loggingOut ? 'Signing out…' : 'Sign Out'}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="font-body text-sm text-harvest-silver hover:text-harvest-white transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="font-body text-sm bg-harvest-gold hover:bg-harvest-gold-light text-harvest-black font-medium px-4 py-1.5 rounded-full transition-colors duration-200"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
