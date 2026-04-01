/**
 * AdminPage — full-page wrapper for the owner-only admin panel.
 *
 * Renders the AdminPanel content inside a themed page shell.
 * If the connected wallet is not the owner the page shows an
 * "Access Denied" screen instead — matching the forest/soil/gold palette.
 */

import { AdminPanel } from './AdminPanel.jsx'
import { useIsOwner } from '../hooks/useIsOwner.js'

export function AdminPage({ onBack }) {
  const { isOwner, owner } = useIsOwner()

  return (
    <div className="min-h-screen" style={{ background: 'var(--forest-dark)' }}>

      {/* ── Page header bar ── */}
      <div
        className="border-b px-4 py-4"
        style={{ background: 'var(--soil-dark)', borderColor: 'rgba(139,96,64,0.4)' }}
      >
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all hover:scale-105"
            style={{
              background: 'var(--soil-mid)',
              border: '1px solid var(--bark)',
              color: 'var(--parchment-dim)',
            }}
          >
            ← Back
          </button>

          <div className="flex items-center gap-2 ml-1">
            <span className="text-xl">⚙️</span>
            <div>
              <h1 className="font-black text-base leading-tight" style={{ color: 'var(--gold-bright)' }}>
                Admin Panel
              </h1>
              {owner && (
                <p className="text-[10px] font-mono leading-none mt-0.5" style={{ color: 'var(--parchment-dim)' }}>
                  Owner: {owner.slice(0, 6)}…{owner.slice(-4)}
                </p>
              )}
            </div>
          </div>

          {isOwner && (
            <span
              className="ml-auto text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(212,160,23,0.12)',
                border: '1px solid rgba(212,160,23,0.35)',
                color: 'var(--gold-bright)',
              }}
            >
              ✓ Authenticated
            </span>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {isOwner ? (
        /*
         * AdminPanel handles its own data loading and renders all
         * config sections, the liquidity panel, and the profitability
         * calculator.  It returns null when !isOwner, but we only
         * reach this branch when isOwner is true, so it always renders.
         */
        <AdminPanel />
      ) : (
        <AccessDenied onBack={onBack} />
      )}
    </div>
  )
}

function AccessDenied({ onBack }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center px-4">
      <div className="text-6xl">🔒</div>
      <h2 className="text-2xl font-black" style={{ color: 'var(--gold-bright)' }}>
        Access Denied
      </h2>
      <p className="max-w-sm text-sm leading-relaxed" style={{ color: 'var(--parchment-dim)' }}>
        This page is restricted to the contract owner.
        Connect the owner wallet to access admin controls.
      </p>
      <button
        onClick={onBack}
        className="px-6 py-2.5 rounded-full font-bold text-sm transition-all hover:scale-105"
        style={{
          background: 'linear-gradient(135deg, var(--gold-mid), var(--gold-bright))',
          color: '#1a110a',
        }}
      >
        ← Go Back
      </button>
    </div>
  )
}
