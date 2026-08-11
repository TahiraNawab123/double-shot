'use client'

import React, { useState } from 'react'
import { ShieldAlert, KeyRound, ArrowRight, Home } from 'lucide-react'
import AdminDashboard from './admin-dashboard'
import { getRegisteredUsers, hashPassword, setSessionCookie } from '@/lib/auth-helpers'

export default function AdminDashboardWrapper({ isAdmin }: { isAdmin: boolean }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (isAdmin) {
    return <AdminDashboard />
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const users = getRegisteredUsers()
    const foundUser = users.find(u => u.email === email && u.role === 'admin')

    if (!foundUser) {
      setError('Invalid admin credentials or unauthorized account.')
      return
    }

    const hashedInput = await hashPassword(password)
    if (foundUser.passwordHash !== hashedInput) {
      setError('Invalid admin credentials.')
      return
    }

    // Success login!
    // Set cookies and localstorage
    setSessionCookie({
      name: foundUser.name,
      email: foundUser.email,
      role: foundUser.role
    })
    localStorage.setItem('currentUser', JSON.stringify(foundUser))
    
    // Add audit log
    try {
      const rawAudit = localStorage.getItem('auditLog')
      const auditLog = rawAudit ? JSON.parse(rawAudit) : []
      const entry = {
        when: new Date().toISOString(),
        by: foundUser.name,
        action: 'admin-login',
        details: 'Staff member logged into the admin dashboard successfully.'
      }
      localStorage.setItem('auditLog', JSON.stringify([entry, ...auditLog]))
    } catch {}

    // Reload page to let server-side check read the cookie
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-[#f3eee5] text-[#24221f] flex flex-col justify-between p-6 md:p-10 font-sans">
      <header className="flex justify-between items-center max-w-lg mx-auto w-full border-b border-[#d5ccbf] pb-6">
        <div className="flex items-center gap-2">
          <KeyRound size={22} className="text-[#716b63]" />
          <h1 className="font-serif text-xl font-bold tracking-wider leading-none">DOUBLE SHOT</h1>
        </div>
        <a href="/" className="text-xs font-bold uppercase tracking-widest text-[#716b63] hover:text-[#24221f] flex items-center gap-1.5 transition-colors">
          <Home size={14} /> Back to Site
        </a>
      </header>

      <main className="flex-grow flex items-center justify-center py-10">
        <div className="bg-[#e9e0d4] border border-[#d5ccbf] w-full max-w-md p-8 rounded shadow-md">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-[#24221f]/10 flex items-center justify-center text-[#24221f] mb-4">
              <ShieldAlert size={24} />
            </div>
            <h2 className="font-serif text-2xl font-bold">Staff Access</h2>
            <p className="text-xs text-[#716b63] mt-2 max-w-[280px]">
              Access to this dashboard is restricted to authorized Double Shot café staff.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-xs font-semibold p-3 rounded text-center">
                {error}
              </div>
            )}

            <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-widest text-[#716b63]">
              Admin Email
              <input
                required
                type="email"
                placeholder="staff@doubleshot.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="p-3 border border-[#d5ccbf] bg-transparent text-[#24221f] placeholder-[#716b63]/60 focus:border-[#24221f] outline-none"
              />
            </label>

            <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-widest text-[#716b63]">
              Security Key / Password
              <input
                required
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="p-3 border border-[#d5ccbf] bg-transparent text-[#24221f] placeholder-[#716b63]/60 focus:border-[#24221f] outline-none"
              />
            </label>

            <button
              type="submit"
              className="mt-4 w-full p-3 bg-[#24221f] text-[#f3eee5] font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              Authorize Login <ArrowRight size={14} />
            </button>
          </form>

          <div className="mt-8 border-t border-[#d5ccbf]/60 pt-4 text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#716b63]">
              Lahore, Pakistan
            </span>
          </div>
        </div>
      </main>

      <footer className="text-center text-[10px] text-[#716b63] uppercase tracking-wider max-w-lg mx-auto w-full border-t border-[#d5ccbf]/60 pt-6">
        © 2026 Double Shot · Protected Terminal
      </footer>
    </div>
  )
}
