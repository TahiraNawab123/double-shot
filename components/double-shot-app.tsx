'use client'

import React, { useMemo, useState, useEffect } from 'react'
import Image from 'next/image'
import { ArrowRight, Minus, Plus, ShoppingBag, Sparkles, X, Menu, RefreshCw, Key } from 'lucide-react'
import {
  getRegisteredUsers,
  saveRegisteredUsers,
  setSessionCookie,
  clearSessionCookie,
  hashPassword,
  User
} from '@/lib/auth-helpers'

const GOOGLE_MAPS_LINK = 'https://maps.app.goo.gl/tyUJ1W2VnXqCoZMB9?g_st=aw'

interface Variant {
  name: string;
  price: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  variants?: Variant[];
  available: boolean;
  featured: boolean;
  createdBy?: string;
  createdAt?: string;
}

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  variantName?: string;
  isCustom?: boolean;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  source: 'Website' | 'Manual/Phone' | 'Walk-in' | 'Other';
  items: OrderItem[];
  itemsSummary: string;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: 'Paid' | 'Unpaid';
  status: 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'Out for Delivery' | 'Completed' | 'Cancelled';
  notes?: string;
  createdBy: string;
  createdAt: string;
}

const DEFAULT_MENU: MenuItem[] = [
  {
    id: 'espresso',
    name: 'Espresso',
    description: 'A clean, syrupy double shot.',
    price: 280,
    category: 'Coffee',
    image: '/double-shot-latte.png',
    variants: [
      { name: 'Single', price: 280 },
      { name: 'Double', price: 340 }
    ],
    available: true,
    featured: true,
    createdBy: 'System',
    createdAt: '2026-08-11T12:00:00.000Z'
  },
  {
    id: 'flat-white',
    name: 'Flat White',
    description: 'Velvety microfoam, double ristretto.',
    price: 520,
    category: 'Coffee',
    image: '/double-shot-flat-white.png',
    variants: [
      { name: 'Regular', price: 520 },
      { name: 'Large', price: 600 }
    ],
    available: true,
    featured: true,
    createdBy: 'System',
    createdAt: '2026-08-11T12:00:00.000Z'
  },
  {
    id: 'iced-mocha',
    name: 'Iced Mocha',
    description: 'Cocoa, espresso, milk, over ice.',
    price: 650,
    category: 'Cold',
    image: '/double-shot-iced.png',
    variants: [
      { name: 'Regular', price: 650 },
      { name: 'Large', price: 730 }
    ],
    available: true,
    featured: false,
    createdBy: 'System',
    createdAt: '2026-08-11T12:00:00.000Z'
  },
  {
    id: 'cardamom-bun',
    name: 'Cardamom Bun',
    description: 'Buttery layers, toasted sugar.',
    price: 480,
    category: 'Bakes',
    image: '/double-shot-cardamom-bun.png',
    available: true,
    featured: true,
    createdBy: 'System',
    createdAt: '2026-08-11T12:00:00.000Z'
  },
  {
    id: 'avocado-toast',
    name: 'Avocado Toast',
    description: 'Sourdough, lemon, za’atar, chilli.',
    price: 890,
    category: 'Plates',
    image: '/double-shot-avocado-toast.png',
    available: true,
    featured: false,
    createdBy: 'System',
    createdAt: '2026-08-11T12:00:00.000Z'
  },
  {
    id: 'basque-cheesecake',
    name: 'Basque Cheesecake',
    description: 'Burnt top, soft centre, sea salt.',
    price: 720,
    category: 'Sweet',
    image: '/double-shot-cheesecake.png',
    variants: [
      { name: 'Slice', price: 720 },
      { name: 'Whole', price: 5400 }
    ],
    available: true,
    featured: true,
    createdBy: 'System',
    createdAt: '2026-08-11T12:00:00.000Z'
  }
]

export default function DoubleShotApp() {
  const [cart, setCart] = useState<Record<string, number>>({})
  const [cartOpen, setCartOpen] = useState(false)
  const [active, setActive] = useState('home')
  const [notice, setNotice] = useState('')
  const [menuOpen, setMenuOpen] = useState(false) // Mobile Menu Drawer

  // State for adding variants
  const [variantSelectorItem, setVariantSelectorItem] = useState<MenuItem | null>(null)
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0)

  // Auth modals
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')
  
  // Auth Form Inputs
  const [authName, setAuthName] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authPhone, setAuthPhone] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')

  // Checkout states
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutName, setCheckoutName] = useState('')
  const [checkoutPhone, setCheckoutPhone] = useState('')
  const [checkoutEmail, setCheckoutEmail] = useState('')
  const [checkoutPayment, setCheckoutPayment] = useState('Cash')
  const [checkoutNotes, setCheckoutNotes] = useState('')

  // Customer tracking states
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null)
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null)

  // Menu items list (synced from DB)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEFAULT_MENU)

  // Logged in user
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // Sync state on load
  useEffect(() => {
    // Current user
    const rawUser = localStorage.getItem('currentUser')
    if (rawUser) {
      try {
        const u = JSON.parse(rawUser)
        setCurrentUser(u)
        setCheckoutName(u.name)
        setCheckoutPhone(u.phone)
        setCheckoutEmail(u.email)
      } catch {}
    }

    // Menu list
    const rawMenu = localStorage.getItem('menuItems')
    if (rawMenu) {
      try {
        setMenuItems(JSON.parse(rawMenu))
      } catch {}
    } else {
      localStorage.setItem('menuItems', JSON.stringify(DEFAULT_MENU))
    }

    // Check query params or tracking cache
    const cachedTracking = sessionStorage.getItem('trackingOrderId')
    if (cachedTracking) {
      setTrackingOrderId(cachedTracking)
    }
  }, [])

  // Poll for tracking order changes in localStorage
  useEffect(() => {
    if (!trackingOrderId) {
      setTrackingOrder(null)
      return
    }

    const checkOrder = () => {
      try {
        const rawOrders = localStorage.getItem('adminOrders')
        if (rawOrders) {
          const parsed = JSON.parse(rawOrders)
          const found = parsed.find((o: any) => {
            if (Array.isArray(o)) return o[0].replace('#', '') === trackingOrderId
            return o.id === trackingOrderId
          })
          if (found) {
            if (Array.isArray(found)) {
              // Convert old format
              const priceNum = parseInt(found[4]?.replace(/[^\d]/g, '') || '0', 10)
              setTrackingOrder({
                id: found[0].replace('#', ''),
                customerName: found[1],
                customerPhone: '',
                source: 'Manual/Phone',
                items: [],
                itemsSummary: found[2],
                subtotal: priceNum,
                discount: 0,
                total: priceNum,
                paymentMethod: 'Cash',
                paymentStatus: 'Unpaid',
                status: found[3] as any,
                createdBy: found[5] || 'System',
                createdAt: new Date().toISOString()
              })
            } else {
              setTrackingOrder(found)
            }
          }
        }
      } catch {}
    }

    checkOrder()
    const interval = setInterval(checkOrder, 5000)
    return () => clearInterval(interval)
  }, [trackingOrderId])

  // Total computation
  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0)
  
  const total = useMemo(() => {
    return Object.entries(cart).reduce((sum, [cartKey, qty]) => {
      const [id, variantName] = cartKey.split('::')
      const item = menuItems.find((m) => m.id === id)
      if (!item) return sum
      let price = item.price
      if (variantName && item.variants) {
        const v = item.variants.find(varItem => varItem.name === variantName)
        if (v) price = v.price
      }
      return sum + price * qty
    }, 0)
  }, [cart, menuItems])

  const change = (cartKey: string, amount: number) => {
    setCart((c) => {
      const updated = { ...c, [cartKey]: Math.max(0, (c[cartKey] || 0) + amount) }
      if (updated[cartKey] === 0) delete updated[cartKey]
      return updated
    })
  }

  const toast = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2800)
  }

  // Handle adding standard menu item (handles variants popup if exists)
  const triggerAdd = (item: MenuItem) => {
    if (item.variants && item.variants.length > 0) {
      setVariantSelectorItem(item)
      setSelectedVariantIdx(0)
    } else {
      setCart((c) => ({ ...c, [item.id]: (c[item.id] || 0) + 1 }))
      toast(`${item.name} added to order.`)
    }
  }

  const confirmVariantAdd = () => {
    if (!variantSelectorItem) return
    const variant = variantSelectorItem.variants?.[selectedVariantIdx]
    const cartKey = variant ? `${variantSelectorItem.id}::${variant.name}` : variantSelectorItem.id
    
    setCart((c) => ({ ...c, [cartKey]: (c[cartKey] || 0) + 1 }))
    toast(`${variantSelectorItem.name} (${variant?.name}) added to order.`)
    setVariantSelectorItem(null)
  }

  const handleSignupLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')

    const name = authName.trim()
    const email = authEmail.trim()
    const phone = authPhone.trim()
    const password = authPassword

    if (authMode === 'signup') {
      // Validations
      if (!name || !email || !phone || !password) {
        setAuthError('All fields are required.')
        return
      }
      // Email validation regex
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setAuthError('Please enter a valid email address.')
        return
      }
      if (password.length < 6) {
        setAuthError('Password must be at least 6 characters.')
        return
      }

      const users = getRegisteredUsers()
      if (users.some(u => u.email === email || u.phone === phone)) {
        setAuthError('An account with this email or phone number already exists.')
        return
      }

      const passwordHash = await hashPassword(password)
      const newUser: User = {
        name,
        email,
        phone,
        passwordHash,
        role: 'customer'
      }

      const updatedUsers = [...users, newUser]
      saveRegisteredUsers(updatedUsers)
      
      // Sign in user
      setSessionCookie({ name, email, role: 'customer' })
      localStorage.setItem('currentUser', JSON.stringify(newUser))
      setCurrentUser(newUser)
      setCheckoutName(name)
      setCheckoutPhone(phone)
      setCheckoutEmail(email)
      
      toast('Welcome! Account created successfully.')
      setShowAuthModal(false)
      // Reset inputs
      setAuthName('')
      setAuthEmail('')
      setAuthPhone('')
      setAuthPassword('')
    } else {
      // Login flow
      if (!email || !password) {
        setAuthError('Email and Password are required.')
        return
      }

      const users = getRegisteredUsers()
      const found = users.find(u => u.email === email || u.phone === email) // allows email or phone login

      if (!found) {
        setAuthError('Account not found. Please sign up.')
        return
      }

      const hashInput = await hashPassword(password)
      if (found.passwordHash !== hashInput) {
        setAuthError('Incorrect password.')
        return
      }

      // Login success
      setSessionCookie({ name: found.name, email: found.email, role: found.role })
      localStorage.setItem('currentUser', JSON.stringify(found))
      setCurrentUser(found)
      setCheckoutName(found.name)
      setCheckoutPhone(found.phone)
      setCheckoutEmail(found.email)
      
      // If admin, redirect to admin page
      if (found.role === 'admin') {
        window.location.href = '/admin'
        return
      }

      toast(`Welcome back, ${found.name}!`)
      setShowAuthModal(false)
      setAuthEmail('')
      setAuthPassword('')
    }
  }

  const handleSignOut = () => {
    clearSessionCookie()
    localStorage.removeItem('currentUser')
    setCurrentUser(null)
    toast('Logged out successfully.')
  }

  // Handle Checkout submission
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault()
    if (!checkoutName.trim() || !checkoutPhone.trim()) {
      alert('Name and Phone are required!')
      return
    }

    // Build items payload
    const orderItems: OrderItem[] = Object.entries(cart).map(([cartKey, qty]) => {
      const [id, variantName] = cartKey.split('::')
      const item = menuItems.find(m => m.id === id)
      let price = item ? item.price : 0
      if (variantName && item?.variants) {
        const v = item.variants.find(varItem => varItem.name === variantName)
        if (v) price = v.price
      }
      return {
        name: item ? item.name : id,
        price,
        quantity: qty,
        variantName: variantName || undefined,
        isCustom: false
      }
    })

    const itemsSummary = orderItems.map(item => {
      const vText = item.variantName ? ` (${item.variantName})` : ''
      return `${item.name}${vText} x${item.quantity}`
    }).join(' · ')

    // Fetch existing orders to increment DS-XXXX ID
    let currentOrders: any[] = []
    try {
      const raw = localStorage.getItem('adminOrders')
      if (raw) currentOrders = JSON.parse(raw)
    } catch {}

    const numbers = currentOrders.map((o: any) => {
      const idStr = Array.isArray(o) ? o[0] : o.id
      const match = idStr?.match(/DS-(\d+)/)
      return match ? parseInt(match[1], 10) : 1000
    })
    const maxNum = Math.max(...numbers, 1000)
    const orderId = `DS-${maxNum + 1}`

    const newOrder: Order = {
      id: orderId,
      customerName: checkoutName.trim(),
      customerPhone: checkoutPhone.trim(),
      customerEmail: checkoutEmail.trim() || undefined,
      source: 'Website',
      items: orderItems,
      itemsSummary,
      subtotal: total,
      discount: 0,
      total,
      paymentMethod: checkoutPayment,
      paymentStatus: 'Unpaid',
      status: 'Pending',
      notes: checkoutNotes.trim() || undefined,
      createdBy: 'Customer',
      createdAt: new Date().toISOString()
    }

    // Save order
    const updatedOrders = [newOrder, ...currentOrders]
    localStorage.setItem('adminOrders', JSON.stringify(updatedOrders))

    // Audit log
    try {
      const rawAudit = localStorage.getItem('auditLog')
      const auditLog = raw = rawAudit ? JSON.parse(rawAudit) : []
      const entry = {
        when: new Date().toISOString(),
        by: checkoutName.trim(),
        action: 'website-order',
        details: `Customer placed order ${orderId} online.`
      }
      localStorage.setItem('auditLog', JSON.stringify([entry, ...auditLog]))
    } catch {}

    // Success! Clear cart, close checkout, cache tracking ID
    setCart({})
    setCheckoutOpen(false)
    setCartOpen(false)
    setTrackingOrderId(orderId)
    sessionStorage.setItem('trackingOrderId', orderId)
    toast(`Order ${orderId} placed successfully!`)
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative flex flex-col justify-between">
      
      {/* Site Header */}
      <header className="site-header">
        <button className="brand" onClick={() => setActive('home')} aria-label="Double Shot home">
          DOUBLE<br />SHOT
        </button>
        
        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {['home', 'menu', 'story', 'reservations', 'visit'].map((item) =>
            item === 'visit' ? (
              <a key={item} href={GOOGLE_MAPS_LINK} target="_blank" rel="noreferrer" className="nav-link">
                VISIT
              </a>
            ) : (
              <button
                key={item}
                className={active === item ? 'nav-link active' : 'nav-link'}
                onClick={() => {
                  setActive(item)
                  setTrackingOrderId(null) // reset tracking when navigating
                }}
              >
                {item === 'home' ? 'HOME' : item.toUpperCase()}
              </button>
            )
          )}
        </nav>

        {/* Header Right */}
        <div className="flex items-center gap-4">
          
          {/* Tracking button if an order is active */}
          {trackingOrderId && (
            <button
              onClick={() => setActive('track')}
              className="text-xs font-bold uppercase tracking-widest text-[#716b63] border border-[#d5ccbf] px-3 py-1.5 rounded-full hover:bg-muted transition-all"
            >
              Track Order
            </button>
          )}

          <a href="/admin" className="admin-link hidden md:block font-bold text-xs">
            STAFF PORTAL
          </a>

          {currentUser ? (
            <div className="hidden md:flex items-center gap-4">
              <span className="text-xs font-bold text-[#716b63]">{currentUser.name}</span>
              <button className="text-link" onClick={handleSignOut}>
                SIGN OUT
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-4">
              <button className="text-link" onClick={() => { setAuthMode('signup'); setShowAuthModal(true) }}>
                SIGN UP
              </button>
              <button className="text-link" onClick={() => { setAuthMode('login'); setShowAuthModal(true) }}>
                LOGIN
              </button>
            </div>
          )}

          {/* Cart Trigger */}
          <button className="icon-button" onClick={() => setCartOpen(true)} aria-label={`Open cart, ${totalItems} items`}>
            <ShoppingBag size={18} />
            <span>{totalItems}</span>
          </button>

          {/* Mobile Menu Icon */}
          <button className="icon-button md:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu size={18} />
          </button>
        </div>
      </header>

      {/* Main Pages */}
      <main className="flex-grow">
        {active === 'track' && trackingOrderId && (
          <OrderTrackingPanel order={trackingOrder} onClose={() => setActive('home')} />
        )}
        {active === 'home' && !trackingOrder && (
          <Home onMenu={() => setActive('menu')} onReserve={() => setActive('reservations')} />
        )}
        {active === 'menu' && !trackingOrder && (
          <MenuPage menuItems={menuItems} onAdd={triggerAdd} />
        )}
        {active === 'story' && !trackingOrder && <Story />}
        {active === 'reservations' && !trackingOrder && (
          <Reservations onReserve={() => toast('Your table request is held.')} />
        )}
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <div>
          <p className="eyebrow">DOUBLE SHOT</p>
          <p>Made slowly in Model Town, Lahore.</p>
        </div>
        <div className="footer-right">
          <p>Every day · 6:00 am — 12:00 am</p>
          <p>© 2026 Double Shot</p>
        </div>
      </footer>

      {/* Mobile Menu Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-[#24221f]/60 backdrop-blur-sm md:hidden flex justify-end">
          <div className="w-[280px] h-full bg-[#f3eee5] border-l border-[#d5ccbf] p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex flex-col gap-8">
              <div className="flex justify-between items-center border-b border-[#d5ccbf] pb-4">
                <button
                  className="brand text-left"
                  onClick={() => {
                    setActive('home');
                    setMenuOpen(false);
                    setTrackingOrderId(null);
                  }}
                >
                  DOUBLE<br />SHOT
                </button>
                <button className="p-2 border border-[#d5ccbf] rounded-full hover:bg-muted" onClick={() => setMenuOpen(false)}>
                  <X size={16} />
                </button>
              </div>

              <nav className="flex flex-col gap-5 text-sm font-bold uppercase tracking-wider text-[#716b63]">
                {['home', 'menu', 'story', 'reservations', 'visit'].map(item =>
                  item === 'visit' ? (
                    <a key={item} href={GOOGLE_MAPS_LINK} target="_blank" rel="noreferrer" className="hover:text-foreground pb-1" onClick={() => setMenuOpen(false)}>
                      VISIT
                    </a>
                  ) : (
                    <button
                      key={item}
                      onClick={() => {
                        setActive(item);
                        setMenuOpen(false);
                        setTrackingOrderId(null);
                      }}
                      className={`text-left pb-1 ${active === item ? 'text-foreground underline underline-offset-4' : 'hover:text-foreground'}`}
                    >
                      {item}
                    </button>
                  )
                )}
              </nav>
            </div>

            <div className="flex flex-col gap-4 border-t border-[#d5ccbf] pt-6 mt-auto">
              <a href="/admin" className="text-xs font-bold uppercase tracking-widest text-[#716b63] hover:text-[#24221f]">
                STAFF PORTAL
              </a>
              {currentUser ? (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold">{currentUser.name}</span>
                  <button
                    onClick={() => {
                      handleSignOut()
                      setMenuOpen(false)
                    }}
                    className="text-left text-xs font-bold text-red-700 hover:underline"
                  >
                    SIGN OUT
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={() => {
                      setAuthMode('signup');
                      setShowAuthModal(true);
                      setMenuOpen(false);
                    }}
                    className="text-left text-xs font-bold uppercase tracking-widest text-[#716b63]"
                  >
                    SIGN UP
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setShowAuthModal(true);
                      setMenuOpen(false);
                    }}
                    className="text-left text-xs font-bold uppercase tracking-widest text-[#716b63]"
                  >
                    LOGIN
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <aside className="cart-drawer z-40" aria-label="Shopping cart">
          <div className="drawer-head">
            <div>
              <p className="eyebrow">YOUR ORDER</p>
              <h2>Second cup?</h2>
            </div>
            <button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Close cart">
              <X size={18} />
            </button>
          </div>
          
          <div className="cart-items overflow-y-auto max-h-[50vh] pr-1">
            {totalItems === 0 ? (
              <div className="empty-cart">
                <ShoppingBag size={28} />
                <p>Your basket is waiting.</p>
                <button
                  className="text-link"
                  onClick={() => {
                    setCartOpen(false)
                    setActive('menu')
                  }}
                >
                  Explore the menu <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              Object.entries(cart).filter(([_, qty]) => qty > 0).map(([cartKey, qty]) => {
                const [id, variantName] = cartKey.split('::')
                const item = menuItems.find(m => m.id === id)
                if (!item) return null

                let price = item.price
                if (variantName && item.variants) {
                  const v = item.variants.find(varItem => varItem.name === variantName)
                  if (v) price = v.price
                }

                return (
                  <div className="cart-item" key={cartKey}>
                    <div>
                      <strong>
                        {item.name} {variantName && <span className="text-[10px] text-muted-foreground font-normal">({variantName})</span>}
                      </strong>
                      <small>{price.toLocaleString()} PKR</small>
                    </div>
                    <div className="quantity">
                      <button onClick={() => change(cartKey, -1)} aria-label={`Remove one ${item.name}`}><Minus size={14} /></button>
                      <span>{qty}</span>
                      <button onClick={() => change(cartKey, 1)} aria-label={`Add one ${item.name}`}><Plus size={14} /></button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
          
          {totalItems > 0 && (
            <div className="cart-total">
              <div>
                <span>Subtotal</span>
                <strong>PKR {total.toLocaleString()}</strong>
              </div>
              
              {checkoutOpen ? (
                <form onSubmit={handlePlaceOrder} className="flex flex-col gap-3 border-t border-[#d5ccbf] pt-4 mt-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#716b63] mb-1">Billing Details</p>
                  
                  <input
                    required
                    type="text"
                    placeholder="Your Name *"
                    value={checkoutName}
                    onChange={(e) => setCheckoutName(e.target.value)}
                    className="p-2.5 border border-[#d5ccbf] bg-transparent text-xs outline-none focus:border-[#24221f]"
                  />
                  <input
                    required
                    type="tel"
                    placeholder="Phone Number *"
                    value={checkoutPhone}
                    onChange={(e) => setCheckoutPhone(e.target.value)}
                    className="p-2.5 border border-[#d5ccbf] bg-transparent text-xs outline-none focus:border-[#24221f]"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={checkoutEmail}
                    onChange={(e) => setCheckoutEmail(e.target.value)}
                    className="p-2.5 border border-[#d5ccbf] bg-transparent text-xs outline-none focus:border-[#24221f]"
                  />
                  <select
                    value={checkoutPayment}
                    onChange={(e) => setCheckoutPayment(e.target.value)}
                    className="p-2.5 border border-[#d5ccbf] bg-transparent text-xs outline-none focus:border-[#24221f]"
                  >
                    <option value="Cash">Cash on Pickup / Delivery</option>
                    <option value="Online Transfer">Online Transfer</option>
                  </select>
                  <textarea
                    placeholder="Special instructions (optional)"
                    value={checkoutNotes}
                    onChange={(e) => setCheckoutNotes(e.target.value)}
                    rows={2}
                    className="p-2.5 border border-[#d5ccbf] bg-transparent text-xs outline-none focus:border-[#24221f] font-sans"
                  />

                  <div className="flex gap-2.5 mt-2">
                    <button
                      type="button"
                      onClick={() => setCheckoutOpen(false)}
                      className="flex-grow p-3 border border-[#24221f] font-bold text-xs uppercase tracking-widest hover:bg-muted"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-grow p-3 bg-[#24221f] text-[#f3eee5] font-bold text-xs uppercase tracking-widest hover:opacity-90"
                    >
                      Confirm Order
                    </button>
                  </div>
                </form>
              ) : (
                <button className="primary-button w-full" onClick={() => setCheckoutOpen(true)}>
                  PROCEED TO CHECKOUT <ArrowRight size={16} />
                </button>
              )}
            </div>
          )}
        </aside>
      )}

      {/* Modal: Variant Selector popup */}
      {variantSelectorItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#24221f]/60 backdrop-blur-sm p-4">
          <div className="bg-[#f3eee5] border border-[#d5ccbf] w-full max-w-sm p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setVariantSelectorItem(null)} className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full border border-transparent hover:border-[#d5ccbf]">
              <X size={16} />
            </button>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#716b63]">Customize</p>
            <h3 className="font-serif text-2xl mb-1">{variantSelectorItem.name}</h3>
            <p className="text-xs text-[#716b63] mb-6">{variantSelectorItem.description}</p>
            
            <div className="flex flex-col gap-2.5 mb-6">
              <span className="text-xs font-bold uppercase tracking-widest text-[#716b63]">Select size/option:</span>
              {variantSelectorItem.variants?.map((v, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedVariantIdx(idx)}
                  className={`flex justify-between items-center p-3 border rounded text-xs tracking-wider transition-all font-semibold ${
                    selectedVariantIdx === idx
                      ? 'border-[#24221f] bg-[#24221f] text-[#f3eee5]'
                      : 'border-[#d5ccbf] hover:bg-[#d5ccbf]/20 text-[#24221f]'
                  }`}
                >
                  <span>{v.name}</span>
                  <strong>{v.price.toLocaleString()} PKR</strong>
                </button>
              ))}
            </div>

            <button
              onClick={confirmVariantAdd}
              className="w-full p-3 bg-[#24221f] text-[#f3eee5] font-bold text-xs uppercase tracking-widest hover:opacity-90 flex items-center justify-center gap-2"
            >
              Add to Order <Plus size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Modal: Client signup/login portal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#24221f]/60 backdrop-blur-sm p-4">
          <div className="bg-[#f3eee5] border border-[#d5ccbf] w-full max-w-md p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setShowAuthModal(false)
                setAuthError('')
              }}
              className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full border border-transparent hover:border-[#d5ccbf]"
            >
              <X size={16} />
            </button>

            <div className="text-center mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#716b63]">Welcome</p>
              <h2 className="font-serif text-3xl font-bold">{authMode === 'signup' ? 'Create Account' : 'Sign In'}</h2>
              <p className="text-xs text-[#716b63] mt-1.5">
                {authMode === 'signup' ? 'Sign up for a simple and faster checkout' : 'Sign in to access your orders'}
              </p>
            </div>

            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 text-xs font-semibold rounded text-center mb-4">
                {authError}
              </div>
            )}

            <form onSubmit={handleSignupLogin} className="flex flex-col gap-4 text-xs font-bold uppercase tracking-widest text-[#716b63]">
              {authMode === 'signup' && (
                <label className="flex flex-col gap-2">
                  Full Name *
                  <input
                    required
                    type="text"
                    placeholder="e.g. Bilal Ahmed"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="p-3 border border-[#d5ccbf] bg-transparent text-[#24221f] placeholder-[#716b63]/60 focus:border-[#24221f] outline-none"
                  />
                </label>
              )}

              <label className="flex flex-col gap-2">
                {authMode === 'signup' ? 'Email Address *' : 'Email or Phone Number *'}
                <input
                  required
                  type="text"
                  placeholder={authMode === 'signup' ? 'bilal@gmail.com' : 'e.g. bilal@gmail.com or 03001234567'}
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="p-3 border border-[#d5ccbf] bg-transparent text-[#24221f] placeholder-[#716b63]/60 focus:border-[#24221f] outline-none"
                />
              </label>

              {authMode === 'signup' && (
                <label className="flex flex-col gap-2">
                  Phone Number *
                  <input
                    required
                    type="tel"
                    placeholder="e.g. 03001234567"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    className="p-3 border border-[#d5ccbf] bg-transparent text-[#24221f] placeholder-[#716b63]/60 focus:border-[#24221f] outline-none"
                  />
                </label>
              )}

              <label className="flex flex-col gap-2">
                Password *
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="p-3 border border-[#d5ccbf] bg-transparent text-[#24221f] placeholder-[#716b63]/60 focus:border-[#24221f] outline-none"
                />
              </label>

              <button
                type="submit"
                className="mt-2 w-full p-3 bg-[#24221f] text-[#f3eee5] font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                {authMode === 'signup' ? 'Sign Up' : 'Sign In'}
              </button>
            </form>

            <div className="text-center mt-6 text-xs border-t border-[#d5ccbf]/60 pt-4">
              {authMode === 'signup' ? (
                <p className="text-muted-foreground font-medium">
                  Already have an account?{' '}
                  <button onClick={() => { setAuthMode('login'); setAuthError('') }} className="font-bold text-[#24221f] hover:underline">
                    Login
                  </button>
                </p>
              ) : (
                <p className="text-muted-foreground font-medium">
                  Don&apos;t have an account?{' '}
                  <button onClick={() => { setAuthMode('signup'); setAuthError('') }} className="font-bold text-[#24221f] hover:underline">
                    Sign Up
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
  )
}

/* SUBCOMPONENT: Home View */
function Home({ onMenu, onReserve }: { onMenu: () => void; onReserve: () => void }) {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">MODEL TOWN · LAHORE</p>
          <h1>Good coffee.<br /><em>Better company.</em></h1>
          <p className="lede">An all-day coffee house for slow mornings, long conversations, and the perfect second cup.</p>
          <div className="button-row">
            <button className="primary-button" onClick={onMenu}>
              VIEW THE MENU <ArrowRight size={16} />
            </button>
            <button className="secondary-button" onClick={onReserve}>
              RESERVE A TABLE
            </button>
          </div>
        </div>
        <div className="hero-image">
          <Image
            src="/double-shot-hero-hands.png"
            alt="Three hands holding coffee at Double Shot"
            fill
            priority
            sizes="(max-width: 800px) 100vw, 50vw"
          />
        </div>
      </section>
      <section className="intro-section">
        <p className="eyebrow">THE DOUBLE SHOT EDIT</p>
        <h2>Every moment<br /><em>crafted to return.</em></h2>
        <p>From the first carefully brewed cup to the final, lingering taste, every detail is composed with precision and purpose. Discover our signature drinks and the serene atmosphere made for staying a little longer.</p>
      </section>
      <section className="split-section">
        <div>
          <p className="eyebrow">ON THE BAR</p>
          <h2>Made for<br /><em>your mood.</em></h2>
          <button className="text-link" onClick={onMenu}>
            EXPLORE EVERYTHING <ArrowRight size={14} />
          </button>
        </div>
        <div className="feature-card feature-photo">
          <Image
            src="/double-shot-latte.png"
            alt="Latte from Double Shot"
            fill
            sizes="(max-width: 800px) 100vw, 33vw"
          />
          <div className="feature-overlay">
            <div className="feature-number">01</div>
            <h3>The classics</h3>
            <p>Espresso, flat whites and the quiet confidence of a well-pulled shot.</p>
          </div>
        </div>
        <div className="feature-card feature-photo">
          <Image
            src="/double-shot-croissant.png"
            alt="Croissant from Double Shot"
            fill
            sizes="(max-width: 800px) 100vw, 33vw"
          />
          <div className="feature-overlay">
            <div className="feature-number">02</div>
            <h3>Something to eat</h3>
            <p>Savoury plates, flaky layers and small sweet endings.</p>
          </div>
        </div>
      </section>
    </>
  )
}

/* SUBCOMPONENT: Menu Page View */
function MenuPage({ menuItems, onAdd }: { menuItems: MenuItem[]; onAdd: (item: MenuItem) => void }) {
  const [category, setCategory] = useState('All')
  
  // Exclude duplicates in UI & filter categories uniquely
  const categories = useMemo(() => {
    const uniqueCats = Array.from(new Set(menuItems.map((i) => i.category)))
    return ['All', ...uniqueCats]
  }, [menuItems])

  const filtered = useMemo(() => {
    // Only display items that are available/in-stock for customers
    const inStock = menuItems.filter(item => item.available)
    return category === 'All' ? inStock : inStock.filter((item) => item.category === category)
  }, [category, menuItems])

  return (
    <section className="menu-page">
      <div className="page-heading">
        <p className="eyebrow">THE MENU · MODEL TOWN</p>
        <h1>Good things,<br /><em>made daily.</em></h1>
        <p>Small rituals, big comfort. Everything is prepared in-house and served with care.</p>
      </div>
      <div className="category-row">
        {categories.map((item) => (
          <button
            key={item}
            className={category === item ? 'category active' : 'category'}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="menu-grid">
        {filtered.map((item) => (
          <article className="menu-item" key={item.id}>
            <div className="menu-art">
              <Image
                src={item.image}
                alt={`${item.name} from Double Shot`}
                fill
                sizes="(max-width: 800px) 100vw, 30vw"
                onError={(e) => {
                  // Fallback for missing/bad URLs
                  const img = e.currentTarget as HTMLImageElement
                  if (img) img.src = '/placeholder.jpg'
                }}
              />
            </div>
            <div className="menu-item-info">
              <div>
                <p className="eyebrow">{item.category}</p>
                <h3 className="flex items-start justify-between gap-2">
                  <span>{item.name}</span>
                </h3>
                <p className="mt-2 text-xs line-clamp-2">{item.description}</p>
                
                {/* Display variants badges if exists */}
                {item.variants && item.variants.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {item.variants.map((v, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-muted text-[8px] font-bold uppercase tracking-wider text-[#716b63]">
                        {v.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="menu-item-bottom">
                <strong>PKR {item.price.toLocaleString()}</strong>
                <button className="add-button" onClick={() => onAdd(item)} aria-label={`Add ${item.name} to order`}>
                  <Plus size={16} /> ADD
                </button>
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-muted-foreground">No products available in this category.</p>
        )}
      </div>
    </section>
  )
}

/* SUBCOMPONENT: Story View */
function Story() {
  return (
    <section className="content-page">
      <p className="eyebrow">OUR STORY</p>
      <h1>A room for<br /><em>good company.</em></h1>
      <div className="story-layout">
        <div>
          <p className="story-copy">Double Shot started with one simple idea: coffee tastes better when there is nowhere else you need to be. A neighbourhood living room for Model Town, built around thoughtful coffee, generous plates, and the people who make a place feel like home.</p>
          <div className="quote">“Stay for one. Stay for the afternoon.”</div>
        </div>
        <div className="story-image">
          <Image
            src="/double-shot-interior.png"
            alt="The Double Shot café interior"
            fill
            sizes="(max-width: 800px) 100vw, 45vw"
          />
        </div>
      </div>
    </section>
  )
}

/* SUBCOMPONENT: Reservations View */
function Reservations({ onReserve }: { onReserve: () => void }) {
  const [submitted, setSubmitted] = useState(false)
  return (
    <section className="form-page">
      <div>
        <p className="eyebrow">RESERVATIONS</p>
        <h1>Your table<br /><em>is waiting.</em></h1>
        <p>For breakfasts, catch-ups, and the moments worth lingering over.</p>
      </div>
      {submitted ? (
        <div className="confirmation border border-[#d5ccbf] shadow-sm">
          <Sparkles size={24} />
          <h2>We’ll see you soon.</h2>
          <p>Your table request is held for the Double Shot team to confirm.</p>
        </div>
      ) : (
        <form
          className="reservation-form"
          onSubmit={(e) => {
            e.preventDefault()
            setSubmitted(true)
            onReserve()
          }}
        >
          <label>
            Name
            <input required placeholder="Your name" className="outline-none focus:border-[#24221f]" />
          </label>
          <label>
            Phone
            <input required placeholder="+92 3XX XXXXXXX" className="outline-none focus:border-[#24221f]" />
          </label>
          <div className="form-grid">
            <label>
              Date
              <input required type="date" className="outline-none focus:border-[#24221f]" />
            </label>
            <label>
              Guests
              <select defaultValue="2" className="outline-none focus:border-[#24221f] bg-transparent">
                <option value="2">2 guests</option>
                <option value="3">3 guests</option>
                <option value="4">4 guests</option>
                <option value="5+">5+ guests</option>
              </select>
            </label>
          </div>
          <label>
            Notes
            <textarea placeholder="Anything we should know?" rows={3} className="outline-none focus:border-[#24221f] font-sans" />
          </label>
          <button className="primary-button" type="submit">
            REQUEST A TABLE <ArrowRight size={16} />
          </button>
        </form>
      )}
    </section>
  )
}

/* SUBCOMPONENT: Order Tracking Widget */
function OrderTrackingPanel({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const statusSteps = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery', 'Completed']
  
  const currentStepIdx = useMemo(() => {
    if (!order) return 0
    if (order.status === 'Cancelled') return -1
    return statusSteps.indexOf(order.status)
  }, [order])

  return (
    <section className="content-page min-h-[600px] flex items-center justify-center">
      <div className="bg-[#e9e0d4] border border-[#d5ccbf] p-6 md:p-10 w-full max-w-2xl rounded shadow-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-[#d5ccbf]/30 rounded-full">
          <X size={16} />
        </button>

        <div className="text-center mb-8 border-b border-[#d5ccbf] pb-6">
          <Sparkles className="text-yellow-600 mx-auto mb-2" size={26} />
          <h2 className="font-serif text-3xl font-bold">Your Order is Live!</h2>
          <p className="text-xs text-[#716b63] uppercase tracking-widest font-semibold mt-1">
            Order Reference: <span className="text-[#24221f] font-bold">{order?.id || 'DS-XXXX'}</span>
          </p>
        </div>

        {order ? (
          <div>
            {order.status === 'Cancelled' ? (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded text-center mb-6">
                <strong>This order has been Cancelled.</strong>
                <p className="text-xs mt-1">Please contact the café at +92 318 9119222 if you have any questions.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6 mb-8">
                <span className="text-xs font-bold uppercase tracking-widest text-[#716b63] text-center block">
                  Service Tracker Timeline
                </span>
                
                {/* Horizontal Progress Timeline */}
                <div className="relative flex flex-col md:flex-row justify-between items-center gap-6 md:gap-0 mt-4 px-2">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#d5ccbf] -translate-y-1/2 hidden md:block z-0" />
                  
                  {statusSteps.map((step, idx) => {
                    const isDone = idx <= currentStepIdx
                    const isCurrent = idx === currentStepIdx
                    return (
                      <div key={step} className="flex flex-row md:flex-col items-center gap-3 md:gap-2 z-10 w-full md:w-auto">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                          isCurrent
                            ? 'bg-[#24221f] text-[#f3eee5] ring-4 ring-[#24221f]/20 scale-110'
                            : isDone
                              ? 'bg-[#716b63] text-[#f3eee5]'
                              : 'bg-[#d5ccbf] text-[#716b63]'
                        }`}>
                          {idx + 1}
                        </div>
                        <span className={`text-[10px] uppercase font-bold tracking-wider ${
                          isCurrent ? 'text-[#24221f]' : 'text-[#716b63]'
                        }`}>
                          {step}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Order breakdown */}
            <div className="bg-[#f3eee5] border border-[#d5ccbf]/60 p-5 rounded text-xs flex flex-col gap-3">
              <h4 className="font-serif text-sm font-bold border-b border-[#d5ccbf]/40 pb-2">Order Summary</h4>
              <div className="flex justify-between items-center text-[#716b63]">
                <span>Customer</span>
                <span className="font-semibold text-[#24221f]">{order.customerName} ({order.customerPhone})</span>
              </div>
              <div className="flex justify-between items-start text-[#716b63]">
                <span>Items Ordered</span>
                <span className="font-semibold text-[#24221f] text-right max-w-sm">{order.itemsSummary}</span>
              </div>
              {order.notes && (
                <div className="flex justify-between items-center text-[#716b63]">
                  <span>Notes</span>
                  <span className="font-semibold text-[#24221f] italic">&quot;{order.notes}&quot;</span>
                </div>
              )}
              <div className="flex justify-between items-center text-[#716b63] border-t border-[#d5ccbf]/40 pt-2 font-bold text-sm">
                <span className="text-[#24221f]">Total Paid/Owed</span>
                <span className="text-[#24221f]">{order.total.toLocaleString()} PKR</span>
              </div>
            </div>
            
            <div className="flex justify-center mt-8 gap-4">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 border border-[#24221f] font-bold text-xs uppercase tracking-widest hover:bg-[#24221f] hover:text-[#f3eee5] transition-all flex items-center gap-1.5"
              >
                <RefreshCw size={12} /> Sync Status
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#24221f] text-[#f3eee5] font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Go to Home
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-sm text-[#716b63]">
            Connecting to order details...
          </div>
        )}
      </div>
    </section>
  )
}
