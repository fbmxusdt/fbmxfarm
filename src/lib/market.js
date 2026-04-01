/**
 * market.js — shared market storage across all wallets.
 * Single localStorage key readable by every connected wallet.
 * On-chain (Phase 2): replaced by contract event indexing / subgraph.
 */

const MARKET_KEY = 'farmingEvo_market_v2'

export function loadMarket() {
  try {
    const raw = localStorage.getItem(MARKET_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveMarket(listings) {
  try { localStorage.setItem(MARKET_KEY, JSON.stringify(listings)) }
  catch (e) { console.warn('Market save failed:', e) }
}
