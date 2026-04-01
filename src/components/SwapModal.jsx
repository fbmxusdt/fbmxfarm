/**
 * SwapModal — two-direction swap between FBMX wallet token and in-game coins.
 *
 * Direction A: FBMX → Coins  (on-chain: approve ERC20 + deposit)
 * Direction B: Coins → FBMX  (on-chain: withdraw — contract must hold liquidity)
 */

import { useState } from 'react'

const DIR_DEPOSIT  = 'deposit'
const DIR_WITHDRAW = 'withdraw'

// fbmxBalance = plain number for arithmetic
// fbmxFormatted = locale string for display only
export function SwapModal({ coins, fbmxBalance, fbmxFormatted, address, onDeposit, onWithdraw, onClose }) {
  const [direction,  setDirection]  = useState(DIR_DEPOSIT)
  const [amount,     setAmount]     = useState('')
  const [isPending,  setIsPending]  = useState(false)

  const isDeposit = direction === DIR_DEPOSIT
  const parsed    = parseFloat(amount) || 0
  const maxAmt    = isDeposit ? (fbmxBalance || 0) : coins
  const valid     = parsed > 0 && parsed <= maxAmt
  const short     = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ''

  function flip() {
    setDirection(d => d === DIR_DEPOSIT ? DIR_WITHDRAW : DIR_DEPOSIT)
    setAmount('')
  }

  function handleMax() {
    setAmount(String(maxAmt))
  }

  async function handleConfirm() {
    if (!valid || isPending) return
    setIsPending(true)
    try {
      if (isDeposit) await onDeposit(parsed)
      else           await onWithdraw(parsed)
      onClose()
    } catch {
      // Error already logged in hook — keep modal open so user can retry
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 fade-in"
      onClick={e => e.target === e.currentTarget && !isPending && onClose()}
    >
      <div className="bg-gray-800 border border-green-700/50 rounded-2xl p-6 w-96 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-green-400">⇄ Swap</h3>
          <button
            disabled={isPending}
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 text-xl leading-none disabled:opacity-30"
          >×</button>
        </div>

        {/* Direction tabs */}
        <div className="flex gap-2 mb-5">
          <button
            disabled={isPending}
            onClick={() => { setDirection(DIR_DEPOSIT); setAmount('') }}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ${
              isDeposit
                ? 'bg-green-700 text-white'
                : 'bg-gray-700 text-gray-400 hover:text-gray-200'
            }`}
          >FBMX → Coins</button>
          <button
            disabled={isPending}
            onClick={() => { setDirection(DIR_WITHDRAW); setAmount('') }}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ${
              !isDeposit
                ? 'bg-amber-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:text-gray-200'
            }`}
          >Coins → FBMX</button>
        </div>

        {/* Flow diagram */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 bg-gray-700/60 rounded-xl p-3 text-center">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">From</div>
            <div className="text-lg font-bold">{isDeposit ? '🪙 FBMX' : '💰 Coins'}</div>
            <div className="text-xs text-gray-400 mt-1">
              Balance: <span className={`font-bold ${isDeposit ? 'text-yellow-300' : 'text-amber-400'}`}>
                {isDeposit ? (fbmxFormatted ?? fbmxBalance) : coins}
              </span>
            </div>
          </div>

          <button
            disabled={isPending}
            onClick={flip}
            className="text-gray-400 hover:text-green-400 transition-colors text-2xl shrink-0 disabled:opacity-30"
            title="Flip direction"
          >⇄</button>

          <div className="flex-1 bg-gray-700/60 rounded-xl p-3 text-center">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">To</div>
            <div className="text-lg font-bold">{isDeposit ? '💰 Coins' : '🪙 FBMX'}</div>
            <div className="text-xs text-gray-400 mt-1">
              {isDeposit ? 'In-game balance' : 'Wallet balance'}
            </div>
          </div>
        </div>

        {/* Amount input */}
        <div className="mb-3">
          <div className="flex gap-2">
            <input
              type="number"
              min={0.01}
              max={maxAmt}
              step={1}
              placeholder={`Amount (max ${maxAmt})`}
              value={amount}
              disabled={isPending}
              onChange={e => setAmount(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConfirm()}
              autoFocus
              className="flex-1 bg-gray-700 border border-gray-600 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-green-500 disabled:opacity-50"
            />
            <button
              disabled={isPending}
              onClick={handleMax}
              className="text-xs font-bold text-green-400 border border-green-500/40 px-3 rounded-xl hover:bg-green-500/10 transition-colors disabled:opacity-30"
            >Max</button>
          </div>

          {parsed > maxAmt && (
            <p className="text-xs text-red-400 mt-1.5">
              Exceeds {isDeposit ? 'FBMX wallet balance' : 'in-game coin balance'}
            </p>
          )}
        </div>

        {/* Preview */}
        {valid && !isPending && (
          <div className="bg-gray-700/40 rounded-xl p-3 mb-4 text-xs space-y-1">
            <div className="flex justify-between text-gray-400">
              <span>You send</span>
              <span className="font-bold text-white">{parsed} {isDeposit ? 'FBMX' : 'Coins'}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>You receive</span>
              <span className="font-bold text-green-400">{parsed} {isDeposit ? 'Coins' : 'FBMX'}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Rate</span>
              <span>1 FBMX = 1 Coin</span>
            </div>
            {!isDeposit && (
              <div className="flex justify-between text-gray-400">
                <span>Destination</span>
                <span className="font-mono text-amber-300">{short}</span>
              </div>
            )}
          </div>
        )}

        {/* Pending state */}
        {isPending && (
          <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-3 mb-4 text-xs text-blue-300 text-center">
            <div className="text-base mb-1 animate-pulse">⏳</div>
            {isDeposit
              ? 'Confirm both transactions in your wallet…'
              : 'Confirm transaction in your wallet…'}
          </div>
        )}

        {/* Deposit note */}
        {isDeposit && !isPending && (
          <div className="bg-amber-900/20 border border-amber-600/20 rounded-lg p-2 mb-4 text-[11px] text-amber-300/70">
            ℹ️ Deposit requires 2 wallet confirmations: approve FBMX, then deposit.
          </div>
        )}

        {/* Action button */}
        <button
          disabled={!valid || isPending}
          onClick={handleConfirm}
          className={`w-full font-bold py-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-white ${
            isDeposit
              ? 'bg-green-700 hover:bg-green-600'
              : 'bg-amber-600 hover:bg-amber-500'
          }`}
        >
          {isPending
            ? '⏳ Waiting for confirmation…'
            : isDeposit
              ? `Deposit ${parsed || ''} FBMX → ${parsed || ''} Coins`
              : `Withdraw ${parsed || ''} Coins → ${parsed || ''} FBMX`}
        </button>
      </div>
    </div>
  )
}
