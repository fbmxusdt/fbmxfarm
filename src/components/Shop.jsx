import { useState } from 'react'

export function Shop({ coins, marketStats, onBuy }) {
  const [amount, setAmount] = useState(100)

  // Live price from bonding curve (coins per seed). Fallback to 0.1 until loaded.
  const pricePerSeed  = marketStats?.currentSeedPrice ?? 0.1
  const seedsPerCoin  = pricePerSeed > 0 ? 1 / pricePerSeed : 0
  const cost          = parseFloat((amount * pricePerSeed).toFixed(6))
  const canAfford     = coins >= cost

  const vwap          = marketStats?.vwap       // null = no market trades yet
  const plantedPct    = marketStats?.plantedPct ?? 0

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
      <h2 className="text-sm font-bold text-green-400 uppercase tracking-widest mb-3">🛒 Shop</h2>

      {/* Live price display */}
      <div className="bg-gray-700/50 rounded-lg p-3 mb-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Seed price</span>
          <span className="font-bold text-amber-400">
            {pricePerSeed < 1
              ? `${fmtNum(seedsPerCoin)} seeds / coin`
              : `${fmtNum(pricePerSeed)} coins / seed`}
          </span>
        </div>

        {/* Demand bar */}
        <div>
          <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
            <span>Demand ({plantedPct}% planted)</span>
            <span className={plantedPct > 70 ? 'text-red-400' : plantedPct > 40 ? 'text-amber-400' : 'text-green-400'}>
              {plantedPct > 70 ? '📈 High' : plantedPct > 40 ? '➡️ Medium' : '📉 Low'}
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-600 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                plantedPct > 70 ? 'bg-red-500' : plantedPct > 40 ? 'bg-amber-400' : 'bg-green-500'
              }`}
              style={{ width: `${plantedPct}%` }}
            />
          </div>
        </div>

        {/* VWAP reference */}
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-gray-500">Market VWAP</span>
          <span className={vwap != null ? 'text-blue-300 font-mono' : 'text-gray-600'}>
            {vwap != null
              ? `${fmtNum(1 / vwap)} seeds/coin`
              : 'No trades yet'}
          </span>
        </div>
      </div>

      {/* Buy controls */}
      <div className="flex gap-2">
        <input
          type="number"
          min={1}
          value={amount}
          onChange={e => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-20 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-sm text-center text-white focus:outline-none focus:border-green-500"
        />
        <button
          disabled={!canAfford}
          onClick={() => onBuy(amount)}
          className="flex-1 bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-1.5 rounded-lg transition-colors"
        >
          Buy
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Cost: <span className={canAfford ? 'text-amber-400' : 'text-red-400'}>{cost} 💰</span>
      </p>
    </div>
  )
}

function fmtNum(n) {
  if (!n || !isFinite(n)) return '—'
  return n >= 10 ? Math.round(n).toLocaleString() : parseFloat(n.toFixed(4)).toString()
}
