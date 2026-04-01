import { useState, useEffect } from 'react'

export function Basket({ seeds, myAddress, market, marketStats, onList, onCancel }) {
  const [seedCount,    setSeedCount]    = useState(100)
  const [price,        setPrice]        = useState(null)
  const [priceEdited,  setPriceEdited]  = useState(false)

  // Once marketStats loads, set the default price to current seed price (if user hasn't typed)
  useEffect(() => {
    if (!priceEdited && marketStats?.currentSeedPrice) {
      setPrice(parseFloat(marketStats.currentSeedPrice.toFixed(6)))
    }
  }, [marketStats?.currentSeedPrice, priceEdited])

  const displayPrice = price ?? marketStats?.currentSeedPrice ?? 1

  const myListings = market.filter(l => l.sellerAddress?.toLowerCase() === myAddress?.toLowerCase())

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
      <h2 className="text-sm font-bold text-green-400 uppercase tracking-widest mb-3">🧺 List Seeds</h2>

      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs text-gray-400">Seeds to list</label>
          <input
            type="number" min={1} value={seedCount}
            onChange={e => setSeedCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-sm text-center text-white focus:outline-none focus:border-green-500"
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs text-gray-400">Price / seed (💰)</label>
          <input
            type="number" min={0.000001} step={0.0001} value={displayPrice}
            onChange={e => { setPrice(parseFloat(e.target.value) || 0.000001); setPriceEdited(true) }}
            className="w-24 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-sm text-center text-white focus:outline-none focus:border-green-500"
          />
        </div>
      </div>

      <button
        disabled={seeds < seedCount || displayPrice <= 0}
        onClick={() => onList(seedCount, displayPrice)}
        className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-1.5 rounded-lg transition-colors"
      >
        List for Sale
      </button>

      {/* My active listings */}
      {myListings.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">My Listings</p>
          {myListings.map(listing => {
            const sold    = listing.seedCount - listing.remaining
            const soldPct = Math.round((sold / listing.seedCount) * 100)
            return (
              <div key={listing.id} className="bg-gray-700/60 rounded-lg p-3 fade-in">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-gray-200">🌱 {listing.seedCount} seeds</span>
                  <span className="text-xs text-amber-400 font-bold">{listing.pricePerSeed} 💰/seed</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>Sold: {sold}/{listing.seedCount}</span>
                  <span className="text-green-400 font-semibold">+{fmt(listing.totalEarned)} 💰 earned</span>
                </div>
                <div className="w-full h-1 bg-gray-600 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${soldPct}%` }} />
                </div>
                <button
                  onClick={() => onCancel(listing)}
                  className="text-xs text-gray-500 hover:text-red-400 border border-gray-600 hover:border-red-400/50 px-2 py-0.5 rounded transition-colors"
                >
                  ↩ Cancel & return {listing.remaining} seeds
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function fmt(n) {
  if (!n) return '0'
  return Number.isInteger(n) ? n : parseFloat(n.toFixed(2))
}
