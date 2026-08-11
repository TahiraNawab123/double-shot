'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Plus, Trash2, Edit, Check, X, Shield, Users, ClipboardList, Coffee, LayoutDashboard, LogOut } from 'lucide-react'
import { clearSessionCookie, getRegisteredUsers, User } from '@/lib/auth-helpers'

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
  lastModifiedBy?: string;
  lastModifiedAt?: string;
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
  itemsSummary: string; // for backward compatibility/display
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

interface AuditEntry {
  when: string;
  by: string;
  action: string;
  details: string;
}

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [tab, setTab] = useState('Overview')
  
  // Modals
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // Loaded states
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [customers, setCustomers] = useState<User[]>([])

  // Manual Order Scratchpad State
  const [moCustomerName, setMoCustomerName] = useState('')
  const [moCustomerPhone, setMoCustomerPhone] = useState('')
  const [moCustomerEmail, setMoCustomerEmail] = useState('')
  const [moSource, setMoSource] = useState<'Manual/Phone' | 'Walk-in' | 'Other'>('Manual/Phone')
  const [moNotes, setMoNotes] = useState('')
  const [moDiscount, setMoDiscount] = useState(0)
  const [moPaymentMethod, setMoPaymentMethod] = useState('Cash')
  const [moPaymentStatus, setMoPaymentStatus] = useState<'Paid' | 'Unpaid'>('Unpaid')
  const [moStatus, setMoStatus] = useState<Order['status']>('Pending')

  // Scratchpad added items
  const [scratchItems, setScratchItems] = useState<OrderItem[]>([])
  // Adding standard item scratch state
  const [selectedMenuId, setSelectedMenuId] = useState('')
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(-1)
  const [standardQty, setStandardQty] = useState(1)
  // Adding custom item scratch state
  const [customItemName, setCustomItemName] = useState('')
  const [customItemPrice, setCustomItemPrice] = useState(0)
  const [customItemQty, setCustomItemQty] = useState(1)

  // Load staff/admin details and DB from localStorage
  useEffect(() => {
    // Current user check
    const rawUser = localStorage.getItem('currentUser')
    if (rawUser) {
      try {
        setCurrentUser(JSON.parse(rawUser))
      } catch {}
    }

    // Customers list
    setCustomers(getRegisteredUsers())

    // Menu Items
    const rawMenu = localStorage.getItem('menuItems')
    if (rawMenu) {
      try {
        setMenuItems(JSON.parse(rawMenu))
      } catch {}
    }

    // Load and normalize Orders
    const rawOrders = localStorage.getItem('adminOrders')
    if (rawOrders) {
      try {
        const parsed = JSON.parse(rawOrders)
        const normalized = parsed.map((o: any) => {
          if (Array.isArray(o)) {
            // Old format conversion: ['#DS-1042', 'Ayesha Khan', 'Flat White · Avocado Toast', 'Preparing', 'PKR 1,410', 'Ayesha Khan']
            const priceNum = parseInt(o[4]?.replace(/[^\d]/g, '') || '0', 10)
            return {
              id: o[0].replace('#', ''),
              customerName: o[1],
              customerPhone: '',
              customerEmail: '',
              source: 'Manual/Phone',
              items: [{ name: o[2], price: priceNum, quantity: 1 }],
              itemsSummary: o[2],
              subtotal: priceNum,
              discount: 0,
              total: priceNum,
              paymentMethod: 'Cash',
              paymentStatus: 'Unpaid',
              status: o[3],
              createdBy: o[5] || 'System',
              createdAt: new Date().toISOString()
            } as Order
          }
          return o as Order
        })
        setOrders(normalized)
      } catch {}
    }

    // Audit logs
    const rawAudit = localStorage.getItem('auditLog')
    if (rawAudit) {
      try {
        setAuditLog(JSON.parse(rawAudit))
      } catch {}
    }
  }, [])

  // Persisters
  const saveMenu = (updated: MenuItem[]) => {
    setMenuItems(updated)
    localStorage.setItem('menuItems', JSON.stringify(updated))
  }

  const saveOrders = (updated: Order[]) => {
    setOrders(updated)
    localStorage.setItem('adminOrders', JSON.stringify(updated))
  }

  const addAudit = (action: string, details: string) => {
    const entry: AuditEntry = {
      when: new Date().toISOString(),
      by: currentUser?.name || 'Staff',
      action,
      details
    }
    const updated = [entry, ...auditLog]
    setAuditLog(updated)
    localStorage.setItem('auditLog', JSON.stringify(updated))
  }

  const handleLogout = () => {
    clearSessionCookie()
    localStorage.removeItem('currentUser')
    window.location.href = '/'
  }

  // Statistics calculations
  const stats = useMemo(() => {
    const activeOrders = orders.filter(o => !['Completed', 'Cancelled'].includes(o.status)).length
    const totalSales = orders.filter(o => o.status === 'Completed').reduce((sum, o) => sum + o.total, 0)
    return {
      totalSales,
      totalOrders: orders.length,
      activeOrders,
      menuCount: menuItems.length
    }
  }, [orders, menuItems])

  // Generate unique DS-XXXX order ID
  const nextOrderId = useMemo(() => {
    if (orders.length === 0) return 'DS-1001'
    const numbers = orders.map(o => {
      const match = o.id.match(/DS-(\d+)/)
      return match ? parseInt(match[1], 10) : 1000
    })
    const maxNum = Math.max(...numbers, 1000)
    return `DS-${maxNum + 1}`
  }, [orders])

  // Add standard item to scratchpad
  const addStandardToScratch = () => {
    if (!selectedMenuId) return
    const item = menuItems.find(m => m.id === selectedMenuId)
    if (!item) return

    let price = item.price
    let variantName = ''

    if (item.variants && item.variants.length > 0 && selectedVariantIdx >= 0) {
      const variant = item.variants[selectedVariantIdx]
      price = variant.price
      variantName = variant.name
    }

    const newItem: OrderItem = {
      name: item.name,
      price,
      quantity: standardQty,
      variantName,
      isCustom: false
    }

    setScratchItems([...scratchItems, newItem])
    // Reset states
    setSelectedMenuId('')
    setSelectedVariantIdx(-1)
    setStandardQty(1)
  }

  // Add custom item to scratchpad
  const addCustomToScratch = () => {
    if (!customItemName.trim() || customItemPrice <= 0) return

    const newItem: OrderItem = {
      name: customItemName.trim(),
      price: customItemPrice,
      quantity: customItemQty,
      isCustom: true
    }

    setScratchItems([...scratchItems, newItem])
    // Reset states
    setCustomItemName('')
    setCustomItemPrice(0)
    setCustomItemQty(1)
  }

  // Remove item from scratchpad
  const removeScratchItem = (index: number) => {
    setScratchItems(scratchItems.filter((_, i) => i !== index))
  }

  // Calculate dynamic scratchpad totals
  const scratchTotals = useMemo(() => {
    const subtotal = scratchItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const total = Math.max(0, subtotal - moDiscount)
    return { subtotal, total }
  }, [scratchItems, moDiscount])

  // Submit manual order
  const handleCreateManualOrder = (e: React.FormEvent) => {
    e.preventDefault()
    if (!moCustomerName.trim() || !moCustomerPhone.trim()) {
      alert('Customer Name and Phone are required!')
      return
    }
    if (scratchItems.length === 0) {
      alert('Order must contain at least 1 item!')
      return
    }

    const itemsSummary = scratchItems.map(item => {
      const vText = item.variantName ? ` (${item.variantName})` : ''
      const typeText = item.isCustom ? ' [Custom]' : ''
      return `${item.name}${vText} x${item.quantity}${typeText}`
    }).join(' · ')

    const newOrder: Order = {
      id: nextOrderId,
      customerName: moCustomerName.trim(),
      customerPhone: moCustomerPhone.trim(),
      customerEmail: moCustomerEmail.trim() || undefined,
      source: moSource,
      items: scratchItems,
      itemsSummary,
      subtotal: scratchTotals.subtotal,
      discount: moDiscount,
      total: scratchTotals.total,
      paymentMethod: moPaymentMethod,
      paymentStatus: moPaymentStatus,
      status: moStatus,
      notes: moNotes.trim() || undefined,
      createdBy: currentUser?.name || 'Staff',
      createdAt: new Date().toISOString()
    }

    const updated = [newOrder, ...orders]
    saveOrders(updated)
    addAudit('create-order', `Created manual order ${newOrder.id} for ${newOrder.customerName}`)

    // Reset Form
    setMoCustomerName('')
    setMoCustomerPhone('')
    setMoCustomerEmail('')
    setMoNotes('')
    setMoDiscount(0)
    setScratchItems([])
    alert(`Order ${newOrder.id} logged successfully!`)
  }

  // Update order status
  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, status } : o)
    saveOrders(updated)
    addAudit('update-order-status', `Updated order ${orderId} status to ${status}`)
  }

  // Update payment status
  const handleUpdatePaymentStatus = (orderId: string, paymentStatus: Order['paymentStatus']) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, paymentStatus } : o)
    saveOrders(updated)
    addAudit('update-payment-status', `Updated order ${orderId} payment to ${paymentStatus}`)
  }

  // Add new Menu Item (includes duplicate checking)
  const handleAddMenuItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const name = String(f.get('name') || '').trim()
    const category = String(f.get('category') || 'Coffee').trim()
    const price = Number(f.get('price') || 0)
    const description = String(f.get('description') || '').trim()
    const image = String(f.get('image') || '/placeholder.jpg').trim()
    const featured = f.get('featured') === 'true'
    const available = f.get('available') === 'true'

    const id = name.toLowerCase().replace(/\s+/g, '-')

    // Duplicate Check
    if (menuItems.some(item => item.name.toLowerCase() === name.toLowerCase() || item.id === id)) {
      alert('Error: A product with this name already exists in the menu!')
      return
    }

    // Parse Variants
    const rawVariants = String(f.get('variants') || '').trim()
    const variants: Variant[] = []
    if (rawVariants) {
      // Expecting Format: Regular:520, Large:600
      const parts = rawVariants.split(',')
      for (const p of parts) {
        const [vName, vPrice] = p.split(':')
        if (vName && vPrice) {
          variants.push({
            name: vName.trim(),
            price: Number(vPrice) || 0
          })
        }
      }
    }

    const newItem: MenuItem = {
      id,
      name,
      description,
      price: variants.length > 0 ? variants[0].price : price, // default to first variant or base price
      category,
      image,
      variants: variants.length > 0 ? variants : undefined,
      available,
      featured,
      createdBy: currentUser?.name || 'System',
      createdAt: new Date().toISOString(),
      lastModifiedBy: currentUser?.name || 'System',
      lastModifiedAt: new Date().toISOString()
    }

    saveMenu([...menuItems, newItem])
    addAudit('add-menu-item', `Created menu item ${newItem.name}`)
    setShowAddModal(false)
    e.currentTarget.reset()
  }

  // Edit Menu Item
  const handleEditMenuItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingItem) return

    const f = new FormData(e.currentTarget)
    const name = String(f.get('name') || '').trim()
    const category = String(f.get('category') || '').trim()
    const price = Number(f.get('price') || 0)
    const description = String(f.get('description') || '').trim()
    const image = String(f.get('image') || '').trim()
    const featured = f.get('featured') === 'true'
    const available = f.get('available') === 'true'

    // Duplicate check if name changed
    if (name.toLowerCase() !== editingItem.name.toLowerCase()) {
      const newId = name.toLowerCase().replace(/\s+/g, '-')
      if (menuItems.some(item => (item.name.toLowerCase() === name.toLowerCase() || item.id === newId) && item.id !== editingItem.id)) {
        alert('Error: A product with this name already exists!')
        return
      }
    }

    // Parse Variants
    const rawVariants = String(f.get('variants') || '').trim()
    const variants: Variant[] = []
    if (rawVariants) {
      const parts = rawVariants.split(',')
      for (const p of parts) {
        const [vName, vPrice] = p.split(':')
        if (vName && vPrice) {
          variants.push({
            name: vName.trim(),
            price: Number(vPrice) || 0
          })
        }
      }
    }

    const updated = menuItems.map(item => {
      if (item.id === editingItem.id) {
        return {
          ...item,
          name,
          category,
          price: variants.length > 0 ? variants[0].price : price,
          description,
          image,
          variants: variants.length > 0 ? variants : undefined,
          featured,
          available,
          lastModifiedBy: currentUser?.name || 'System',
          lastModifiedAt: new Date().toISOString()
        } as MenuItem
      }
      return item
    })

    saveMenu(updated)
    addAudit('edit-menu-item', `Updated menu item ${name}`)
    setEditingItem(null)
  }

  // Archive / Delete Menu Item
  const handleDeleteMenuItem = (itemId: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete/archive "${itemName}"?`)) return
    const updated = menuItems.filter(item => item.id !== itemId)
    saveMenu(updated)
    addAudit('delete-menu-item', `Archived/Deleted menu item ${itemName}`)
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#f3eee5] text-[#24221f] font-sans">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#e9e0d4] border-r border-[#d5ccbf] flex flex-col p-6">
        <div className="flex items-center gap-2 mb-8">
          <Shield className="text-[#24221f]" size={28} />
          <div>
            <h1 className="font-serif text-lg font-bold leading-tight tracking-wider">DOUBLE SHOT</h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#716b63] -mt-1">ADMIN SPACE</p>
          </div>
        </div>

        <div className="mb-6 p-3 bg-[#f3eee5]/50 border border-[#d5ccbf]/60 rounded">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#716b63]">Logged in as</p>
          <p className="text-sm font-semibold">{currentUser?.name || 'Staff Member'}</p>
          <p className="text-[10px] text-[#716b63]">{currentUser?.email}</p>
        </div>

        <nav className="flex flex-col gap-2 flex-grow">
          {[
            { name: 'Overview', icon: <LayoutDashboard size={16} /> },
            { name: 'Orders', icon: <ClipboardList size={16} /> },
            { name: 'Menu', icon: <Coffee size={16} /> },
            { name: 'Customers', icon: <Users size={16} /> },
            { name: 'Audit Log', icon: <ClipboardList size={16} /> }
          ].map(item => (
            <button
              key={item.name}
              onClick={() => setTab(item.name)}
              className={`flex items-center gap-3 px-4 py-3 rounded text-sm font-medium tracking-wide transition-all ${
                tab === item.name
                  ? 'bg-[#24221f] text-[#f3eee5]'
                  : 'hover:bg-[#d5ccbf]/40 text-[#716b63] hover:text-[#24221f]'
              }`}
            >
              {item.icon}
              {item.name}
            </button>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 rounded transition-all border border-transparent hover:border-red-200"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full overflow-x-hidden">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#d5ccbf] pb-6 mb-8">
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-[#716b63]">Dashboard</p>
            <h2 className="font-serif text-3xl md:text-4xl">{tab}</h2>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 border border-[#24221f] font-bold text-xs uppercase tracking-widest hover:bg-[#24221f] hover:text-[#f3eee5] transition-all"
          >
            Open Storefront
          </a>
        </div>

        {/* TAB content: Overview */}
        {tab === 'Overview' && (
          <div className="flex flex-col gap-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Total Sales (PKR)', value: stats.totalSales.toLocaleString() + ' PKR' },
                { title: 'Total Orders', value: stats.totalOrders },
                { title: 'Active Orders', value: stats.activeOrders },
                { title: 'Menu Items', value: stats.menuCount }
              ].map((card, idx) => (
                <div key={idx} className="bg-[#e9e0d4] border border-[#d5ccbf] p-6 rounded shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#716b63]">{card.title}</p>
                  <p className="font-serif text-2xl md:text-3xl mt-2 font-bold">{card.value}</p>
                </div>
              ))}
            </div>

            {/* Content Splits: Recent Orders and Audit */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Orders Panel */}
              <div className="bg-[#e9e0d4] border border-[#d5ccbf] p-6 rounded">
                <h3 className="font-serif text-xl font-bold border-b border-[#d5ccbf] pb-3 mb-4">Recent Active Orders</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#d5ccbf] text-[#716b63] uppercase tracking-wider font-bold">
                        <th className="py-2 pr-2">ID</th>
                        <th className="py-2 pr-2">Customer</th>
                        <th className="py-2 pr-2">Items</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.filter(o => !['Completed', 'Cancelled'].includes(o.status)).slice(0, 5).map(o => (
                        <tr key={o.id} className="border-b border-[#d5ccbf]/50 hover:bg-[#f3eee5]/30">
                          <td className="py-3 pr-2 font-bold">{o.id}</td>
                          <td className="py-3 pr-2">{o.customerName}</td>
                          <td className="py-3 pr-2 truncate max-w-[150px]" title={o.itemsSummary}>{o.itemsSummary}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-[#24221f] text-[#f3eee5]">
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {orders.filter(o => !['Completed', 'Cancelled'].includes(o.status)).length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-[#716b63]">No active orders right now.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Activity Panel */}
              <div className="bg-[#e9e0d4] border border-[#d5ccbf] p-6 rounded">
                <h3 className="font-serif text-xl font-bold border-b border-[#d5ccbf] pb-3 mb-4">Recent Staff Actions</h3>
                <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2">
                  {auditLog.slice(0, 6).map((log, idx) => (
                    <div key={idx} className="border-b border-[#d5ccbf]/40 pb-3 last:border-b-0">
                      <div className="flex justify-between items-center text-[10px] text-[#716b63] mb-1">
                        <strong className="text-[#24221f]">{log.by}</strong>
                        <span>{new Date(log.when).toLocaleString()}</span>
                      </div>
                      <p className="text-xs">
                        <span className="font-bold text-[#24221f] uppercase tracking-wider mr-2 text-[9px] bg-[#d5ccbf]/60 px-1 py-0.5 rounded">
                          {log.action}
                        </span>
                        {log.details}
                      </p>
                    </div>
                  ))}
                  {auditLog.length === 0 && (
                    <p className="text-center text-xs text-[#716b63] py-4">No logged actions yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB content: Orders */}
        {tab === 'Orders' && (
          <div className="flex flex-col gap-10">
            {/* Manual Order Creation Panel */}
            <div className="bg-[#e9e0d4] border border-[#d5ccbf] p-6 rounded">
              <h3 className="font-serif text-xl font-bold border-b border-[#d5ccbf] pb-3 mb-6">Create Manual Order (Phone/Walk-in)</h3>
              
              <form onSubmit={handleCreateManualOrder} className="flex flex-col gap-6">
                {/* Section 1: Customer Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-widest text-[#716b63]">
                    Customer Name *
                    <input
                      required
                      type="text"
                      placeholder="e.g. Bilal Ahmed"
                      value={moCustomerName}
                      onChange={(e) => setMoCustomerName(e.target.value)}
                      className="p-3 border border-[#d5ccbf] bg-transparent text-[#24221f] placeholder-[#716b63]/60 focus:border-[#24221f] outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-widest text-[#716b63]">
                    Phone Number *
                    <input
                      required
                      type="tel"
                      placeholder="e.g. 03001234567"
                      value={moCustomerPhone}
                      onChange={(e) => setMoCustomerPhone(e.target.value)}
                      className="p-3 border border-[#d5ccbf] bg-transparent text-[#24221f] placeholder-[#716b63]/60 focus:border-[#24221f] outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-widest text-[#716b63]">
                    Email Address
                    <input
                      type="email"
                      placeholder="e.g. bilal@gmail.com"
                      value={moCustomerEmail}
                      onChange={(e) => setMoCustomerEmail(e.target.value)}
                      className="p-3 border border-[#d5ccbf] bg-transparent text-[#24221f] placeholder-[#716b63]/60 focus:border-[#24221f] outline-none"
                    />
                  </label>
                </div>

                {/* Section 2: Adding Items (Dynamic builder) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 border-y border-[#d5ccbf]/60 py-6">
                  {/* Left: Add Standard Menu Item */}
                  <div className="flex flex-col gap-4 border-r border-[#d5ccbf]/40 pr-0 lg:pr-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#24221f]">Add Standard Menu Item</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <select
                        value={selectedMenuId}
                        onChange={(e) => {
                          setSelectedMenuId(e.target.value)
                          setSelectedVariantIdx(-1)
                        }}
                        className="flex-grow p-3 border border-[#d5ccbf] bg-[#e9e0d4] text-[#24221f] focus:border-[#24221f] outline-none"
                      >
                        <option value="">Select menu item...</option>
                        {menuItems.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.price.toLocaleString()} PKR)
                          </option>
                        ))}
                      </select>

                      {/* Variant Selection if available */}
                      {selectedMenuId && menuItems.find(m => m.id === selectedMenuId)?.variants && (
                        <select
                          value={selectedVariantIdx}
                          onChange={(e) => setSelectedVariantIdx(Number(e.target.value))}
                          className="p-3 border border-[#d5ccbf] bg-[#e9e0d4] text-[#24221f] focus:border-[#24221f] outline-none"
                        >
                          <option value="-1">Base Variant</option>
                          {menuItems.find(m => m.id === selectedMenuId)?.variants?.map((v, idx) => (
                            <option key={idx} value={idx}>
                              {v.name} ({v.price.toLocaleString()} PKR)
                            </option>
                          ))}
                        </select>
                      )}

                      <input
                        type="number"
                        min="1"
                        value={standardQty}
                        onChange={(e) => setStandardQty(Math.max(1, Number(e.target.value)))}
                        className="w-20 p-3 border border-[#d5ccbf] bg-transparent text-[#24221f] text-center focus:border-[#24221f] outline-none"
                      />
                      <button
                        type="button"
                        onClick={addStandardToScratch}
                        className="px-4 py-3 bg-[#24221f] text-[#f3eee5] font-bold text-xs uppercase tracking-wider hover:opacity-90"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Right: Add Custom Item (Not on Menu) */}
                  <div className="flex flex-col gap-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#24221f]">Add Custom Item (e.g. Phone Requests)</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        placeholder="Custom Item Name (e.g. Cheese toast, no honey)"
                        value={customItemName}
                        onChange={(e) => setCustomItemName(e.target.value)}
                        className="flex-grow p-3 border border-[#d5ccbf] bg-transparent text-[#24221f] placeholder-[#716b63]/60 focus:border-[#24221f] outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={customItemPrice || ''}
                        onChange={(e) => setCustomItemPrice(Math.max(0, Number(e.target.value)))}
                        className="w-24 p-3 border border-[#d5ccbf] bg-transparent text-[#24221f] focus:border-[#24221f] outline-none"
                      />
                      <input
                        type="number"
                        min="1"
                        value={customItemQty}
                        onChange={(e) => setCustomItemQty(Math.max(1, Number(e.target.value)))}
                        className="w-20 p-3 border border-[#d5ccbf] bg-transparent text-[#24221f] text-center focus:border-[#24221f] outline-none"
                      />
                      <button
                        type="button"
                        onClick={addCustomToScratch}
                        className="px-4 py-3 bg-[#24221f] text-[#f3eee5] font-bold text-xs uppercase tracking-wider hover:opacity-90"
                      >
                        Add Custom
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section 3: Order Summary list */}
                <div className="border-b border-[#d5ccbf]/60 pb-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#716b63] mb-3">Order Items Breakdown</p>
                  
                  {scratchItems.length === 0 ? (
                    <p className="text-xs italic text-[#716b63]">No items added to this order yet.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {scratchItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-[#f3eee5]/50 border border-[#d5ccbf]/50 p-3 rounded">
                          <div className="text-xs">
                            <span className="font-bold">{item.name}</span>
                            {item.variantName && <span className="ml-2 px-1.5 py-0.5 rounded bg-[#24221f]/10 text-[9px] uppercase font-bold text-[#716b63]">{item.variantName}</span>}
                            {item.isCustom && <span className="ml-2 px-1.5 py-0.5 rounded bg-yellow-100 text-[9px] uppercase font-bold text-yellow-800">Custom</span>}
                            <span className="ml-4 text-[#716b63]">{item.price.toLocaleString()} PKR x {item.quantity}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-bold">{(item.price * item.quantity).toLocaleString()} PKR</span>
                            <button
                              type="button"
                              onClick={() => removeScratchItem(idx)}
                              className="text-red-700 hover:text-red-900 transition-colors p-1"
                              aria-label="Remove item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section 4: Metadata and Totals */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                  <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-widest text-[#716b63]">
                    Order Source
                    <select
                      value={moSource}
                      onChange={(e) => setMoSource(e.target.value as any)}
                      className="p-3 border border-[#d5ccbf] bg-[#e9e0d4] text-[#24221f] focus:border-[#24221f] outline-none"
                    >
                      <option value="Manual/Phone">Manual / Phone Order</option>
                      <option value="Walk-in">Walk-in Order</option>
                      <option value="Other">Other / Call-in</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-widest text-[#716b63]">
                    Discount (PKR)
                    <input
                      type="number"
                      min="0"
                      value={moDiscount || ''}
                      onChange={(e) => setMoDiscount(Math.max(0, Number(e.target.value)))}
                      className="p-3 border border-[#d5ccbf] bg-transparent text-[#24221f] focus:border-[#24221f] outline-none"
                    />
                  </label>

                  <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-widest text-[#716b63]">
                    Payment Mode & Status
                    <div className="flex gap-2">
                      <select
                        value={moPaymentMethod}
                        onChange={(e) => setMoPaymentMethod(e.target.value)}
                        className="flex-grow p-3 border border-[#d5ccbf] bg-[#e9e0d4] text-[#24221f] focus:border-[#24221f] outline-none"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="Online Transfer">Online Transfer</option>
                      </select>
                      <select
                        value={moPaymentStatus}
                        onChange={(e) => setMoPaymentStatus(e.target.value as any)}
                        className="p-3 border border-[#d5ccbf] bg-[#e9e0d4] text-[#24221f] focus:border-[#24221f] outline-none"
                      >
                        <option value="Unpaid">Unpaid</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </div>
                  </label>

                  <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-widest text-[#716b63]">
                    Status
                    <select
                      value={moStatus}
                      onChange={(e) => setMoStatus(e.target.value as any)}
                      className="p-3 border border-[#d5ccbf] bg-[#e9e0d4] text-[#24221f] focus:border-[#24221f] outline-none"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Preparing">Preparing</option>
                      <option value="Ready">Ready</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </label>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-start md:items-end justify-between mt-2">
                  <label className="w-full md:max-w-md flex flex-col gap-2 text-xs font-bold uppercase tracking-widest text-[#716b63]">
                    Special Instructions / Notes
                    <textarea
                      placeholder="e.g. Add extra sugar, drop off at shop #3"
                      value={moNotes}
                      onChange={(e) => setMoNotes(e.target.value)}
                      rows={2}
                      className="p-3 border border-[#d5ccbf] bg-transparent text-[#24221f] placeholder-[#716b63]/60 focus:border-[#24221f] outline-none"
                    />
                  </label>

                  <div className="w-full md:w-auto text-right flex flex-col gap-1">
                    <p className="text-xs text-[#716b63]">Subtotal: <span className="font-bold">{scratchTotals.subtotal.toLocaleString()} PKR</span></p>
                    {moDiscount > 0 && <p className="text-xs text-red-700">Discount: -{moDiscount.toLocaleString()} PKR</p>}
                    <h4 className="font-serif text-xl font-bold">Total: {scratchTotals.total.toLocaleString()} PKR</h4>
                    <button
                      type="submit"
                      className="mt-2 w-full md:w-auto px-6 py-3 bg-[#24221f] text-[#f3eee5] font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
                    >
                      Create Order ({nextOrderId})
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Orders Database Table */}
            <div className="bg-[#e9e0d4] border border-[#d5ccbf] p-6 rounded">
              <h3 className="font-serif text-xl font-bold border-b border-[#d5ccbf] pb-3 mb-6">Orders Database</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[900px]">
                  <thead>
                    <tr className="border-b border-[#d5ccbf] text-[#716b63] uppercase tracking-wider font-bold">
                      <th className="py-2 pr-3">Order ID</th>
                      <th className="py-2 pr-3">Source</th>
                      <th className="py-2 pr-3">Customer</th>
                      <th className="py-2 pr-3">Items</th>
                      <th className="py-2 pr-3 text-right">Total</th>
                      <th className="py-2 pr-3">Payment</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Logged By</th>
                      <th className="py-2">Date/Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id} className="border-b border-[#d5ccbf]/50 hover:bg-[#f3eee5]/30">
                        <td className="py-3 pr-3 font-bold">{o.id}</td>
                        <td className="py-3 pr-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                            o.source === 'Website' ? 'bg-blue-100 text-blue-800' : 'bg-[#24221f]/10 text-[#716b63]'
                          }`}>
                            {o.source}
                          </span>
                        </td>
                        <td className="py-3 pr-3">
                          <div className="font-semibold">{o.customerName}</div>
                          <div className="text-[10px] text-[#716b63]">{o.customerPhone}</div>
                        </td>
                        <td className="py-3 pr-3 max-w-[200px] truncate" title={o.itemsSummary}>
                          {o.itemsSummary}
                          {o.notes && <div className="text-[9px] text-[#716b63] italic mt-0.5">Note: {o.notes}</div>}
                        </td>
                        <td className="py-3 pr-3 text-right font-bold">{o.total.toLocaleString()} PKR</td>
                        <td className="py-3 pr-3">
                          <select
                            value={o.paymentStatus}
                            onChange={(e) => handleUpdatePaymentStatus(o.id, e.target.value as any)}
                            className="bg-transparent border border-[#d5ccbf]/60 p-1 text-[11px] rounded outline-none"
                          >
                            <option value="Unpaid">Unpaid</option>
                            <option value="Paid">Paid</option>
                          </select>
                        </td>
                        <td className="py-3 pr-3">
                          <select
                            value={o.status}
                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value as any)}
                            className="bg-transparent border border-[#d5ccbf]/60 p-1 text-[11px] font-bold rounded outline-none"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Preparing">Preparing</option>
                            <option value="Ready">Ready</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="py-3 pr-3 text-[#716b63]">{o.createdBy}</td>
                        <td className="py-3 text-[#716b63] white-space-nowrap">
                          {new Date(o.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-6 text-center text-sm text-[#716b63]">No orders in the database.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB content: Menu Management */}
        {tab === 'Menu' && (
          <div className="flex flex-col gap-8">
            <div className="flex justify-between items-center">
              <h3 className="font-serif text-xl font-bold">Manage Menu Products</h3>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#24221f] text-[#f3eee5] text-xs font-bold uppercase tracking-wider hover:opacity-90"
              >
                <Plus size={14} /> Add Product
              </button>
            </div>

            {/* Menu List Table */}
            <div className="bg-[#e9e0d4] border border-[#d5ccbf] p-6 rounded">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-[#d5ccbf] text-[#716b63] uppercase tracking-wider font-bold">
                      <th className="py-2 pr-3">Product</th>
                      <th className="py-2 pr-3">Category</th>
                      <th className="py-2 pr-3 text-right">Base Price</th>
                      <th className="py-2 pr-3">Variants</th>
                      <th className="py-2 pr-3 text-center">Status</th>
                      <th className="py-2 pr-3">Attribution</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuItems.map(item => (
                      <tr key={item.id} className="border-b border-[#d5ccbf]/50 hover:bg-[#f3eee5]/30">
                        {/* Product Detail */}
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 bg-white/40 border border-[#d5ccbf]/50 overflow-hidden flex items-center justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={item.image} alt={item.name} className="object-cover w-full h-full" onError={(e) => { (e.target as any).src = '/placeholder.jpg' }} />
                            </div>
                            <div>
                              <strong className="text-sm font-semibold">{item.name}</strong>
                              <p className="text-[10px] text-[#716b63] truncate max-w-[200px]" title={item.description}>{item.description}</p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 pr-3 text-sm">{item.category}</td>

                        {/* Price */}
                        <td className="py-3 pr-3 text-right font-bold text-sm">{item.price.toLocaleString()} PKR</td>

                        {/* Variants */}
                        <td className="py-3 pr-3">
                          {item.variants && item.variants.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {item.variants.map((v, vIdx) => (
                                <span key={vIdx} className="px-1.5 py-0.5 rounded bg-[#24221f]/10 text-[9px] uppercase tracking-wide text-[#716b63]" title={`${v.price} PKR`}>
                                  {v.name}: {v.price}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-[#716b63] italic">No variants</span>
                          )}
                        </td>

                        {/* Status / Availability */}
                        <td className="py-3 pr-3 text-center">
                          <button
                            onClick={() => {
                              const updated = menuItems.map(m => m.id === item.id ? { ...m, available: !m.available } : m)
                              saveMenu(updated)
                              addAudit('toggle-availability', `Toggled availability of ${item.name} to ${!item.available}`)
                            }}
                            className={`px-2.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold transition-all ${
                              item.available
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}
                          >
                            {item.available ? 'In Stock' : 'Out of Stock'}
                          </button>
                        </td>

                        {/* Attribution */}
                        <td className="py-3 pr-3">
                          <div className="text-[10px]">
                            <div>Added by: <span className="font-semibold text-[#24221f]">{item.createdBy || 'System'}</span></div>
                            {item.lastModifiedBy && item.lastModifiedBy !== item.createdBy && (
                              <div className="text-[#716b63]">Modified by: <span className="font-medium">{item.lastModifiedBy}</span></div>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingItem(item)}
                              className="p-1 border border-[#d5ccbf] hover:bg-[#24221f] hover:text-[#f3eee5] hover:border-[#24221f] transition-all rounded"
                              title="Edit item"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteMenuItem(item.id, item.name)}
                              className="p-1 border border-red-300 text-red-700 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all rounded"
                              title="Delete/Archive item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {menuItems.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-[#716b63]">No menu items found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal: ADD Product */}
            {showAddModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-[#f3eee5] border border-[#d5ccbf] w-full max-w-lg p-6 rounded shadow-2xl relative animate-in zoom-in-95 duration-200">
                  <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 p-2 hover:bg-[#d5ccbf]/30 rounded">
                    <X size={18} />
                  </button>
                  <h3 className="font-serif text-2xl mb-4 border-b border-[#d5ccbf] pb-2">Add New Menu Item</h3>
                  
                  <form onSubmit={handleAddMenuItem} className="flex flex-col gap-4 text-xs font-bold uppercase tracking-widest text-[#716b63]">
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex flex-col gap-1.5">
                        Product Name *
                        <input required name="name" type="text" placeholder="e.g. Spanish Latte" className="p-2.5 border border-[#d5ccbf] bg-transparent text-[#24221f] focus:border-[#24221f] outline-none" />
                      </label>
                      <label className="flex flex-col gap-1.5">
                        Category *
                        <select required name="category" className="p-2.5 border border-[#d5ccbf] bg-[#f3eee5] text-[#24221f] focus:border-[#24221f] outline-none">
                          <option value="Coffee">Coffee</option>
                          <option value="Cold">Cold Drinks</option>
                          <option value="Bakes">Bakes</option>
                          <option value="Plates">Plates</option>
                          <option value="Sweet">Sweet</option>
                        </select>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex flex-col gap-1.5">
                        Price (PKR) - base *
                        <input required name="price" type="number" placeholder="e.g. 520" className="p-2.5 border border-[#d5ccbf] bg-transparent text-[#24221f] focus:border-[#24221f] outline-none" />
                      </label>
                      <label className="flex flex-col gap-1.5">
                        Image URL
                        <input name="image" type="text" placeholder="/double-shot-latte.png" className="p-2.5 border border-[#d5ccbf] bg-transparent text-[#24221f] focus:border-[#24221f] outline-none" />
                      </label>
                    </div>

                    <label className="flex flex-col gap-1.5">
                      Variants (Optional)
                      <span className="text-[9px] lowercase font-normal text-[#716b63] -mt-1">Format: Regular:520, Large:600</span>
                      <input name="variants" type="text" placeholder="Regular:520, Large:600" className="p-2.5 border border-[#d5ccbf] bg-transparent text-[#24221f] focus:border-[#24221f] outline-none" />
                    </label>

                    <label className="flex flex-col gap-1.5 font-bold">
                      Description *
                      <textarea required name="description" rows={3} placeholder="Describe the item..." className="p-2.5 border border-[#d5ccbf] bg-transparent text-[#24221f] focus:border-[#24221f] outline-none font-sans" />
                    </label>

                    <div className="flex gap-6 py-2">
                      <label className="flex flex-row items-center gap-2 cursor-pointer normal-case">
                        <input type="checkbox" name="available" value="true" defaultChecked className="w-4 h-4 accent-[#24221f]" />
                        <span>Available in Stock</span>
                      </label>
                      <label className="flex flex-row items-center gap-2 cursor-pointer normal-case">
                        <input type="checkbox" name="featured" value="true" className="w-4 h-4 accent-[#24221f]" />
                        <span>Featured / Popular Item</span>
                      </label>
                    </div>

                    <div className="flex gap-3 justify-end mt-2">
                      <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-[#24221f] text-xs uppercase hover:bg-[#d5ccbf]/20">Cancel</button>
                      <button type="submit" className="px-4 py-2 bg-[#24221f] text-[#f3eee5] text-xs uppercase hover:opacity-90">Save Product</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal: EDIT Product */}
            {editingItem && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-[#f3eee5] border border-[#d5ccbf] w-full max-w-lg p-6 rounded shadow-2xl relative animate-in zoom-in-95 duration-200">
                  <button onClick={() => setEditingItem(null)} className="absolute top-4 right-4 p-2 hover:bg-[#d5ccbf]/30 rounded">
                    <X size={18} />
                  </button>
                  <h3 className="font-serif text-2xl mb-4 border-b border-[#d5ccbf] pb-2">Edit Product: {editingItem.name}</h3>
                  
                  <form onSubmit={handleEditMenuItem} className="flex flex-col gap-4 text-xs font-bold uppercase tracking-widest text-[#716b63]">
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex flex-col gap-1.5">
                        Product Name *
                        <input required name="name" type="text" defaultValue={editingItem.name} className="p-2.5 border border-[#d5ccbf] bg-transparent text-[#24221f] focus:border-[#24221f] outline-none" />
                      </label>
                      <label className="flex flex-col gap-1.5">
                        Category *
                        <select required name="category" defaultValue={editingItem.category} className="p-2.5 border border-[#d5ccbf] bg-[#f3eee5] text-[#24221f] focus:border-[#24221f] outline-none">
                          <option value="Coffee">Coffee</option>
                          <option value="Cold">Cold Drinks</option>
                          <option value="Bakes">Bakes</option>
                          <option value="Plates">Plates</option>
                          <option value="Sweet">Sweet</option>
                        </select>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex flex-col gap-1.5">
                        Price (PKR) - base *
                        <input required name="price" type="number" defaultValue={editingItem.price} className="p-2.5 border border-[#d5ccbf] bg-transparent text-[#24221f] focus:border-[#24221f] outline-none" />
                      </label>
                      <label className="flex flex-col gap-1.5">
                        Image URL
                        <input name="image" type="text" defaultValue={editingItem.image} className="p-2.5 border border-[#d5ccbf] bg-transparent text-[#24221f] focus:border-[#24221f] outline-none" />
                      </label>
                    </div>

                    <label className="flex flex-col gap-1.5 font-bold">
                      Variants (Optional)
                      <span className="text-[9px] lowercase font-normal text-[#716b63] -mt-1">Format: Regular:520, Large:600</span>
                      <input
                        name="variants"
                        type="text"
                        defaultValue={editingItem.variants?.map(v => `${v.name}:${v.price}`).join(', ') || ''}
                        placeholder="Regular:520, Large:600"
                        className="p-2.5 border border-[#d5ccbf] bg-transparent text-[#24221f] focus:border-[#24221f] outline-none"
                      />
                    </label>

                    <label className="flex flex-col gap-1.5 font-bold">
                      Description *
                      <textarea required name="description" rows={3} defaultValue={editingItem.description} className="p-2.5 border border-[#d5ccbf] bg-transparent text-[#24221f] focus:border-[#24221f] outline-none font-sans" />
                    </label>

                    <div className="flex gap-6 py-2">
                      <label className="flex flex-row items-center gap-2 cursor-pointer normal-case">
                        <input type="checkbox" name="available" value="true" defaultChecked={editingItem.available} className="w-4 h-4 accent-[#24221f]" />
                        <span>Available in Stock</span>
                      </label>
                      <label className="flex flex-row items-center gap-2 cursor-pointer normal-case">
                        <input type="checkbox" name="featured" value="true" defaultChecked={editingItem.featured} className="w-4 h-4 accent-[#24221f]" />
                        <span>Featured / Popular Item</span>
                      </label>
                    </div>

                    <div className="flex gap-3 justify-end mt-2">
                      <button type="button" onClick={() => setEditingItem(null)} className="px-4 py-2 border border-[#24221f] text-xs uppercase hover:bg-[#d5ccbf]/20">Cancel</button>
                      <button type="submit" className="px-4 py-2 bg-[#24221f] text-[#f3eee5] text-xs uppercase hover:opacity-90">Update Product</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB content: Customers list */}
        {tab === 'Customers' && (
          <div className="bg-[#e9e0d4] border border-[#d5ccbf] p-6 rounded">
            <h3 className="font-serif text-xl font-bold border-b border-[#d5ccbf] pb-3 mb-6">Registered System Users</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#d5ccbf] text-[#716b63] uppercase tracking-wider font-bold">
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Email Address</th>
                    <th className="py-2 pr-3">Phone Number</th>
                    <th className="py-2">System Role</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((user, idx) => (
                    <tr key={idx} className="border-b border-[#d5ccbf]/50 hover:bg-[#f3eee5]/30">
                      <td className="py-3 pr-3 font-semibold text-sm">{user.name}</td>
                      <td className="py-3 pr-3 text-sm">{user.email}</td>
                      <td className="py-3 pr-3 text-sm">{user.phone}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                          user.role === 'admin'
                            ? 'bg-[#24221f] text-[#f3eee5]'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-[#716b63]">No users registered in the database.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB content: Audit Log */}
        {tab === 'Audit Log' && (
          <div className="bg-[#e9e0d4] border border-[#d5ccbf] p-6 rounded">
            <h3 className="font-serif text-xl font-bold border-b border-[#d5ccbf] pb-3 mb-6">Security & Audit History</h3>
            
            <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-2">
              {auditLog.map((log, idx) => (
                <div key={idx} className="border-b border-[#d5ccbf]/40 pb-4 last:border-b-0">
                  <div className="flex justify-between items-center text-xs text-[#716b63] mb-1">
                    <div>
                      Logged by: <strong className="text-[#24221f]">{log.by}</strong>
                    </div>
                    <span>{new Date(log.when).toLocaleString()}</span>
                  </div>
                  <p className="text-sm">
                    <span className="font-bold text-[#24221f] uppercase tracking-wider mr-3 text-[10px] bg-[#d5ccbf]/60 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                    {log.details}
                  </p>
                </div>
              ))}
              {auditLog.length === 0 && (
                <p className="text-center text-sm text-[#716b63] py-8">Audit log is clean. No activity recorded.</p>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
