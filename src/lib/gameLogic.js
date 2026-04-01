/**
 * gameLogic.js — pure state transition functions.
 *
 * Each function takes current state + params → { ok, state?, msg }.
 * Off-chain (Phase 1): call directly, persist to localStorage.
 * On-chain (Phase 2): replace function body with wagmi writeContract call,
 *                     keeping the same external signature.
 */

import { MAX_SEEDS_PER_PLOT } from './plants.js'

export const SEED_COST   = 1    // 1 coin per seed  → on-chain: 1e18 FBMX wei
export const PLOT_COUNT  = 9
export const START_SEEDS = 0
export const START_COINS = 0

export function createInitialState(address) {
  return {
    address,
    coins: START_COINS,
    seeds: START_SEEDS,
    plots: Array(PLOT_COUNT).fill(null),
  }
}

/** Buy seeds. Maps to: contract `buySeeds(amount)` */
export function buySeed(state, amount) {
  const n    = Math.max(1, Math.floor(amount))
  const cost = n * SEED_COST
  if (state.coins < cost) return { ok: false, msg: `Need ${cost} 💰 (have ${state.coins}).` }
  return {
    ok:    true,
    msg:   `Bought ${n} seed${n > 1 ? 's' : ''} for ${cost} 💰.`,
    state: { ...state, coins: state.coins - cost, seeds: state.seeds + n },
  }
}

/** Plant 100 seeds on a plot. Maps to: contract `plant(plotIndex)` */
export function plantSeeds(state, plotIndex) {
  if (state.plots[plotIndex])           return { ok: false, msg: 'Plot already in use!' }
  if (state.seeds < MAX_SEEDS_PER_PLOT) return { ok: false, msg: `Need ${MAX_SEEDS_PER_PLOT} seeds (have ${state.seeds}).` }
  const newPlot = { id: crypto.randomUUID(), seedCount: MAX_SEEDS_PER_PLOT, plantedAt: Date.now() }
  const plots   = state.plots.map((p, i) => i === plotIndex ? newPlot : p)
  return {
    ok:    true,
    msg:   `Planted ${MAX_SEEDS_PER_PLOT} seeds on plot ${plotIndex + 1}. 🫘`,
    state: { ...state, seeds: state.seeds - MAX_SEEDS_PER_PLOT, plots },
  }
}

/** Harvest a ready plot. Maps to: contract `harvest(plotIndex)` */
export function harvestPlot(state, plotIndex, harvestTotal) {
  const plots = state.plots.map((p, i) => i === plotIndex ? null : p)
  return {
    ok:    true,
    msg:   `Harvested ${harvestTotal} seeds. 🌾`,
    state: { ...state, seeds: state.seeds + harvestTotal, plots },
  }
}

/**
 * Deposit FBMX → in-game coins. 1 FBMX = 1 coin.
 * Off-chain (Phase 1): adds coins to local state.
 * On-chain (Phase 2): replace with two steps:
 *   1. writeContract({ abi: ERC20_ABI, address: FBMX_ADDRESS,
 *        functionName: 'approve', args: [FARMING_GAME_ADDRESS[chainId], coinsToWei(amount)] })
 *   2. writeContract({ abi: FARMING_GAME_ABI, address: FARMING_GAME_ADDRESS[chainId],
 *        functionName: 'deposit', args: [coinsToWei(amount)] })
 */
export function depositCoins(state, amount) {
  const n = parseFloat(amount)
  if (!n || n <= 0) return { ok: false, msg: 'Enter a valid amount.' }
  return {
    ok:    true,
    msg:   `Deposited ${n} FBMX → +${n} coins. 💰`,
    state: { ...state, coins: state.coins + n },
  }
}

/**
 * Withdraw in-game coins → FBMX to wallet.
 * Off-chain (Phase 1): deducts coins from local state.
 * On-chain (Phase 2): replace with:
 *   writeContract({ abi: FARMING_GAME_ABI, address: FARMING_GAME_ADDRESS[chainId],
 *     functionName: 'withdraw', args: [coinsToWei(amount)] })
 *   Contract must hold enough FBMX liquidity (contractFBMXBalance >= amount).
 */
export function withdrawCoins(state, amount) {
  const n = parseFloat(amount)
  if (!n || n <= 0)    return { ok: false, msg: 'Enter a valid amount.' }
  if (state.coins < n) return { ok: false, msg: `Insufficient coins (have ${state.coins}).` }
  return {
    ok:    true,
    msg:   `Withdrew ${n} coins → ${n} FBMX sent to wallet. 💸`,
    state: { ...state, coins: state.coins - n },
  }
}

/** List seeds on the shared market. Maps to: contract `listSeeds(amount, pricePerSeed)` */
export function listOnMarket(state, seedCount, pricePerSeed) {
  const n = Math.floor(seedCount)
  const p = parseFloat(pricePerSeed)
  if (n < 1)              return { ok: false, msg: 'List at least 1 seed.' }
  if (state.seeds < n)    return { ok: false, msg: `Not enough seeds (have ${state.seeds}).` }
  if (p <= 0 || isNaN(p)) return { ok: false, msg: 'Price must be greater than 0.' }
  const listing = {
    id: crypto.randomUUID(), sellerAddress: state.address,
    seedCount: n, remaining: n, pricePerSeed: p, listedAt: Date.now(), totalEarned: 0,
  }
  return {
    ok:      true,
    msg:     `Listed ${n} seeds @ ${p} 💰/seed.`,
    state:   { ...state, seeds: state.seeds - n },
    listing,
  }
}

/** Cancel own market listing. Maps to: contract `cancelListing(listingId)` */
export function cancelListing(state, listing) {
  return {
    ok:    true,
    msg:   `Listing cancelled — ${listing.remaining} seeds returned.`,
    state: { ...state, seeds: state.seeds + listing.remaining },
  }
}

/**
 * Buy from another wallet's listing.
 * Maps to: contract `buy(listingId, amount)`
 * On-chain this is atomic; seller coins are credited in the same tx.
 */
export function buyFromMarket(buyerState, listing, amount) {
  const n    = Math.max(1, Math.min(Math.floor(amount), listing.remaining))
  const cost = parseFloat((n * listing.pricePerSeed).toFixed(4))
  if (buyerState.address?.toLowerCase() === listing.sellerAddress?.toLowerCase())
    return { ok: false, msg: 'Cannot buy your own listing.' }
  if (buyerState.coins < cost)
    return { ok: false, msg: `Need ${cost} 💰 (have ${buyerState.coins}).` }
  return {
    ok:            true,
    msg:           `Bought ${n} seeds from ${shortAddr(listing.sellerAddress)} for ${cost} 💰.`,
    state:         { ...buyerState, coins: buyerState.coins - cost, seeds: buyerState.seeds + n },
    sellerAddress: listing.sellerAddress,
    coinsEarned:   cost,
    amountBought:  n,
  }
}

function shortAddr(addr) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '?'
}
