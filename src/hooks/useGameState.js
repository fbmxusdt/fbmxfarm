import { useState, useEffect, useCallback, useRef } from 'react'
import {
  createInitialState, buySeed, plantSeeds, harvestPlot,
  depositCoins, withdrawCoins,
  listOnMarket, cancelListing, buyFromMarket,
} from '../lib/gameLogic.js'
import { saveState, loadState, clearState } from '../lib/storage.js'
import { loadMarket, saveMarket } from '../lib/market.js'

export function useGameState(address) {
  const [state,  setState]  = useState(null)
  const [market, setMarket] = useState([])
  const [log,    setLog]    = useState([])
  const stateRef = useRef(null)
  stateRef.current = state

  // ── Wallet state ─────────────────────────────────────────────
  useEffect(() => {
    if (!address) { setState(null); return }
    const saved   = loadState(address)
    const initial = saved?.address?.toLowerCase() === address.toLowerCase()
      ? saved : createInitialState(address)
    setState(initial)
    saveState(initial)
  }, [address])

  // ── Shared market polling ─────────────────────────────────────
  useEffect(() => {
    setMarket(loadMarket())
    const id = setInterval(() => setMarket(loadMarket()), 2000)
    return () => clearInterval(id)
  }, [])

  // Cross-tab sync (wallet A buys → wallet B sees update without refresh)
  useEffect(() => {
    const handler = () => {
      setMarket(loadMarket())
      if (address) {
        const fresh = loadState(address)
        if (fresh) setState(fresh)
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [address])

  // ── Helpers ───────────────────────────────────────────────────
  const addLog = useCallback((msg, type = '') => {
    setLog(prev => [{ msg, type, id: Date.now() + Math.random() }, ...prev].slice(0, 40))
  }, [])

  const applyState = useCallback((result, logType = 'good') => {
    if (!result.ok) { addLog(result.msg, 'bad'); return false }
    setState(result.state)
    saveState(result.state)
    addLog(result.msg, logType)
    return true
  }, [addLog])

  // ── Actions ───────────────────────────────────────────────────
  const actions = {
    buySeed:     (amount)          => applyState(buySeed(stateRef.current, amount)),
    plantSeeds:  (plotIndex)       => applyState(plantSeeds(stateRef.current, plotIndex)),
    harvestPlot: (plotIndex, total)=> applyState(harvestPlot(stateRef.current, plotIndex, total), 'gold'),

    depositCoins:  (amount) => applyState(depositCoins(stateRef.current, amount), 'good'),
    withdrawCoins: (amount) => applyState(withdrawCoins(stateRef.current, amount), 'gold'),

    listOnMarket: (seedCount, price) => {
      const result = listOnMarket(stateRef.current, seedCount, price)
      if (!result.ok) { addLog(result.msg, 'bad'); return false }
      setState(result.state)
      saveState(result.state)
      const updated = [...loadMarket(), result.listing]
      saveMarket(updated)
      setMarket(updated)
      addLog(result.msg, 'gold')
      return true
    },

    cancelListing: (listing) => {
      const result = cancelListing(stateRef.current, listing)
      if (!result.ok) { addLog(result.msg, 'bad'); return false }
      setState(result.state)
      saveState(result.state)
      const updated = loadMarket().filter(l => l.id !== listing.id)
      saveMarket(updated)
      setMarket(updated)
      addLog(result.msg, 'good')
      return true
    },

    buyFromMarket: (listing, amount) => {
      const result = buyFromMarket(stateRef.current, listing, amount)
      if (!result.ok) { addLog(result.msg, 'bad'); return false }
      setState(result.state)
      saveState(result.state)
      // Credit seller coins in their saved wallet state
      const sellerState = loadState(result.sellerAddress)
      if (sellerState) saveState({ ...sellerState, coins: sellerState.coins + result.coinsEarned })
      // Update shared market listing
      const updated = loadMarket()
        .map(l => l.id !== listing.id ? l : {
          ...l, remaining: l.remaining - result.amountBought,
          totalEarned: l.totalEarned + result.coinsEarned,
        })
        .filter(l => l.remaining > 0)
      saveMarket(updated)
      setMarket(updated)
      addLog(result.msg, 'gold')
      return true
    },

    resetGame: () => {
      if (!address) return
      clearState(address)
      const fresh = createInitialState(address)
      setState(fresh)
      saveState(fresh)
      addLog('Game reset. Starting fresh! 🌱', 'good')
    },
  }

  return { state, market, log, actions }
}
