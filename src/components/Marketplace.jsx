import { useState } from 'react'

export function Marketplace({ market, myAddress, myCoins, onBuy }) {
  // Sort by lowest price first, then own listings at bottom (greyed)
  const others = market
    .filter(l => l.sellerAddress?.toLowerCase() !== myAddress?.toLowerCase())
    .sort((a, b) => a.pricePerSeed - b.pricePerSeed)
  const mine = market.filter(l => l.sellerAddress?.toLowerCase() === myAddress?.toLowerCase())
  const sorted = [...others, ...mine]

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-green-400 uppercase tracking-widest">🏪 Marketplace</h2>
        <span className="text-xs text-gray-500">{market.length} listing{market.length !== 1 ? 's' : ''}</span>
      </div>

      {sorted.length === 0 ? (
        <p className="text-xs text-gray-600 text-center py-4">
          No listings yet. Be the first to list seeds!
        </p>
      ) : (
        <div className="space-y-3">
          {sorted.map(listing => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isOwn={listing.sellerAddress?.toLowerCase() === myAddress?.toLowerCase()}
              myCoins={myCoins}
              onBuy={onBuy}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ListingCard({ listing, isOwn, myCoins, onBuy }) {
  const [amount, setAmount] = useState(Math.min(10, listing.remaining))
  const cost     = parseFloat((amount * listing.pricePerSeed).toFixed(4))
  const canAfford = myCoins >= cost
  const soldPct  = Math.round(((listing.seedCount - listing.remaining) / listing.seedCount) * 100)

  return (
    <div className={`rounded-xl border p-3 fade-in transition-colors ${
      isOwn ? 'border-gray-600 bg-gray-700/30 opacity-60' : 'border-gray-600 bg-gray-700/50 hover:border-green-700'
    }`}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full">
            {shortAddr(listing.sellerAddress)}
          </span>
          {isOwn && (
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wide">You</span>
          )}
        </div>
        <span className="text-sm font-bold text-amber-400">{listing.pricePerSeed} 💰/seed</span>
      </div>

      {/* Seeds info */}
      <div className="flex justify-between text-xs text-gray-400 mb-2">
        <span>🫘 <strong className="text-gray-200">{listing.remaining}</strong> seeds left</span>
        <span className="text-gray-500">{soldPct}% sold</span>
      </div>

      {/* Progress */}
      <div className="w-full h-1 bg-gray-600 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-amber-500/60 rounded-full transition-all"
          style={{ width: `${soldPct}%` }}
        />
      </div>

      {/* Buy controls — only for other wallets */}
      {!isOwn && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={listing.remaining}
            value={amount}
            onChange={e => setAmount(Math.max(1, Math.min(listing.remaining, parseInt(e.target.value) || 1)))}
            className="w-16 bg-gray-600 border border-gray-500 rounded-lg px-2 py-1 text-xs text-center text-white focus:outline-none focus:border-green-500"
          />
          <div className="flex-1 text-xs text-gray-400">
            = <span className={canAfford ? 'text-amber-400 font-bold' : 'text-red-400 font-bold'}>{cost} 💰</span>
          </div>
          <button
            disabled={!canAfford || listing.remaining < 1}
            onClick={() => onBuy(listing, amount)}
            className="bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            Buy
          </button>
        </div>
      )}

      {isOwn && (
        <p className="text-[10px] text-gray-600 text-center">Use "List Seeds" panel to cancel this listing</p>
      )}
    </div>
  )
}

function shortAddr(addr) {
  if (!addr) return '?'
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}
