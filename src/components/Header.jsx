import { useState, useEffect } from 'react'
import { useConnection, useConnect, useConnectors, useDisconnect } from 'wagmi'
import { Home, Leaf, TrendingUp, Gamepad2, ShieldCheck, LogIn, LogOut } from 'lucide-react'
import { InvestorModal } from './InvestorModal.jsx'
import { MenuBar }       from '@/components/ui/glow-menu'
import { useIsOwner }    from '../hooks/useIsOwner.js'

// ── Navigation items ──────────────────────────────────────────────
// ownerOnly : visible only when address === contract owner
// guestOnly : visible only when NOT connected
// authOnly  : visible only when connected
// investor  : click opens InvestorModal instead of navigating
const MENU_ITEMS = [
  {
    id: 'landing', icon: Home, label: 'Home', mobileLabel: 'Home',
    href: '#',
    gradient: 'radial-gradient(circle, rgba(76,175,80,0.22) 0%, rgba(46,125,50,0.08) 50%, rgba(27,94,32,0) 100%)',
    iconColor: 'text-green-400',
  },
  {
    id: 'about', icon: Leaf, label: 'About', mobileLabel: 'About The Game',
    href: '#',
    gradient: 'radial-gradient(circle, rgba(52,211,153,0.22) 0%, rgba(16,185,129,0.08) 50%, rgba(5,150,105,0) 100%)',
    iconColor: 'text-emerald-400',
  },
  {
    id: 'investors', investor: true, icon: TrendingUp, label: 'Learn', mobileLabel: 'Learn',
    href: '#',
    gradient: 'radial-gradient(circle, rgba(251,191,36,0.22) 0%, rgba(245,158,11,0.08) 50%, rgba(217,119,6,0) 100%)',
    iconColor: 'text-amber-400',
  },
  {
    id: 'game', icon: Gamepad2, label: 'Play', mobileLabel: 'Play',
    href: '#',
    gradient: 'radial-gradient(circle, rgba(168,85,247,0.22) 0%, rgba(139,92,246,0.08) 50%, rgba(109,40,217,0) 100%)',
    iconColor: 'text-purple-400',
  },
  {
    id: 'admin', ownerOnly: true, icon: ShieldCheck, label: 'Admin', mobileLabel: 'Admin Panel',
    href: '#',
    gradient: 'radial-gradient(circle, rgba(251,113,133,0.22) 0%, rgba(244,63,94,0.08) 50%, rgba(225,29,72,0) 100%)',
    iconColor: 'text-rose-400',
  },
  {
    id: 'connect', guestOnly: true, icon: LogIn, label: 'Connect', mobileLabel: 'Connect Wallet',
    href: '#',
    gradient: 'radial-gradient(circle, rgba(59,130,246,0.22) 0%, rgba(37,99,235,0.08) 50%, rgba(29,78,216,0) 100%)',
    iconColor: 'text-blue-400',
  },
  {
    id: 'disconnect', authOnly: true, icon: LogOut, label: 'Disconnect', mobileLabel: 'Disconnect',
    href: '#',
    gradient: 'radial-gradient(circle, rgba(239,68,68,0.22) 0%, rgba(220,38,38,0.08) 50%, rgba(185,28,28,0) 100%)',
    iconColor: 'text-red-400',
  },
]

// ── Connect Wallet modal ──────────────────────────────────────────
function ConnectModal({ onClose }) {
  const { address }                    = useConnection()
  const { mutate: connect, isPending } = useConnect()
  const connectors                     = useConnectors()

  // Auto-close once wallet connects
  useEffect(() => { if (address) onClose() }, [address]) // eslint-disable-line

  // Close on Escape
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl fade-in"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ background: 'var(--soil-dark)', borderBottom: '1px solid var(--card-border)' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔗</span>
            <div>
              <h2 className="font-black text-sm leading-tight" style={{ color: 'var(--gold-bright)' }}>
                Connect Wallet
              </h2>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--parchment-dim)' }}>
                BSC · BEP-20 · FBMX
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm transition-opacity hover:opacity-70"
            style={{ background: 'var(--soil-mid)', color: 'var(--parchment-dim)' }}
          >
            ✕
          </button>
        </div>

        {/* Connector list */}
        <div className="p-5 flex flex-col gap-3">
          <p className="text-xs leading-relaxed" style={{ color: 'var(--parchment-dim)' }}>
            Choose a wallet to connect and start farming on BSC.
          </p>

          {connectors.length === 0 && (
            <p className="text-xs text-center py-6" style={{ color: 'var(--parchment-dim)' }}>
              No wallet detected. Install MetaMask or another Web3 wallet.
            </p>
          )}

          {connectors.map(c => (
            <button
              key={c.uid}
              onClick={() => connect({ connector: c })}
              disabled={isPending}
              className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-semibold text-left transition-all hover:opacity-90 disabled:opacity-50 active:scale-[0.98]"
              style={{
                background: 'var(--forest-mid)',
                border: '1px solid var(--card-border)',
                color: 'var(--parchment)',
              }}
            >
              {c.icon ? (
                <img src={c.icon} alt={c.name} className="w-8 h-8 rounded-lg shrink-0" />
              ) : (
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0"
                  style={{ background: 'var(--card-border)' }}
                >🔗</span>
              )}
              <div className="flex-1 min-w-0">
                <div>{c.name}</div>
                <div className="text-[10px] font-normal mt-0.5" style={{ color: 'var(--parchment-dim)' }}>
                  {c.type === 'injected' ? 'Browser Wallet' : c.type}
                </div>
              </div>
              {isPending && (
                <span className="text-xs animate-pulse shrink-0" style={{ color: 'var(--parchment-dim)' }}>⏳</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Header ───────────────────────────────────────────────────
export function Header({ currentView, onNavigate }) {
  const { address }            = useConnection()
  const { isOwner }            = useIsOwner()
  const { mutate: disconnect } = useDisconnect()
  const [showInvestor, setShowInvestor] = useState(false)
  const [showConnect,  setShowConnect]  = useState(false)
  const [menuOpen,     setMenuOpen]     = useState(false)

  const handleNav = (id) => { onNavigate(id); setMenuOpen(false) }

  const handleMenuClick = (label) => {
    const item = MENU_ITEMS.find(i => i.label === label)
    if (!item) return
    if (item.investor)           { setShowInvestor(true);  setMenuOpen(false) }
    else if (item.id === 'connect')    { setShowConnect(true);   setMenuOpen(false) }
    else if (item.id === 'disconnect') { disconnect();           setMenuOpen(false) }
    else handleNav(item.id)
  }

  // Filter items by connection state and ownership
  const navItems = MENU_ITEMS.filter(i => {
    if (i.ownerOnly && !isOwner)    return false
    if (i.guestOnly && !!address)   return false  // hide Connect when connected
    if (i.authOnly  && !address)    return false  // hide Disconnect when not connected
    return true
  })

  const activeMenuLabel = MENU_ITEMS.find(i => !i.investor && i.id === currentView)?.label

  return (
    <>
      <header
        className="sticky top-0 z-50 w-full"
        style={{
          background: 'rgba(0, 0, 0, 0)',
          borderBottom: '0px solid var(--forest-light)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">


          {/* ── Center nav ── */}
          <nav className="hidden md:flex flex-1 justify-center">
            <MenuBar
              items={navItems}
              activeItem={activeMenuLabel}
              onItemClick={handleMenuClick}
            />
          </nav>

          {/* ── Right side ── */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Hamburger — mobile only */}
            <button
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg"
              style={{
                background: menuOpen ? 'var(--forest-light)' : 'transparent',
                color: 'var(--parchment)',
              }}
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Menu"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
            {/* ── Logo ── */}
            <div className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg">Logo</div>
          </div>

          

        </div>

        {/* ── Mobile dropdown ── */}
        {menuOpen && (
          <div
            className="md:hidden border-t px-4 py-3 flex flex-col gap-1"
            style={{ background: 'rgba(11,20,10,0.98)', borderColor: 'var(--forest-light)' }}
          >
            {/* Nav items (filtered by connection state) */}
            {navItems.map(item => {
              const Icon = item.icon
              const isActive = !item.investor && currentView === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.label)}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5"
                  style={
                    isActive
                      ? { background: 'rgba(212,160,23,0.12)', color: 'var(--gold-bright)' }
                      : { color: 'var(--parchment-dim)' }
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.mobileLabel}
                </button>
              )
            })}
          </div>
        )}
      </header>

      {showInvestor && <InvestorModal onClose={() => setShowInvestor(false)} />}
      {showConnect  && <ConnectModal  onClose={() => setShowConnect(false)}  />}
    </>
  )
}
