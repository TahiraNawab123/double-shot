'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { ArrowRight, Clock3, MapPin, Menu, Minus, Plus, ShoppingBag, Sparkles, X } from 'lucide-react'

const menu = [
  { id: 'espresso', name: 'Espresso', description: 'A clean, syrupy double shot.', price: 280, category: 'Coffee', image: '/double-shot-official-beans.jpg' },
  { id: 'flat-white', name: 'Flat White', description: 'Velvety microfoam, double ristretto.', price: 520, category: 'Coffee', image: '/double-shot-official-spanish-latte.jpg' },
  { id: 'iced-mocha', name: 'Iced Mocha', description: 'Cocoa, espresso, milk, over ice.', price: 650, category: 'Cold', image: '/double-shot-official-cold-brew.jpg' },
  { id: 'cardamom-bun', name: 'Cardamom Bun', description: 'Buttery layers, toasted sugar.', price: 480, category: 'Bakes', image: '/double-shot-official-banner.png' },
  { id: 'avocado-toast', name: 'Avocado Toast', description: 'Sourdough, lemon, za’atar, chilli.', price: 890, category: 'Plates', image: '/double-shot-official-banner.png' },
  { id: 'basque-cheesecake', name: 'Basque Cheesecake', description: 'Burnt top, soft centre, sea salt.', price: 720, category: 'Sweet', image: '/double-shot-official-spanish-latte.jpg' },
]

const adminOrders = [
  ['#DS-1042', 'Ayesha Khan', 'Flat White · Avocado Toast', 'Preparing', 'PKR 1,410'],
  ['#DS-1041', 'Hamza Ali', 'Espresso · Cardamom Bun', 'Ready', 'PKR 760'],
  ['#DS-1040', 'Sara Ahmed', 'Iced Mocha', 'Completed', 'PKR 650'],
]

export function DoubleShotApp() {
  const [cart, setCart] = useState<Record<string, number>>({})
  const [cartOpen, setCartOpen] = useState(false)
  const [active, setActive] = useState('home')
  const [admin, setAdmin] = useState(false)
  const [notice, setNotice] = useState('')
  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0)
  const total = useMemo(() => menu.reduce((sum, item) => sum + item.price * (cart[item.id] || 0), 0), [cart])
  const add = (id: string) => setCart((current) => ({ ...current, [id]: (current[id] || 0) + 1 }))
  const change = (id: string, amount: number) => setCart((current) => ({ ...current, [id]: Math.max(0, (current[id] || 0) + amount) }))
  const toast = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 2600) }

  if (admin) return <AdminView onExit={() => setAdmin(false)} />

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="site-header">
        <button className="brand" onClick={() => setActive('home')} aria-label="Double Shot home">DOUBLE<br />SHOT</button>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {['home', 'menu', 'story', 'reservations', 'visit'].map((item) => <button key={item} className={active === item ? 'nav-link active' : 'nav-link'} onClick={() => setActive(item)}>{item === 'home' ? 'HOME' : item.toUpperCase()}</button>)}
        </nav>
        <div className="flex items-center gap-2">
          <button className="admin-link hidden md:block" onClick={() => setAdmin(true)}>STAFF LOGIN</button>
          <button className="icon-button" onClick={() => setCartOpen(true)} aria-label={`Open cart, ${totalItems} items`}><ShoppingBag size={18} /><span>{totalItems}</span></button>
          <button className="icon-button md:hidden" aria-label="Open menu"><Menu size={18} /></button>
        </div>
      </header>

      <main>
        {active === 'home' && <Home onMenu={() => setActive('menu')} onReserve={() => setActive('reservations')} />}
        {active === 'menu' && <MenuPage onAdd={(id) => { add(id); toast('Added to your order') }} />}
        {active === 'story' && <Story />}
        {active === 'reservations' && <Reservations onReserve={() => toast('Your table is held. See you soon.')} />}
        {active === 'visit' && <Visit />}
      </main>

      <footer className="site-footer"><div><p className="eyebrow">DOUBLE SHOT</p><p>Made slowly in Model Town, Lahore.</p></div><div className="footer-right"><p>Every day · 6:00 am — 12:00 am</p><p>© 2026 Double Shot</p></div></footer>

      {cartOpen && <aside className="cart-drawer" aria-label="Shopping cart"><div className="drawer-head"><div><p className="eyebrow">YOUR ORDER</p><h2>Second cup?</h2></div><button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Close cart"><X size={18} /></button></div><div className="cart-items">{totalItems === 0 ? <div className="empty-cart"><ShoppingBag size={28} /><p>Your basket is waiting.</p><button className="text-link" onClick={() => { setCartOpen(false); setActive('menu') }}>Explore the menu <ArrowRight size={14} /></button></div> : menu.filter((item) => cart[item.id]).map((item) => <div className="cart-item" key={item.id}><div><strong>{item.name}</strong><small>{item.price.toLocaleString()} PKR</small></div><div className="quantity"><button onClick={() => change(item.id, -1)} aria-label={`Remove one ${item.name}`}><Minus size={14} /></button><span>{cart[item.id]}</span><button onClick={() => change(item.id, 1)} aria-label={`Add one ${item.name}`}><Plus size={14} /></button></div></div>)}</div>{totalItems > 0 && <div className="cart-total"><div><span>Subtotal</span><strong>PKR {total.toLocaleString()}</strong></div><button className="primary-button" onClick={() => { setCartOpen(false); toast('Checkout is ready for your details') }}>CHECKOUT <ArrowRight size={16} /></button></div>}</aside>}
      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
  )
}

function Home({ onMenu, onReserve }: { onMenu: () => void; onReserve: () => void }) { return <><section className="hero"><div className="hero-copy"><p className="eyebrow">MODEL TOWN · LAHORE</p><h1>Good coffee.<br /><em>Better company.</em></h1><p className="lede">An all-day coffee house for slow mornings, long conversations, and the perfect second cup.</p><div className="button-row"><button className="primary-button" onClick={onMenu}>VIEW THE MENU <ArrowRight size={16} /></button><button className="secondary-button" onClick={onReserve}>RESERVE A TABLE</button></div></div><div className="hero-image"><Image src="/double-shot-official-banner.png" alt="Double Shot official coffee house banner" fill priority sizes="(max-width: 768px) 100vw, 50vw" /></div></section><section className="intro-section"><p className="eyebrow">THE DOUBLE SHOT EDIT</p><h2>A little ritual<br /><em>worth repeating.</em></h2><p>From first pour to last bite, every detail is considered. Explore our drinks, settle into your favourite corner, and stay as long as you like.</p></section><section className="split-section"><div><p className="eyebrow">ON THE BAR</p><h2>Made for<br /><em>your mood.</em></h2><button className="text-link" onClick={onMenu}>EXPLORE EVERYTHING <ArrowRight size={14} /></button></div><div className="feature-card feature-photo"><Image src="/double-shot-official-spanish-latte.jpg" alt="Spanish latte from Double Shot" fill sizes="(max-width: 800px) 100vw, 33vw" /><div className="feature-overlay"><div className="feature-number">01</div><h3>The classics</h3><p>Espresso, flat whites and the quiet confidence of a well-pulled shot.</p></div></div><div className="feature-card feature-photo"><Image src="/double-shot-official-cold-brew.jpg" alt="Cold brew from Double Shot" fill sizes="(max-width: 800px) 100vw, 33vw" /><div className="feature-overlay"><div className="feature-number">02</div><h3>Something to eat</h3><p>Savoury plates, flaky layers and small sweet endings.</p></div></div></section><section className="visit-band"><p className="eyebrow">COME BY</p><h2>See you in<br /><em>Model Town.</em></h2><div className="visit-details"><span><MapPin size={16} /> C, Shop #7, C Block, Sector Model Town, Lahore</span><span><Clock3 size={16} /> Open daily · 6:00 am — 12:00 am</span><button className="text-link">+92 318 9119222 <ArrowRight size={14} /></button></div></section></> }

function MenuPage({ onAdd }: { onAdd: (id: string) => void }) { const [category, setCategory] = useState('All'); const filtered = category === 'All' ? menu : menu.filter((item) => item.category === category); return <section className="menu-page"><div className="page-heading"><p className="eyebrow">THE MENU · MODEL TOWN</p><h1>Good things,<br /><em>made daily.</em></h1><p>Small rituals, big comfort. Everything is prepared in-house and served with care.</p></div><div className="category-row">{['All', 'Coffee', 'Cold', 'Bakes', 'Plates', 'Sweet'].map((item) => <button key={item} className={category === item ? 'category active' : 'category'} onClick={() => setCategory(item)}>{item}</button>)}</div><div className="menu-grid">{filtered.map((item, index) => <article className="menu-item" key={item.id}><div className="menu-art"><Image src={item.image} alt={`${item.name} from Double Shot`} fill sizes="(max-width: 800px) 100vw, 30vw" /></div><div className="menu-item-info"><div><p className="eyebrow">{item.category}</p><h3>{item.name}</h3><p>{item.description}</p></div><div className="menu-item-bottom"><strong>PKR {item.price.toLocaleString()}</strong><button className="add-button" onClick={() => onAdd(item.id)}><Plus size={16} /> ADD</button></div></div></article>)}</div></section> }

function Story() { return <section className="content-page"><p className="eyebrow">OUR STORY</p><h1>A room for<br /><em>good company.</em></h1><p className="story-copy">Double Shot started with one simple idea: coffee tastes better when there is nowhere else you need to be. A neighbourhood living room for Model Town, built around thoughtful coffee, generous plates, and the people who make a place feel like home.</p><div className="quote">“Stay for one. Stay for the afternoon.”</div></section> }
function Reservations({ onReserve }: { onReserve: () => void }) { const [submitted, setSubmitted] = useState(false); return <section className="form-page"><div><p className="eyebrow">RESERVATIONS</p><h1>Your table<br /><em>is waiting.</em></h1><p>For breakfasts, catch-ups, and the moments worth lingering over.</p></div>{submitted ? <div className="confirmation"><Sparkles size={24} /><h2>We’ll see you soon.</h2><p>Your table request is held for the Double Shot team to confirm.</p></div> : <form className="reservation-form" onSubmit={(e) => { e.preventDefault(); setSubmitted(true); onReserve() }}><label>Name<input required placeholder="Your name" /></label><label>Phone<input required placeholder="+92 3XX XXXXXXX" /></label><div className="form-grid"><label>Date<input required type="date" /></label><label>Guests<select defaultValue="2"><option>2 guests</option><option>3 guests</option><option>4 guests</option><option>5+ guests</option></select></label></div><label>Notes<textarea placeholder="Anything we should know?" rows={3} /></label><button className="primary-button" type="submit">REQUEST A TABLE <ArrowRight size={16} /></button></form>}</section> }
function Visit() { return <section className="visit-page"><div className="visit-heading"><p className="eyebrow">FIND US</p><h1>Come as<br /><em>you are.</em></h1><p>Find us in the heart of Model Town, Lahore. Come for the coffee, stay for the neighbourhood.</p></div><div className="map-frame"><iframe title="Double Shot location map" src="https://www.openstreetmap.org/export/embed.html?bbox=74.322%2C31.472%2C74.344%2C31.486&layer=mapnik&marker=31.479%2C74.333" loading="lazy" /><a href="https://www.openstreetmap.org/?mlat=31.479&mlon=74.333#map=16/31.479/74.333" target="_blank" rel="noreferrer">OPEN IN MAPS <ArrowRight size={14} /></a></div><div className="visit-info"><strong>Open daily</strong><span>6:00 am — midnight</span><strong>Call us</strong><span>+92 318 9119222</span><strong>Address</strong><span>C, Shop #7, C Block, Model Town, Lahore</span></div></section> }

function AdminView({ onExit }: { onExit: () => void }) { const [tab, setTab] = useState('Overview'); return <div className="admin-shell"><aside className="admin-sidebar"><button className="brand" onClick={onExit}>DOUBLE<br />SHOT</button><p className="eyebrow">STAFF SPACE</p>{['Overview', 'Orders', 'Reservations', 'Menu', 'Customers', 'Promotions', 'Reviews', 'Settings'].map((item) => <button key={item} className={tab === item ? 'admin-nav active' : 'admin-nav'} onClick={() => setTab(item)}>{item}</button>)}<button className="admin-exit" onClick={onExit}>← Back to site</button></aside><main className="admin-main"><div className="admin-top"><div><p className="eyebrow">TUESDAY · AUGUST 11, 2026</p><h1>{tab}</h1></div><button className="secondary-button" onClick={onExit}>VIEW STORE</button></div>{tab === 'Overview' && <><div className="stat-grid"><div className="stat-card"><span>Today’s revenue</span><strong>PKR 84,260</strong><small>↑ 18.4% vs last Tuesday</small></div><div className="stat-card"><span>Orders</span><strong>126</strong><small>18 currently preparing</small></div><div className="stat-card"><span>Reservations</span><strong>42</strong><small>8 tables still available</small></div><div className="stat-card"><span>Avg. ticket</span><strong>PKR 668</strong><small>↑ 4.2% this month</small></div></div><div className="admin-panel"><div className="panel-heading"><div><p className="eyebrow">LIVE SERVICE</p><h2>Recent orders</h2></div><button className="text-link">VIEW ALL <ArrowRight size={14} /></button></div><div className="orders-table">{adminOrders.map(([id, name, items, status, price]) => <div className="order-row" key={id}><strong>{id}</strong><span>{name}</span><span>{items}</span><span className={`status ${status.toLowerCase()}`}>{status}</span><b>{price}</b></div>)}</div></div></>}{tab !== 'Overview' && <div className="admin-panel empty-admin"><Sparkles size={28} /><h2>{tab} workspace</h2><p>This section is ready for your team. Connect your production data layer to manage it here.</p><button className="primary-button" onClick={() => setTab('Overview')}>BACK TO OVERVIEW</button></div>}</main></div> }

export default DoubleShotApp
