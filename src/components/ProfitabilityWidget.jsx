/**
 * ProfitabilityWidget — shows harvest economics between Farm and Marketplace.
 *
 * Reads earnRateBps + seedsPerPlot from chain.
 * stageDuration comes from the first occupied plot (already in state).
 * Gas numbers are measured from actual contract calls.
 */

import { useState, useEffect } from 'react'
import { useReadContract, useChainId, usePublicClient } from 'wagmi'
import { FARMING_GAME_ABI, FARMING_GAME_ADDRESS } from '../lib/contracts.js'

// Measured gas units — back-calculated from live hardhat tx fees:
//   Plant:   0.004304352 BNB at 86.07 Gwei → 50,008 gas
//   Harvest: 0.004916916 BNB at 86.07 Gwei → 57,124 gas
const GAS_PLANT   = 50_008
const GAS_HARVEST = 57_124
const GAS_CYCLE   = GAS_PLANT + GAS_HARVEST   // 107,132

// BSC average gas price from BSCScan (0.07425 Gwei measured live)
const DEFAULT_GAS_GWEI = 0.005
// BNB/USD rough default — user can override
const DEFAULT_BNB_USD  = 600

const SUPPORTED = new Set([56, 97, 31337])

export function ProfitabilityWidget({ state, marketStats, crops }) {
  const chainId      = useChainId()
  const publicClient = usePublicClient()
  const gameAddr     = SUPPORTED.has(chainId) ? FARMING_GAME_ADDRESS[chainId] : null

  const [bnbUsd,       setBnbUsd]      = useState(DEFAULT_BNB_USD)
  const [fbmxUsd,      setFbmxUsd]     = useState('')
  const [gasGwei,      setGasGwei]     = useState(DEFAULT_GAS_GWEI)
  const [fetching,     setFetching]    = useState(false)
  const [expanded,     setExpanded]    = useState(false)
  const [selectedCrop, setSelectedCrop] = useState(0)

  // ── Crop selection for calculator ─────────────────────────────
  const activeCrops = crops?.filter(c => c.active) ?? []
  // Selected crop — fallback to first active if index out of range
  const calcCrop    = activeCrops[selectedCrop] ?? activeCrops[0] ?? null

  // Derive earnBps and plotSeeds from selected crop when available,
  // fall back to on-chain config reads for backward-compat
  const q = { enabled: !!gameAddr, staleTime: 0, refetchOnMount: true }
  const { data: earnRateBps } = useReadContract({ address: gameAddr, abi: FARMING_GAME_ABI, functionName: 'earnRateBps', query: { ...q, enabled: !!gameAddr && !calcCrop } })
  const { data: seedsPerPlot } = useReadContract({ address: gameAddr, abi: FARMING_GAME_ABI, functionName: 'seedsPerPlot', query: { ...q, enabled: !!gameAddr && !calcCrop } })

  const earnBps   = calcCrop ? calcCrop.profitBps  : (earnRateBps  != null ? Number(earnRateBps)  : null)
  const plotSeeds = calcCrop ? calcCrop.minSeeds   : (seedsPerPlot != null ? Number(seedsPerPlot) : null)
  const stageSec  = calcCrop ? calcCrop.stageDuration : null

  // ── Fetch live prices ──────────────────────────────────────────
  // FBMX: DexScreener pool API — free, no key, returns priceUsd directly
  //   Pool: PancakeSwap V3 0x200410102224189d502e33a1691f13f1b872755a (BSC)
  // BNB:  CoinGecko simple price — free tier, no key needed
  const [priceError, setPriceError] = useState(null)

  async function fetchCostPrice() {
    setFetching(true)
    setPriceError(null)
    const errors = []

    // ── FBMX price via DexScreener pool ──
    try {
      const res  = await fetch(
        'https://api.dexscreener.com/latest/dex/pairs/bsc/0x200410102224189d502e33a1691f13f1b872755a'
      )
      const data = await res.json()
      const pair = data?.pairs?.[0]
      if (pair?.priceUsd) {
        setFbmxUsd(String(parseFloat(pair.priceUsd)))
      } else {
        errors.push('FBMX: no price returned from DexScreener')
      }
    } catch (e) {
      errors.push(`FBMX: ${e.message}`)
    }

    // ── BNB price via CoinGecko ──
    try {
      const res  = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd'
      )
      const data = await res.json()
      if (data?.binancecoin?.usd) {
        setBnbUsd(data.binancecoin.usd)
      } else {
        errors.push('BNB: no price returned from CoinGecko')
      }
    } catch (e) {
      errors.push(`BNB: ${e.message}`)
    }

    // ── Live gas price from connected node ──
    try {
      const gasPrice = await publicClient.getGasPrice()  // bigint in wei
      setGasGwei(parseFloat((Number(gasPrice) / 1e9).toFixed(4)))
    } catch { /* silent — fall back to default */ }

    if (errors.length) setPriceError(errors.join(' · '))
    setFetching(false)
  }

  // Auto-fetch all prices on first load
  useEffect(() => { fetchCostPrice() }, [publicClient])

  // ── Core calculations ─────────────────────────────────────────
  const fbmx         = parseFloat(fbmxUsd) || null

  // Buy price = bonding curve shop price (paid when buying seeds to plant)
  const buyPrice     = marketStats?.currentSeedPrice ?? null   // FBMX per seed
  // Sell price = VWAP of actual market trades (what you receive when selling harvested seeds)
  // Falls back to buyPrice when no trades have occurred yet (vwap == null)
  const sellPrice    = marketStats?.vwap ?? buyPrice            // FBMX per seed
  const usingVwap    = marketStats?.vwap != null

  // Keep seedPrice alias as buyPrice for entry cost calc
  const seedPrice    = buyPrice

  // ── Locked-in profit from active plots (set at plant time) ───
  // Each plot stores the earnRateBps-based seed gain locked at planting.
  // This is immune to earnRateBps changes after planting.
  const activePlotsList = state?.plots?.filter(p => p?.seedCount > 0n) ?? []
  const activePlots     = activePlotsList.length
  const totalPlots      = state?.plots?.length ?? 9

  // Average locked profit per plot (seeds). Falls back to earnBps calc if no active plots.
  const avgLockedProfit = activePlots > 0
    ? activePlotsList.reduce((sum, p) => sum + Number(p.profit ?? 0n), 0) / activePlots
    : null

  // seeds earned per one harvest cycle (1 plot):
  //   • if active plots exist → use their locked-in profit (average across plots)
  //   • otherwise → compute from current earnRateBps for planning purposes
  const seedsEarned  = avgLockedProfit != null
    ? avgLockedProfit
    : (earnBps != null && plotSeeds != null) ? plotSeeds * (earnBps / 10_000) : null

  const usingLockedProfit = avgLockedProfit != null

  // revenue per harvest in USD — earned seeds sold at market sell price (VWAP preferred)
  const revenueUSD   = (seedsEarned != null && sellPrice != null && fbmx)
    ? seedsEarned * sellPrice * fbmx : null

  // gas cost in USD
  const gasCostUSD   = GAS_CYCLE * gasGwei * 1e-9 * bnbUsd
  // gas cost in FBMX equivalent
  const gasCostFBMX  = fbmx ? gasCostUSD / fbmx : null

  // net profit per harvest
  const netUSD       = revenueUSD != null ? revenueUSD - gasCostUSD : null

  // Full cycle = 4 stages to reach harvest window (stages 0→1→2→3→4 opening)
  const cycleSec     = stageSec != null ? 4 * stageSec : null
  const cyclesPerDay = cycleSec != null && cycleSec > 0 ? Math.floor(86_400 / cycleSec) : null
  const totalActiveSeedCount = state?.plots?.reduce(
    (sum, p) => sum + (p?.seedCount ? Number(p.seedCount) : 0), 0
  ) ?? 0
  const activeSeedCostUSD   = (totalActiveSeedCount > 0 && buyPrice != null && fbmx)
    ? totalActiveSeedCount * buyPrice * fbmx : null

  // daily net: cyclesPerDay × activePlots × netUSD
  const dailyNetUSD  = (cyclesPerDay != null && netUSD != null)
    ? cyclesPerDay * activePlots * netUSD : null

  // ── 30-day challenge ─────────────────────────────────────────
  // Correct model for this game:
  //   - Plots are FIXED (max 9). You always replant seedsPerPlot seeds.
  //   - Each cycle each plot earns exactly seedsEarned seeds (LINEAR, not exponential).
  //   - Per-slot earnings: cycles30 × seedsEarned  (accumulated in wallet)
  //   - All 9 slots run independently, totalled at the end.
  //   - True compound (exponential) would require being able to add seeds to a plot mid-cycle,
  //     which the contract does not support — principal is always fixed at seedsPerPlot.

  const MAX_SLOTS    = 9
  const cycles30     = cyclesPerDay != null ? cyclesPerDay * 30 : null

  // Seeds earned per slot over 30 days (linear: N cycles × seedsEarned per cycle)
  const seedsPerSlot30   = (cycles30 != null && seedsEarned != null)
    ? cycles30 * seedsEarned : null

  // All 9 slots running in parallel
  const seedsAllSlots30  = seedsPerSlot30 != null ? seedsPerSlot30 * MAX_SLOTS : null

  // USD value of all earned seeds — sold at market sell price (VWAP preferred)
  const seedProfitUSD = (seedsAllSlots30 != null && sellPrice != null && fbmx)
    ? seedsAllSlots30 * sellPrice * fbmx : null

  // Total gas: 9 slots × cycles30 × gasCostUSD per cycle
  const gasCost30USD  = (cycles30 != null)
    ? cycles30 * MAX_SLOTS * gasCostUSD : null

  // Net 30-day profit (all 9 slots)
  const net30USD      = (seedProfitUSD != null && gasCost30USD != null)
    ? seedProfitUSD - gasCost30USD : null

  // Entry cost = 9 plots × seedsPerPlot seeds × seedPrice (FBMX) × fbmxUSD
  const entryCostUSD  = (plotSeeds != null && seedPrice != null && fbmx)
    ? MAX_SLOTS * plotSeeds * seedPrice * fbmx : null

  // ROI % vs total entry cost for all 9 plots
  const roi30Pct      = (net30USD != null && entryCostUSD != null && entryCostUSD > 0)
    ? (net30USD / entryCostUSD) * 100 : null

  // Return multiplier: (invested + net profit) / invested  →  1.5× means money grew 1.5×
  const multiplier    = (net30USD != null && entryCostUSD != null && entryCostUSD > 0)
    ? (entryCostUSD + net30USD) / entryCostUSD : null

  // ── Helpers ───────────────────────────────────────────────────
  const f2    = v => v != null ? v.toFixed(2) : '—'
  const f4    = v => v != null ? v.toFixed(4) : '—'
  const fUSD  = v => v != null ? `$${Math.abs(v) < 0.0001 ? v.toExponential(2) : v.toFixed(4)}` : '—'
  const fSeeds = v => v != null ? Math.round(v).toLocaleString() : '—'
  const profColor = v => v == null ? 'text-gray-400' : v > 0 ? 'text-green-400' : 'text-red-400'
  const profBg    = v => v == null ? '' : v > 0 ? 'border-green-800/40 bg-green-900/10' : 'border-red-800/40 bg-red-900/10'

  // Whether current settings are profitable
  const isProfitable = netUSD != null && netUSD > 0

  return (
    <div className={`rounded-xl border transition-all ${isProfitable ? 'border-green-800/40' : netUSD != null ? 'border-red-800/40' : 'border-gray-700'} bg-gray-800 overflow-hidden`}>
      {/* ── Header ── */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-700/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">📈</span>
          <span className="text-sm font-bold text-gray-200 uppercase tracking-widest">Harvest Profitability</span>
          {!fbmx && (
            <span className="text-[10px] bg-amber-800/40 text-amber-400 border border-amber-700/40 rounded-full px-2 py-0.5">Enter FBMX price</span>
          )}
          {fbmx && netUSD != null && (
            <span className={`text-[10px] rounded-full px-2 py-0.5 font-bold ${isProfitable ? 'bg-green-900/40 text-green-400 border border-green-700/40' : 'bg-red-900/40 text-red-400 border border-red-700/40'}`}>
              {isProfitable ? `✓ +${fUSD(netUSD)}/harvest` : `✗ ${fUSD(netUSD)}/harvest`}
            </span>
          )}
        </div>
        <span className="text-gray-500 text-sm">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-4">

          {/* ── Crop selector ── */}
          {activeCrops.length > 0 && (
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Crop (for calculation)</div>
              <div className="flex gap-1 flex-wrap">
                {activeCrops.map((c, idx) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCrop(idx)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                      selectedCrop === idx
                        ? 'border-green-600 bg-green-900/30 text-green-300'
                        : 'border-gray-600 bg-gray-700/50 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {c.name} <span className="text-[10px] opacity-70">+{c.profitPct.toFixed(2)}% · {c.cyclesPerDay}/day</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Price inputs ── */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">FBMX (USD)</div>
              <div className="flex gap-1">
                <input
                  type="number" step="0.0001" placeholder="0.2217"
                  value={fbmxUsd}
                  onChange={e => setFbmxUsd(e.target.value)}
                  className="flex-1 min-w-0 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={fetchCostPrice} disabled={fetching}
                  title="Fetch FBMX · BNB · Gas price"
                  className="bg-gray-700 hover:bg-gray-600 border border-gray-600 text-xs px-2 rounded-lg disabled:opacity-40 shrink-0"
                >
                  {fetching ? '⏳' : '↻'}
                </button>
              </div>
              {priceError && (
                <div className="text-[10px] text-red-400 mt-1">{priceError}</div>
              )}
              {!priceError && fbmxUsd && (
                <div className="text-[10px] text-gray-600 mt-1">DexScreener · PCS V3 pool</div>
              )}
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">BNB (USD)</div>
              <input
                type="number" step="1"
                value={bnbUsd}
                onChange={e => setBnbUsd(parseFloat(e.target.value) || DEFAULT_BNB_USD)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Gas (Gwei)</div>
              <div className="flex gap-1">
                <input
                  type="number" step="0.5"
                  value={gasGwei}
                  onChange={e => setGasGwei(parseFloat(e.target.value) || DEFAULT_GAS_GWEI)}
                  className="flex-1 min-w-0 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={fetchCostPrice} disabled={fetching}
                  title="Fetch live gas price from connected node"
                  className="bg-gray-700 hover:bg-gray-600 border border-gray-600 text-xs px-2 rounded-lg disabled:opacity-40 shrink-0"
                >
                  {fetching ? '⏳' : '↻'}
                </button>
              </div>
            </div>
          </div>

          {/* ── Per-Harvest Stats ── */}
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Per Harvest (1 Plot)</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-[10px] text-gray-500 mb-1">Seeds Earned</div>
                <div className="text-lg font-bold text-green-400">+{seedsEarned != null ? f4(seedsEarned) : '—'}</div>
                <div className="text-[10px] text-gray-500">
                  {usingLockedProfit
                    ? `avg of ${activePlots} plot${activePlots !== 1 ? 's' : ''}`
                    : `${plotSeeds ?? '…'} × ${earnBps != null ? `${(earnBps/100).toFixed(2)}%` : '…'}`}
                </div>
                <div className="text-[10px] text-gray-600 mt-0.5">
                  {usingLockedProfit ? '🔒 locked at plant' : '~ earnRate estimate'}
                </div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-[10px] text-gray-500 mb-1">Seed Profit</div>
                <div className="text-lg font-bold text-amber-400">{fUSD(revenueUSD)}</div>
                <div className="text-[10px] text-gray-500">
                  {seedsEarned != null && sellPrice != null ? `${f4(seedsEarned * sellPrice)} FBMX` : '—'}
                </div>
                <div className="text-[10px] text-gray-600 mt-0.5">
                  {usingVwap ? '@ VWAP' : '@ shop price'}
                </div>
              </div>
              <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-3">
                <div className="text-[10px] text-gray-500 mb-1">Gas Fee</div>
                <div className="text-lg font-bold text-red-400">−{fUSD(gasCostUSD)}</div>
                <div className="text-[10px] text-gray-500">
                  {gasCostFBMX != null ? `−${f4(gasCostFBMX)} FBMX` : `${GAS_CYCLE.toLocaleString()} gas`}
                </div>
              </div>
              <div className={`rounded-lg p-3 border ${profBg(netUSD)}`}>
                <div className="text-[10px] text-gray-500 mb-1">Net Profit</div>
                <div className={`text-lg font-bold ${profColor(netUSD)}`}>{fUSD(netUSD)}</div>
                <div className="text-[10px] text-gray-500">
                  {netUSD != null ? (netUSD >= 0 ? '✓ profitable' : '✗ gas > reward') : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* ── Per-Day Stats ── */}
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
              Per Day · Stage = {stageSec != null ? `${stageSec}s` : '…'} · Cycle = {cycleSec != null ? cycleSec >= 3600 ? `${(cycleSec/3600).toFixed(1)}hr` : `${(cycleSec/60).toFixed(0)}min` : '…'}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                <div className="text-[10px] text-gray-500 mb-1">Cycles / 24hr</div>
                <div className="text-2xl font-bold text-white">{cyclesPerDay ?? '—'}</div>
                <div className="text-[10px] text-gray-500">per plot</div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                <div className="text-[10px] text-gray-500 mb-1">Active Plots</div>
                <div className="text-2xl font-bold text-amber-400">{activePlots}<span className="text-sm text-gray-500">/{totalPlots}</span></div>
                <div className="text-[10px] text-gray-500">planted now</div>
              </div>
              <div className={`rounded-lg p-3 text-center border ${profBg(dailyNetUSD)}`}>
                <div className="text-[10px] text-gray-500 mb-1">Daily Net</div>
                <div className={`text-2xl font-bold ${profColor(dailyNetUSD)}`}>{fUSD(dailyNetUSD)}</div>
                <div className="text-[10px] text-gray-500">{activePlots} plots × {cyclesPerDay ?? '?'} cycles</div>
              </div>
            </div>
          </div>

          {/* ── 30-Day Challenge ── */}
          <div className="rounded-xl border border-amber-700/30 bg-amber-900/5 p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">🏆</span>
              <span className="text-sm font-bold text-amber-400">30-Days Perfect Harvest Challenge</span>
              <span className="text-[10px] text-gray-500 ml-auto">{MAX_SLOTS} slots · every cycle · no missed harvests</span>
            </div>
            <div className="text-[10px] text-gray-600 mb-3">
              Each slot earns <span className="text-white">{seedsEarned ?? '?'} seeds/cycle</span> linearly.
              Principal stays at {plotSeeds ?? '?'} seeds/slot — plots are fixed, not compounding.
            </div>

            {/* Per-slot row */}
            <div className="bg-gray-800/40 rounded-lg px-3 py-2 mb-3 flex items-center justify-between flex-wrap gap-2">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Per Slot (1 of {MAX_SLOTS})</span>
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="text-sm font-bold text-green-400">+{fSeeds(seedsPerSlot30)}</div>
                  <div className="text-[10px] text-gray-500">seeds earned</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-amber-400">{fUSD(seedsPerSlot30 != null && sellPrice != null && fbmx ? seedsPerSlot30 * sellPrice * fbmx : null)}</div>
                  <div className="text-[10px] text-gray-500">seed value</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-red-400">−{fUSD(cycles30 != null ? cycles30 * gasCostUSD : null)}</div>
                  <div className="text-[10px] text-gray-500">gas cost</div>
                </div>
              </div>
            </div>

            {/* All 9 slots totals */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              <div className="bg-gray-800/60 rounded-lg p-3">
                <div className="text-[10px] text-gray-500 mb-1">Cycles / Slot</div>
                <div className="text-xl font-bold text-white">{cycles30 != null ? cycles30.toLocaleString() : '—'}</div>
                <div className="text-[10px] text-gray-500">{cyclesPerDay ?? '?'}/day × 30 days</div>
              </div>
              <div className="bg-gray-800/60 rounded-lg p-3">
                <div className="text-[10px] text-gray-500 mb-1">Total Seeds Earned</div>
                <div className="text-xl font-bold text-green-400">+{fSeeds(seedsAllSlots30)}</div>
                <div className="text-[10px] text-gray-500">{MAX_SLOTS} slots × {fSeeds(seedsPerSlot30)}</div>
              </div>
              <div className="bg-gray-800/60 rounded-lg p-3">
                <div className="text-[10px] text-gray-500 mb-1">Gross Seed Value</div>
                <div className="text-xl font-bold text-amber-400">{fUSD(seedProfitUSD)}</div>
                <div className="text-[10px] text-gray-500">before gas</div>
              </div>
              <div className={`rounded-lg p-3 border ${profBg(net30USD)}`}>
                <div className="text-[10px] text-gray-500 mb-1">Net Profit</div>
                <div className={`text-xl font-bold ${profColor(net30USD)}`}>{fUSD(net30USD)}</div>
                <div className="text-[10px] text-gray-500">gas: −{fUSD(gasCost30USD)}</div>
              </div>
            </div>

            {/* ── Investment vs Return ── */}
            {entryCostUSD != null && net30USD != null && (
              <div className="rounded-lg border border-gray-600 bg-gray-900/70 p-4">
                <div className="flex flex-wrap justify-around gap-y-4 gap-x-2 items-center">

                  {/* Invested */}
                  <div className="text-center min-w-[90px]">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">💰 You Invest</div>
                    <div className="text-2xl font-black text-white">{fUSD(entryCostUSD)}</div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      {MAX_SLOTS} plots × {plotSeeds ?? '?'} seeds
                    </div>
                    {activeSeedCostUSD != null && (
                      <div className="text-[10px] text-amber-400 mt-1 font-semibold">
                        {totalActiveSeedCount.toLocaleString()} seeds planted now
                        <br />{fUSD(activeSeedCostUSD)} active
                      </div>
                    )}
                  </div>

                  {/* Multiplier */}
                  <div className="text-center min-w-[80px]">
                    <div className="text-gray-600 text-sm mb-1">→ 30d →</div>
                    <div className={`text-4xl font-black ${multiplier != null && multiplier >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                      {multiplier != null ? `${multiplier.toFixed(2)}×` : '—'}
                    </div>
                    <div className={`text-xs font-bold mt-1 ${roi30Pct != null && roi30Pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {roi30Pct != null ? `${roi30Pct >= 0 ? '+' : ''}${f2(roi30Pct)}% ROI` : '—'}
                    </div>
                  </div>

                  {/* Net Profit */}
                  <div className="text-center min-w-[90px]">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">📈 30d Net Profit</div>
                    <div className={`text-2xl font-black ${profColor(net30USD)}`}>{fUSD(net30USD)}</div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      after {fUSD(gasCost30USD)} gas
                    </div>
                  </div>
                </div>

                {/* ROI bar */}
                <div className="mt-4">
                  <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${roi30Pct != null && roi30Pct >= 0 ? 'bg-gradient-to-r from-green-700 to-green-400' : 'bg-red-600'}`}
                      style={{ width: `${Math.min(100, Math.max(2, Math.abs(roi30Pct ?? 0)))}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-gray-600 mt-1.5">
                    {MAX_SLOTS} slots × {cycles30 ?? '?'} cycles × {seedsEarned ?? '?'} seeds × {seedPrice != null ? f4(seedPrice) : '?'} FBMX × ${fbmx ?? '?'} − {fUSD(gasCost30USD)} gas
                  </div>
                </div>
              </div>
            )}

            {!fbmx && (
              <div className="text-[10px] text-amber-500 mt-2">↑ Enter FBMX price above to see USD values</div>
            )}
          </div>

          <div className="text-[10px] text-gray-600">
            Gas: {GAS_PLANT.toLocaleString()} (plant) + {GAS_HARVEST.toLocaleString()} (harvest) = {GAS_CYCLE.toLocaleString()} gas/cycle.
            Stage duration read live from contract. Linear model: principal fixed at {plotSeeds ?? '?'} seeds/slot.
          </div>
        </div>
      )}
    </div>
  )
}
