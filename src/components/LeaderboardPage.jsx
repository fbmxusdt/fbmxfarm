import { useOnChainGame } from '../hooks/useOnChainGame.js'
import { useConnection }  from 'wagmi'

function shortAddr(addr) {
  if (!addr) return '—'
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function LeaderboardTable({ title, emoji, rows, valueKey, formatValue, myAddress, valueLabel }) {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-5 py-3.5 border-b"
        style={{ background: 'var(--soil-dark)', borderColor: 'rgba(139,96,64,0.4)' }}
      >
        <span className="text-lg">{emoji}</span>
        <h2 className="font-black text-sm" style={{ color: 'var(--gold-bright)' }}>{title}</h2>
        <span
          className="ml-auto text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(212,160,23,0.12)', border: '1px solid rgba(212,160,23,0.3)', color: 'var(--gold-bright)' }}
        >
          Top {rows.length}
        </span>
      </div>

      {/* Column headers */}
      <div
        className="grid grid-cols-[2rem_1fr_auto] gap-3 px-5 py-2 text-[10px] font-bold uppercase tracking-widest"
        style={{ color: 'var(--parchment-dim)', borderBottom: '1px solid var(--card-border)' }}
      >
        <span>#</span>
        <span>Player</span>
        <span>{valueLabel}</span>
      </div>

      {/* Rows */}
      <div className="flex flex-col divide-y" style={{ borderColor: 'var(--card-border)' }}>
        {rows.length === 0 && (
          <div className="px-5 py-8 text-center text-xs" style={{ color: 'var(--parchment-dim)' }}>
            No data yet — start farming to appear on the leaderboard.
          </div>
        )}
        {rows.map((entry, idx) => {
          const isMe = myAddress && entry.player.toLowerCase() === myAddress.toLowerCase()
          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null
          return (
            <div
              key={entry.player}
              className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 px-5 py-3 text-sm transition-colors"
              style={isMe
                ? { background: 'rgba(212,160,23,0.08)', color: 'var(--gold-bright)' }
                : { color: 'var(--parchment)' }
              }
            >
              {/* Rank */}
              <span className="font-black text-xs" style={{ color: medal ? undefined : 'var(--parchment-dim)' }}>
                {medal ?? `#${entry.rank}`}
              </span>

              {/* Address */}
              <span className="font-mono text-xs truncate" title={entry.player}>
                {shortAddr(entry.player)}
                {isMe && (
                  <span
                    className="ml-1.5 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(212,160,23,0.2)', color: 'var(--gold-bright)' }}
                  >
                    you
                  </span>
                )}
              </span>

              {/* Value */}
              <span className="font-bold text-right tabular-nums">
                {formatValue(entry[valueKey])}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function LeaderboardPage({ onBack }) {
  const { address }                          = useConnection()
  const { leaderboardSeeds, leaderboardCoins } = useOnChainGame(address)

  return (
    <div className="min-h-screen" style={{ background: 'var(--forest-dark)' }}>

      {/* Page header */}
      <div
        className="border-b px-4 py-4"
        style={{ background: 'var(--soil-dark)', borderColor: 'rgba(139,96,64,0.4)' }}
      >
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all hover:scale-105"
            style={{ background: 'var(--soil-mid)', border: '1px solid var(--bark)', color: 'var(--parchment-dim)' }}
          >
            ← Back
          </button>
          <div className="flex items-center gap-2 ml-1">
            <span className="text-xl">🏆</span>
            <div>
              <h1 className="font-black text-base leading-tight" style={{ color: 'var(--gold-bright)' }}>
                Leaderboard
              </h1>
              <p className="text-[10px] leading-none mt-0.5" style={{ color: 'var(--parchment-dim)' }}>
                Top 50 farmers — updated live on every transaction
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LeaderboardTable
            title="Top Seed Holders"
            emoji="🌱"
            rows={leaderboardSeeds}
            valueKey="seeds"
            formatValue={(v) => v.toLocaleString()}
            valueLabel="Seeds"
            myAddress={address}
          />
          <LeaderboardTable
            title="Top Coin Holders"
            emoji="💰"
            rows={leaderboardCoins}
            valueKey="coins"
            formatValue={(v) => v.toFixed(2)}
            valueLabel="Coins"
            myAddress={address}
          />
        </div>
      </div>

    </div>
  )
}
