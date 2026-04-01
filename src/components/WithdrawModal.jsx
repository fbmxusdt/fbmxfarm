/**
 * WithdrawModal — off-chain placeholder for FBMX withdrawal.
 *
 * Phase 1: deducts coins from local game state.
 * Phase 2: replace onConfirm call in useGameState.js with:
 *   writeContract({ address: FARMING_GAME_ADDRESS[chainId], abi: FARMING_GAME_ABI,
 *     functionName: 'withdraw', args: [coinsToWei(amount)] })
 */

import { useState } from 'react'

export function WithdrawModal({ coins, address, onWithdraw, onClose }) {
  const [amount, setAmount] = useState('')
  const parsed  = parseFloat(amount)
  const valid   = parsed > 0 && parsed <= coins
  const short   = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ''

  function handleSubmit() {
    if (!valid) return
    onWithdraw(parsed)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-800 border border-amber-600/50 rounded-2xl p-6 w-80 shadow-2xl">
        <h3 className="text-lg font-bold text-amber-400 mb-1">💸 Withdraw Coins</h3>
        <p className="text-xs text-gray-500 mb-4">Transfer in-game coins as FBMX to your wallet.</p>

        {/* Destination */}
        <div className="bg-gray-700/50 rounded-xl p-3 mb-4 text-xs">
          <div className="text-gray-500 mb-1">Destination wallet</div>
          <div className="font-mono text-amber-300 font-semibold">{short}</div>
        </div>

        {/* Balance */}
        <div className="flex justify-between text-xs text-gray-400 mb-3">
          <span>Available coins</span>
          <span className="text-amber-400 font-bold">{coins} 💰</span>
        </div>

        {/* Amount input */}
        <div className="mb-2">
          <div className="flex gap-2">
            <input
              type="number"
              min={0.01}
              max={coins}
              step={1}
              placeholder="Amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="flex-1 bg-gray-700 border border-gray-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={() => setAmount(String(coins))}
              className="text-xs font-bold text-amber-400 border border-amber-500/40 px-3 py-2 rounded-xl hover:bg-amber-500/10 transition-colors"
            >
              Max
            </button>
          </div>
          {parsed > coins && (
            <p className="text-xs text-red-400 mt-1">Exceeds balance</p>
          )}
        </div>

        {/* FBMX equivalent */}
        {valid && (
          <p className="text-xs text-green-400 mb-4">
            ≈ {parsed} FBMX will be sent to your wallet
          </p>
        )}

        {/* Phase 1 notice */}
        <div className="bg-amber-900/20 border border-amber-500/20 rounded-lg p-2 mb-4 text-xs text-amber-300/70">
          ⚠️ Phase 1 (off-chain): coins are reserved locally.
          Real FBMX transfer happens on-chain in Phase 2.
        </div>

        <div className="flex gap-3">
          <button
            disabled={!valid}
            onClick={handleSubmit}
            className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2 rounded-xl transition-colors"
          >
            Withdraw
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold py-2 rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
