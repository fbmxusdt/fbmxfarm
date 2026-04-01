/**
 * AdminPanel — owner-only UI to configure FarmingGame contract variables.
 *
 * Reads:  owner(), getGameConfig(), contractFBMXBalance()
 * Writes: setStageDuration, setSeedPrice, setPlotCount, setEarnRateBps,
 *         setSeedsPerPlot, fund (approve → fund)
 *
 * Visible only when the connected wallet matches the contract owner.
 */

import { useState, useEffect } from 'react'
import { useConnection, useReadContract, useWriteContract, useChainId, usePublicClient } from 'wagmi'
import { formatUnits, parseUnits } from 'viem'
import {
  FARMING_GAME_ABI, FARMING_GAME_ADDRESS,
  ERC20_ABI, FBMX_ADDRESS,
} from '../lib/contracts.js'

const SUPPORTED = new Set([56, 97, 31337])

function txErr(err) {
  return err?.cause?.reason ?? err?.shortMessage ?? err?.message ?? 'Transaction failed'
}

// ── Hook: reads all admin data ─────────────────────────────────
function useAdminData(gameAddr) {
  const q = { enabled: !!gameAddr, staleTime: 0, refetchInterval: 8_000 }

  const { data: owner,             refetch: refetchOwner      } = useReadContract({
    address: gameAddr, abi: FARMING_GAME_ABI, functionName: 'owner',
    query: { enabled: !!gameAddr },
  })
  const { data: stageDuration,     refetch: refetchA } = useReadContract({
    address: gameAddr, abi: FARMING_GAME_ABI, functionName: 'stageDuration',      query: q,
  })
  const { data: baseSeedPrice,     refetch: refetchB } = useReadContract({
    address: gameAddr, abi: FARMING_GAME_ABI, functionName: 'baseSeedPrice',      query: q,
  })
  const { data: plotCount,         refetch: refetchC } = useReadContract({
    address: gameAddr, abi: FARMING_GAME_ABI, functionName: 'plotCount',          query: q,
  })
  const { data: earnRateBps,       refetch: refetchD } = useReadContract({
    address: gameAddr, abi: FARMING_GAME_ABI, functionName: 'earnRateBps',        query: q,
  })
  const { data: seedsPerPlot,      refetch: refetchE } = useReadContract({
    address: gameAddr, abi: FARMING_GAME_ABI, functionName: 'seedsPerPlot',       query: q,
  })
  const { data: harvestGracePeriod, refetch: refetchF } = useReadContract({
    address: gameAddr, abi: FARMING_GAME_ABI, functionName: 'harvestGracePeriod', query: q,
  })
  const { data: actionCooldown,     refetch: refetchG } = useReadContract({
    address: gameAddr, abi: FARMING_GAME_ABI, functionName: 'actionCooldown',     query: q,
  })
  const { data: liquidity,         refetch: refetchLiquidity } = useReadContract({
    address: gameAddr, abi: FARMING_GAME_ABI, functionName: 'contractFBMXBalance', query: q,
  })
  const { data: rawCrops,          refetch: refetchCrops     } = useReadContract({
    address: gameAddr, abi: FARMING_GAME_ABI, functionName: 'getCrops', query: { enabled: !!gameAddr, staleTime: 0 },
  })

  // Build config as soon as any fields are available; show partials while others load
  const config = (stageDuration != null || baseSeedPrice != null || plotCount != null) ? {
    stageDuration:       stageDuration       ?? 0n,
    baseSeedPrice:       baseSeedPrice       ?? 0n,
    plotCount:           plotCount           ?? 0n,
    earnRateBps:         earnRateBps         ?? 0n,
    seedsPerPlot:        seedsPerPlot        ?? 0n,
    harvestGracePeriod:  harvestGracePeriod  ?? 0n,
    actionCooldown:      actionCooldown      ?? 0n,
  } : null

  const crops = rawCrops?.map((c, i) => ({
    id: i,
    name: c.name,
    minSeeds: Number(c.minSeeds),
    profitBps: Number(c.profitBps),
    stageDuration: Number(c.stageDuration),
    spriteUrl: c.spriteUrl,
    active: c.active,
  })) ?? null

  function refetchAll() {
    refetchOwner(); refetchA(); refetchB(); refetchC(); refetchD(); refetchE(); refetchF(); refetchG(); refetchLiquidity(); refetchCrops()
  }

  return { owner, config, liquidity, crops, refetchAll }
}

// ── Main component ─────────────────────────────────────────────
export function AdminPanel() {
  const { address }    = useConnection()
  const chainId        = useChainId()
  const publicClient   = usePublicClient()
  const supported      = SUPPORTED.has(chainId)
  const gameAddr       = supported ? FARMING_GAME_ADDRESS[chainId] : null

  const { owner, config, liquidity, crops, refetchAll } = useAdminData(gameAddr)

  const isOwner = address && owner &&
    address.toLowerCase() === owner.toLowerCase()

  if (!supported || !isOwner) return null

  return (
    <div className="bg-gray-900 border-t-2 border-red-800/50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xl">⚙️</span>
          <h2 className="text-lg font-bold text-red-400 uppercase tracking-widest">Admin Panel</h2>
          <span className="text-xs text-gray-600 font-mono">{owner?.slice(0,6)}…{owner?.slice(-4)}</span>
        </div>

        {/* ── Current Settings Summary ── */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Current On-Chain Settings</h3>
          {config ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Stage Duration</div>
                <div className="text-sm font-bold text-white">{Number(config.stageDuration)}s</div>
                <div className="text-[10px] text-gray-400">{(Number(config.stageDuration)/60).toFixed(1)} min</div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Grace Period</div>
                <div className="text-sm font-bold text-white">{Number(config.harvestGracePeriod)}s</div>
                <div className="text-[10px] text-gray-400">harvest buffer</div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Base Seed Price</div>
                <div className="text-sm font-bold text-amber-400">{parseFloat(formatUnits(config.baseSeedPrice, 18))} FBMX</div>
                <div className="text-[10px] text-gray-400">{Math.round(1 / parseFloat(formatUnits(config.baseSeedPrice, 18)))} seeds/coin</div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Earn Rate</div>
                <div className="text-sm font-bold text-green-400">{Number(config.earnRateBps)} BPS</div>
                <div className="text-[10px] text-gray-400">{(Number(config.earnRateBps)/100).toFixed(2)}% per harvest</div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Plot Count</div>
                <div className="text-sm font-bold text-white">{Number(config.plotCount)}</div>
                <div className="text-[10px] text-gray-400">plots per player</div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Seeds / Plot</div>
                <div className="text-sm font-bold text-white">{Number(config.seedsPerPlot)}</div>
                <div className="text-[10px] text-gray-400">seeds to plant</div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Action Cooldown</div>
                <div className="text-sm font-bold text-blue-400">{Number(config.actionCooldown)}s</div>
                <div className="text-[10px] text-gray-400">harvest · buy anti-bot</div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500 animate-pulse">Loading on-chain config…</div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ConfigSection
            title="Game Timing"
            gameAddr={gameAddr}
            publicClient={publicClient}
            refetchAll={refetchAll}
            fields={[
              {
                label:     'Stage Duration',
                hint:      'Seconds per stage (21600 s|6hrs, 10800 s|3hrs, 3600 s|60ms)',
                value:     config ? Number(config.stageDuration) : '',
                unit:      's',
                fn:        'setStageDuration',
                parse:     v => BigInt(Math.floor(Number(v))),
                validate:  v => Number(v) >= 10 || 'Min 10 seconds',
                display:   v => `${v}s (${(v/60).toFixed(1)} min)`,
              },
            ]}
          />

          <ConfigSection
            title="Economy"
            gameAddr={gameAddr}
            publicClient={publicClient}
            refetchAll={refetchAll}
            fields={[
              {
                label:    'Base Seed Price',
                hint:     'Floor FBMX per seed (e.g. 0.1 = 10 seeds/coin). Dynamic price scales up from this.',
                value:    config ? parseFloat(formatUnits(config.baseSeedPrice, 18)) : '',
                unit:     'FBMX',
                fn:       'setBaseSeedPrice',
                parse:    v => parseUnits(String(v), 18),
                validate: v => Number(v) > 0 || 'Must be > 0',
                display:  v => `${v} FBMX (${Math.round(1/v)} seeds/coin at floor)`,
              },
              {
                label:    'Earn Rate',
                hint:     'Basis points (100 = 1%, max 5000)',
                value:    config ? Number(config.earnRateBps) : '',
                unit:     'BPS',
                fn:       'setEarnRateBps',
                parse:    v => BigInt(Math.floor(Number(v))),
                validate: v => (Number(v) >= 1 && Number(v) <= 5000) || 'Must be 1–5000',
                display:  v => `${v} BPS (${(v/100).toFixed(2)}%)`,
              },
            ]}
          />

          <ConfigSection
            title="Harvest Timing"
            gameAddr={gameAddr}
            publicClient={publicClient}
            refetchAll={refetchAll}
            fields={[
              {
                label:    'Harvest Grace Period',
                hint:     'Extra seconds inside the harvest window before penalty fires. Covers tx mining delay. Default 30s.',
                value:    config ? Number(config.harvestGracePeriod) : '',
                unit:     's',
                fn:       'setHarvestGracePeriod',
                parse:    v => BigInt(Math.floor(Number(v))),
                validate: v => Number(v) >= 0 || 'Must be >= 0',
                display:  v => `${v}s grace`,
              },
              {
                label:    'Action Cooldown',
                hint:     'Seconds between harvest/buySeeds calls per player (anti-bot). 0 = disabled. Max 60s. Default 9s (~3 BSC blocks).',
                value:    config ? Number(config.actionCooldown) : '',
                unit:     's',
                fn:       'setActionCooldown',
                parse:    v => BigInt(Math.floor(Number(v))),
                validate: v => (Number(v) >= 0 && Number(v) <= 60) || 'Must be 0–60',
                display:  v => v === 0 ? 'disabled' : `${v}s cooldown`,
              },
            ]}
          />

          <ConfigSection
            title="Plot Config"
            gameAddr={gameAddr}
            publicClient={publicClient}
            refetchAll={refetchAll}
            fields={[
              {
                label:    'Active Plots',
                hint:     'Plots per player (1–9)',
                value:    config ? Number(config.plotCount) : '',
                unit:     'plots',
                fn:       'setPlotCount',
                parse:    v => BigInt(Math.floor(Number(v))),
                validate: v => (Number(v) >= 1 && Number(v) <= 9) || 'Must be 1–9',
                display:  v => `${v} plots`,
              },
              {
                label:    'Seeds Per Plot',
                hint:     'Seeds required to plant (also base harvest)',
                value:    config ? Number(config.seedsPerPlot) : '',
                unit:     'seeds',
                fn:       'setSeedsPerPlot',
                parse:    v => BigInt(Math.floor(Number(v))),
                validate: v => Number(v) >= 1 || 'Must be >= 1',
                display:  v => `${v} seeds`,
              },
            ]}
          />

          <LiquiditySection
            gameAddr={gameAddr}
            publicClient={publicClient}
            liquidity={liquidity}
            refetchAll={refetchAll}
          />
        </div>

        {/* ── Crops Management ── */}
        <CropsSection
          crops={crops}
          gameAddr={gameAddr}
          publicClient={publicClient}
          refetchAll={refetchAll}
        />

        {/* ── Profitability Calculator ── */}
        <ProfitabilityCalculator
          config={config}
          gameAddr={gameAddr}
          publicClient={publicClient}
          refetchAll={refetchAll}
        />
      </div>
    </div>
  )
}

// ── Profitability Calculator ───────────────────────────────────
// Gas measured from actual contract calls — back-calculated from live hardhat tx fees:
//   Plant:   0.004304352 BNB at 86.07 Gwei → 50,008 gas
//   Harvest: 0.004916916 BNB at 86.07 Gwei → 57,124 gas
const GAS_PLANT   = 50_008
const GAS_HARVEST = 57_124
const GAS_CYCLE   = GAS_PLANT + GAS_HARVEST  // 107,132 per plot per cycle

function ProfitabilityCalculator({ config, gameAddr, publicClient, refetchAll }) {
  const [fbmxPrice,    setFbmxPrice]    = useState('0.220')
  const [bnbPrice,     setBnbPrice]     = useState('600')
  const [gasGwei,      setGasGwei]      = useState('0.07425')
  const [fetching,     setFetching]     = useState(false)
  const [applying,     setApplying]     = useState(null)   // 'min'|'rec'|'com'
  const [feedback,     setFeedback]     = useState(null)

  const { mutateAsync: writeContractAsync } = useWriteContract()

  // ── Parse inputs ──
  const fbmx       = Math.max(0, parseFloat(fbmxPrice) || 0)
  const bnb        = Math.max(0, parseFloat(bnbPrice)  || 0)
  const gwei       = Math.max(0, parseFloat(gasGwei)   || 0)

  // ── From on-chain config (with fallbacks) ──
  const seedsPerPlot  = config ? Number(config.seedsPerPlot) : 100
  const earnBps       = config ? Number(config.earnRateBps)  : 100
  const currentBase   = config ? parseFloat(formatUnits(config.baseSeedPrice, 18)) : 0
  const stageSec      = config ? Number(config.stageDuration) : 3600
  const cycleSec      = 4 * stageSec                                      // 4 stages per harvest
  const cyclesPerDay  = cycleSec > 0 ? Math.floor(86_400 / cycleSec) : 0

  // ── Core math ──
  // Gas cost in USD per cycle (plant + harvest)
  const gasCostUSD  = GAS_CYCLE * gwei * 1e-9 * bnb
  // Seeds earned per harvest = seedsPerPlot × earnRate  (the delta returned on top of principal)
  const seedsEarned = seedsPerPlot * (earnBps / 10_000)
  // Revenue per harvest = earned seeds × baseSeedPrice(FBMX) × fbmxPrice(USD)
  // Note: baseSeedPrice is the configured floor — actual bonding curve price may be higher.
  const currentRevenueUSD = seedsEarned * currentBase * fbmx
  const currentNetUSD     = currentRevenueUSD - gasCostUSD

  // Required baseSeedPrice (FBMX) to hit a target profit multiple over gas
  // seedsEarned × baseSeedFBMX × fbmxUSD = gasCostUSD × multiple
  // → baseSeedFBMX = (gasCostUSD × multiple) / (seedsEarned × fbmxUSD)
  function calcRequired(multiple) {
    if (!fbmx || !seedsEarned || !gasCostUSD) return null
    return (gasCostUSD * multiple) / (seedsEarned * fbmx)
  }

  const baseBreakEven = calcRequired(1)      // 0× profit — exact gas cover
  const baseRec       = calcRequired(2)      // 2× gas = safe daily profit
  const baseCom       = calcRequired(3)      // 3× gas = comfortable profit

  // Daily net: 9 plots × cyclesPerDay (derived from stageDuration, not hardcoded)
  function dailyNet(baseFBMX) {
    if (!baseFBMX || cyclesPerDay === 0) return 0
    const rev = seedsEarned * baseFBMX * fbmx
    const gas = gasCostUSD
    return (rev - gas) * 9 * cyclesPerDay
  }

  // Price floor: minimum FBMX price where current settings break even
  const fbmxFloor = (seedsEarned > 0 && currentBase > 0)
    ? gasCostUSD / (seedsEarned * currentBase)
    : null

  // ── Fetch all live prices (FBMX · BNB · gas) in one call ──
  async function fetchCostPrice() {
    setFetching(true)
    try {
      const res  = await fetch(
        'https://api.dexscreener.com/latest/dex/pairs/bsc/0x200410102224189d502e33a1691f13f1b872755a'
      )
      const data = await res.json()
      const price = data?.pairs?.[0]?.priceUsd
      if (price) setFbmxPrice(String(parseFloat(price)))
    } catch { /* silent — user can type manually */ }

    try {
      const res  = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd')
      const data = await res.json()
      if (data?.binancecoin?.usd) setBnbPrice(String(data.binancecoin.usd))
    } catch { /* silent — user can type manually */ }

    try {
      const gasPrice = await publicClient.getGasPrice()  // bigint in wei
      setGasGwei(String(parseFloat((Number(gasPrice) / 1e9).toFixed(4))))
    } catch { /* silent */ }

    setFetching(false)
  }

  // Auto-fetch on first load
  useEffect(() => { fetchCostPrice() }, [publicClient])

  // ── Apply a recommended baseSeedPrice to the contract ──
  async function applyBase(label, fbmxPerSeed) {
    if (!fbmxPerSeed || fbmxPerSeed <= 0 || !gameAddr) return
    setApplying(label)
    setFeedback(null)
    try {
      // Format to 18 decimals safely
      const weiStr = parseUnits(fbmxPerSeed.toFixed(8), 18).toString()
      const hash   = await writeContractAsync({
        address: gameAddr, abi: FARMING_GAME_ABI,
        functionName: 'setBaseSeedPrice',
        args: [BigInt(weiStr)],
      })
      await publicClient.waitForTransactionReceipt({ hash })
      setFeedback({ ok: true, msg: `Base seed price set to ${fbmxPerSeed.toFixed(4)} FBMX/seed` })
      refetchAll()
    } catch (err) {
      setFeedback({ ok: false, msg: txErr(err) })
    } finally {
      setApplying(null)
    }
  }

  const fmtUSD  = v => v == null ? '—' : `$${v.toFixed(4)}`
  const fmtFBMX = v => v == null ? '—' : `${v.toFixed(4)} FBMX`
  const profitColor = v => v > 0 ? 'text-green-400' : v < 0 ? 'text-red-400' : 'text-gray-400'

  return (
    <div className="mt-4 bg-gray-800 border border-amber-800/40 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">📊</span>
        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest">Profitability Calculator</h3>
        <span className="text-[10px] text-gray-600 ml-1">Gas: {GAS_CYCLE.toLocaleString()} per cycle (measured)</span>
      </div>

      {/* ── Inputs row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {/* FBMX price */}
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">FBMX Price (USD)</div>
          <div className="flex gap-1">
            <input
              type="number"
              step="0.0001"
              value={fbmxPrice}
              onChange={e => setFbmxPrice(e.target.value)}
              className="flex-1 min-w-0 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={fetchCostPrice}
              disabled={fetching}
              title="Fetch FBMX · BNB · Gas price"
              className="bg-gray-700 hover:bg-gray-600 border border-gray-600 text-xs px-2 rounded-lg disabled:opacity-40"
            >
              {fetching ? '⏳' : '↻'}
            </button>
          </div>
          <div className="text-[10px] text-gray-600 mt-1">DexScreener · PCS V3 pool</div>
        </div>

        {/* BNB price */}
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">BNB Price (USD)</div>
          <div className="flex gap-1">
            <input
              type="number"
              step="1"
              value={bnbPrice}
              onChange={e => setBnbPrice(e.target.value)}
              className="flex-1 min-w-0 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={fetchCostPrice}
              disabled={fetching}
              title="Fetch FBMX · BNB · Gas price"
              className="bg-gray-700 hover:bg-gray-600 border border-gray-600 text-xs px-2 rounded-lg disabled:opacity-40"
            >
              {fetching ? '⏳' : '↻'}
            </button>
          </div>
        </div>

        {/* Gas price */}
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Gas Price (Gwei)</div>
          <div className="flex gap-1">
            <input
              type="number"
              step="0.1"
              value={gasGwei}
              onChange={e => setGasGwei(e.target.value)}
              className="flex-1 min-w-0 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={fetchCostPrice}
              disabled={fetching}
              title="Fetch FBMX · BNB · Gas price"
              className="bg-gray-700 hover:bg-gray-600 border border-gray-600 text-xs px-2 rounded-lg disabled:opacity-40"
            >
              {fetching ? '⏳' : '↻'}
            </button>
          </div>
        </div>

        {/* Gas cost summary */}
        <div className="bg-gray-700/50 rounded-lg px-3 py-2 flex flex-col justify-center">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Gas Cost / Cycle</div>
          <div className="text-lg font-bold text-red-400">{fmtUSD(gasCostUSD)}</div>
          <div className="text-[10px] text-gray-500">plant + harvest per plot</div>
        </div>
      </div>

      {/* ── Current settings analysis ── */}
      <div className="bg-gray-700/30 border border-gray-700 rounded-lg p-3 mb-4">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Current Settings Analysis</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <div className="text-[10px] text-gray-500">Seeds earned / harvest</div>
            <div className="text-sm font-bold text-white">{seedsEarned} seeds</div>
            <div className="text-[10px] text-gray-500">{seedsPerPlot} × {(earnBps/100).toFixed(2)}%</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500">Revenue / harvest</div>
            <div className="text-sm font-bold text-amber-400">{fmtUSD(currentRevenueUSD)}</div>
            <div className="text-[10px] text-gray-500">{currentBase.toFixed(4)} FBMX/seed</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500">Net profit / harvest</div>
            <div className={`text-sm font-bold ${profitColor(currentNetUSD)}`}>{fmtUSD(currentNetUSD)}</div>
            <div className="text-[10px] text-gray-500">{currentNetUSD >= 0 ? '✓ Profitable' : '✗ Gas eats profit'}</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500">FBMX floor to break even</div>
            <div className={`text-sm font-bold ${fbmxFloor != null && fbmx >= fbmxFloor ? 'text-green-400' : 'text-red-400'}`}>
              {fbmxFloor != null ? `$${fbmxFloor.toFixed(4)}` : '—'}
            </div>
            <div className="text-[10px] text-gray-500">
              {fbmxFloor != null && fbmx < fbmxFloor ? `Need $${(fbmxFloor - fbmx).toFixed(4)} more` : 'Currently safe'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Recommended settings table ── */}
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Recommended Base Seed Price</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        {[
          { label: 'min',  title: 'Break-Even',    desc: '1× gas — covers fees exactly',         base: baseBreakEven, color: 'border-gray-600 bg-gray-700/30',          btnCls: 'bg-gray-600 hover:bg-gray-500' },
          { label: 'rec',  title: 'Recommended',   desc: '2× gas — safe profit margin',           base: baseRec,       color: 'border-amber-700/50 bg-amber-900/10',     btnCls: 'bg-amber-600 hover:bg-amber-500' },
          { label: 'com',  title: 'Comfortable',   desc: '3× gas — strong daily earnings',        base: baseCom,       color: 'border-green-700/50 bg-green-900/10',     btnCls: 'bg-green-700 hover:bg-green-600' },
        ].map(({ label, title, desc, base, color, btnCls }) => {
          const netPerCycle = base != null ? seedsEarned * base * fbmx - gasCostUSD : null
          const daily       = base != null ? dailyNet(base) : null
          return (
            <div key={label} className={`rounded-xl border p-3 ${color}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">{title}</span>
                <span className="text-[10px] text-gray-500">{desc}</span>
              </div>
              <div className="mb-1">
                <span className="text-[10px] text-gray-500">Base seed price  </span>
                <span className="text-sm font-bold text-amber-300">{fmtFBMX(base)}</span>
              </div>
              <div className="mb-1">
                <span className="text-[10px] text-gray-500">Entry cost (100 seeds)  </span>
                <span className="text-xs font-bold text-white">
                  {base != null ? fmtUSD(base * seedsPerPlot * fbmx) : '—'}
                </span>
              </div>
              <div className="mb-1">
                <span className="text-[10px] text-gray-500">Net / harvest  </span>
                <span className={`text-xs font-bold ${profitColor(netPerCycle)}`}>{fmtUSD(netPerCycle)}</span>
              </div>
              <div className="mb-3">
                <span className="text-[10px] text-gray-500">Daily (9 plots × {cyclesPerDay} cycles/day)  </span>
                <span className={`text-xs font-bold ${profitColor(daily)}`}>{fmtUSD(daily)}</span>
              </div>
              <button
                disabled={!base || applying === label || !gameAddr}
                onClick={() => applyBase(label, base)}
                className={`w-full text-xs font-bold py-1.5 rounded-lg text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${btnCls}`}
              >
                {applying === label ? '⏳ Applying…' : `Apply ${fmtFBMX(base)}`}
              </button>
            </div>
          )
        })}
      </div>

      {feedback && (
        <p className={`text-[11px] mt-1 ${feedback.ok ? 'text-green-400' : 'text-red-400'}`}>
          {feedback.ok ? '✓ ' : '✗ '}{feedback.msg}
        </p>
      )}

      <p className="text-[10px] text-gray-600 mt-2">
        Gas: plant={GAS_PLANT.toLocaleString()} + harvest={GAS_HARVEST.toLocaleString()} = {GAS_CYCLE.toLocaleString()} gas/cycle.
        Daily uses {cyclesPerDay} cycles/day from stageDuration ({stageSec}s × 4 stages = {cycleSec}s/cycle).
        Revenue uses baseSeedPrice (floor) — live bonding curve price may be higher.
      </p>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────
function fmtDuration(seconds) {
  if (!seconds || seconds <= 0) return '—'
  if (seconds < 60)    return `${seconds}s`
  if (seconds < 3600)  return `${Math.floor(seconds / 60)}min`
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1).replace(/\.0$/, '')}hr`
  return `${(seconds / 86400).toFixed(1).replace(/\.0$/, '')}d`
}

// ── Crops Management ───────────────────────────────────────────
function CropsSection({ crops, gameAddr, publicClient, refetchAll }) {
  return (
    <div className="mt-4 bg-gray-800 border border-gray-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">🌱</span>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Crops Management</h3>
        {crops && (
          <span className="text-[10px] text-gray-600 ml-1">{crops.length} crop{crops.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Existing crops list */}
      <div className="space-y-2 mb-6">
        {!crops ? (
          <div className="text-xs text-gray-500 animate-pulse">Loading crops…</div>
        ) : crops.length === 0 ? (
          <div className="text-xs text-gray-500">No crops yet. Add one below.</div>
        ) : (
          crops.map(crop => (
            <CropRow
              key={crop.id}
              crop={crop}
              gameAddr={gameAddr}
              publicClient={publicClient}
              refetch={refetchAll}
            />
          ))
        )}
      </div>

      {/* Add crop form */}
      <AddCropForm
        nextCropId={crops?.length ?? 0}
        gameAddr={gameAddr}
        publicClient={publicClient}
        refetch={refetchAll}
      />
    </div>
  )
}

// ── Single crop row: stats + collapsible edit form ─────────────
function CropRow({ crop, gameAddr, publicClient, refetch }) {
  const [editing,  setEditing]  = useState(false)
  const [form,     setForm]     = useState({
    name:          crop.name,
    minSeeds:      String(crop.minSeeds),
    profitBps:     String(crop.profitBps),
    stageDuration: String(crop.stageDuration),
    spriteUrl:     crop.spriteUrl,
  })
  const [pending,  setPending]  = useState(null)   // 'save' | 'toggle'
  const [feedback, setFeedback] = useState(null)

  const { mutateAsync: writeContractAsync } = useWriteContract()

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setFeedback(null) }

  const minSeeds  = parseInt(form.minSeeds)      || 0
  const profitBps = parseInt(form.profitBps)     || 0
  const stageSec  = parseInt(form.stageDuration) || 0
  const valid     = form.name.trim().length > 0 && minSeeds >= 1 && profitBps >= 1 && profitBps <= 5000 && stageSec >= 10

  const cyclesPerDay     = crop.stageDuration > 0 ? Math.floor(86_400 / (crop.stageDuration * 4)) : 0
  const profitPct        = (crop.profitBps / 100).toFixed(1)
  const spriteForPreview = (editing ? form.spriteUrl : crop.spriteUrl) || '/crops/crop01.png'

  async function saveChanges() {
    if (!valid || pending) return
    setPending('save')
    setFeedback(null)
    try {
      const hash = await writeContractAsync({
        address: gameAddr, abi: FARMING_GAME_ABI,
        functionName: 'updateCrop',
        args: [crop.id, form.name.trim(), BigInt(minSeeds), BigInt(profitBps), BigInt(stageSec), form.spriteUrl.trim()],
      })
      await publicClient.waitForTransactionReceipt({ hash })
      setFeedback({ ok: true, msg: 'Crop updated' })
      setEditing(false)
      refetch()
    } catch (err) {
      setFeedback({ ok: false, msg: txErr(err) })
    } finally {
      setPending(null)
    }
  }

  async function toggleActive() {
    if (pending) return
    setPending('toggle')
    setFeedback(null)
    try {
      const hash = await writeContractAsync({
        address: gameAddr, abi: FARMING_GAME_ABI,
        functionName: 'setCropActive',
        args: [crop.id, !crop.active],
      })
      await publicClient.waitForTransactionReceipt({ hash })
      setFeedback({ ok: true, msg: crop.active ? 'Crop deactivated' : 'Crop activated' })
      refetch()
    } catch (err) {
      setFeedback({ ok: false, msg: txErr(err) })
    } finally {
      setPending(null)
    }
  }

  function cancelEdit() {
    setForm({ name: crop.name, minSeeds: String(crop.minSeeds), profitBps: String(crop.profitBps), stageDuration: String(crop.stageDuration), spriteUrl: crop.spriteUrl })
    setFeedback(null)
    setEditing(false)
  }

  return (
    <div className={`rounded-xl border p-3 transition-opacity ${crop.active ? 'border-gray-700 bg-gray-700/30' : 'border-gray-800 bg-gray-800/30 opacity-60'}`}>

      {/* ── Header row ── */}
      <div className="flex items-start gap-3">
        {/* Stage-0 thumbnail — live preview while editing spriteUrl */}
        <div
          className="shrink-0 rounded-lg"
          style={{
            width: 48, height: 48,
            backgroundImage:    `url(${spriteForPreview})`,
            backgroundSize:     '600% 100%',
            backgroundPosition: '0% 0%',
            backgroundRepeat:   'no-repeat',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        />

        <div className="flex-1 min-w-0">
          {/* Name + badge + ID + buttons */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-sm font-bold text-white">{crop.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{
              background: crop.active ? 'rgba(74,222,128,0.12)' : 'rgba(239,68,68,0.12)',
              color:      crop.active ? '#4ade80' : '#f87171',
              border:     `1px solid ${crop.active ? 'rgba(74,222,128,0.25)' : 'rgba(239,68,68,0.25)'}`,
            }}>
              {crop.active ? 'active' : 'inactive'}
            </span>
            <span className="text-[10px] text-gray-600">ID #{crop.id}</span>

            <div className="ml-auto flex gap-1.5 shrink-0">
              <button
                disabled={pending === 'toggle'}
                onClick={toggleActive}
                className={`text-[11px] font-bold px-2 py-0.5 rounded-lg transition-colors whitespace-nowrap disabled:opacity-40 ${
                  crop.active ? 'bg-red-900/60 hover:bg-red-800 text-red-300' : 'bg-green-900/60 hover:bg-green-800 text-green-300'
                }`}
              >
                {pending === 'toggle' ? '⏳' : crop.active ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => editing ? cancelEdit() : setEditing(true)}
                className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
              >
                {editing ? 'Cancel' : 'Edit'}
              </button>
            </div>
          </div>

          {/* Stats — read-only when not editing */}
          {!editing && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
              <span><span className="text-gray-600">Seeds: </span><span className="text-white font-mono">{crop.minSeeds}</span></span>
              <span><span className="text-gray-600">Profit: </span><span className="text-green-400 font-mono">{profitPct}%</span><span className="text-gray-600"> ({crop.profitBps} BPS)</span></span>
              <span><span className="text-gray-600">Stage: </span><span className="text-white font-mono">{fmtDuration(crop.stageDuration)}</span></span>
              <span><span className="text-gray-600">Cycles/day: </span><span className="text-amber-400 font-mono">{cyclesPerDay}</span></span>
              {crop.spriteUrl && <span className="text-gray-600 font-mono truncate">{crop.spriteUrl}</span>}
            </div>
          )}
        </div>
      </div>

      {/* ── Expandable edit form ── */}
      {editing && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Name</label>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500" />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Min Seeds</label>
            <input type="number" min={1} value={form.minSeeds} onChange={e => set('minSeeds', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500" />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Profit Rate</label>
            <div className="flex items-center gap-2">
              <input type="number" min={1} max={5000} value={form.profitBps} onChange={e => set('profitBps', e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500" />
              <span className="text-xs text-gray-500 whitespace-nowrap shrink-0">
                BPS{profitBps > 0 ? ` = ${(profitBps / 100).toFixed(2)}%` : ''}
              </span>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Stage Duration</label>
            <div className="flex items-center gap-2">
              <input type="number" min={10} value={form.stageDuration} onChange={e => set('stageDuration', e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500" />
              <span className="text-xs text-gray-500 whitespace-nowrap shrink-0">
                s{stageSec >= 60 ? ` = ${fmtDuration(stageSec)}` : ''}
              </span>
            </div>
            <p className="text-[10px] text-gray-600 mt-0.5">
              {stageSec >= 10 ? `${Math.floor(86_400 / (stageSec * 4))} cycles/day` : '4 stages to harvest'}
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Sprite URL</label>
            <input type="text" value={form.spriteUrl} onChange={e => set('spriteUrl', e.target.value)}
              placeholder="/crops/crop01.png"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-amber-500" />
            <p className="text-[10px] text-gray-600 mt-0.5">1200×200px · 6 frames left→right (thumbnail updates live above)</p>
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button
              disabled={!valid || pending === 'save'}
              onClick={saveChanges}
              className="bg-amber-700 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold px-4 py-1.5 rounded-lg transition-colors"
            >
              {pending === 'save' ? '⏳ Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {feedback && (
        <p className={`text-[11px] mt-2 ${feedback.ok ? 'text-green-400' : 'text-red-400'}`}>
          {feedback.ok ? '✓ ' : '✗ '}{feedback.msg}
        </p>
      )}
    </div>
  )
}

// ── Add crop form ───────────────────────────────────────────────
function AddCropForm({ nextCropId, gameAddr, publicClient, refetch }) {
  const EMPTY = { name: '', minSeeds: '', profitBps: '', stageDuration: '', spriteUrl: '' }
  const [form,     setForm]     = useState(EMPTY)
  const [pending,  setPending]  = useState(false)
  const [feedback, setFeedback] = useState(null)

  const { mutateAsync: writeContractAsync } = useWriteContract()

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setFeedback(null) }

  const minSeeds  = parseInt(form.minSeeds)     || 0
  const profitBps = parseInt(form.profitBps)    || 0
  const stageSec  = parseInt(form.stageDuration) || 0

  const valid =
    form.name.trim().length > 0 &&
    minSeeds  >= 1           &&
    profitBps >= 1 && profitBps <= 5000 &&
    stageSec  >= 10

  async function handleAdd() {
    if (!valid || pending) return
    setPending(true)
    setFeedback(null)
    try {
      const hash = await writeContractAsync({
        address: gameAddr, abi: FARMING_GAME_ABI,
        functionName: 'updateCrop',
        args: [
          nextCropId,
          form.name.trim(),
          BigInt(minSeeds),
          BigInt(profitBps),
          BigInt(stageSec),
          form.spriteUrl.trim(),
        ],
      })
      await publicClient.waitForTransactionReceipt({ hash })
      setForm(EMPTY)
      setFeedback({ ok: true, msg: `"${form.name.trim()}" added successfully` })
      refetch()
    } catch (err) {
      setFeedback({ ok: false, msg: txErr(err) })
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="border-t border-gray-700 pt-4">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">+ Add New Crop</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">

        {/* Name */}
        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="🌾 Wheat"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-green-500"
          />
        </div>

        {/* Min Seeds */}
        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Min Seeds</label>
          <input
            type="number"
            min={1}
            value={form.minSeeds}
            onChange={e => set('minSeeds', e.target.value)}
            placeholder="50"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-green-500"
          />
          <p className="text-[10px] text-gray-600 mt-0.5">seeds required to plant this crop</p>
        </div>

        {/* Profit BPS */}
        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Profit Rate</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={5000}
              value={form.profitBps}
              onChange={e => set('profitBps', e.target.value)}
              placeholder="100"
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-green-500"
            />
            <span className="text-xs text-gray-500 whitespace-nowrap shrink-0">
              BPS{profitBps > 0 ? ` = ${(profitBps / 100).toFixed(2)}%` : ''}
            </span>
          </div>
          <p className="text-[10px] text-gray-600 mt-0.5">1–5000 BPS (100 = 1%)</p>
        </div>

        {/* Stage Duration */}
        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Stage Duration</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={10}
              value={form.stageDuration}
              onChange={e => set('stageDuration', e.target.value)}
              placeholder="3600"
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-green-500"
            />
            <span className="text-xs text-gray-500 whitespace-nowrap shrink-0">
              s{stageSec >= 60 ? ` = ${fmtDuration(stageSec)}` : ''}
            </span>
          </div>
          <p className="text-[10px] text-gray-600 mt-0.5">
            seconds per stage ·{' '}
            {stageSec >= 10
              ? `${Math.floor(86_400 / (stageSec * 4))} cycles/day`
              : '4 stages to harvest'}
          </p>
        </div>
      </div>

      {/* Sprite URL — full width */}
      <div className="mb-3">
        <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Sprite URL</label>
        <input
          type="text"
          value={form.spriteUrl}
          onChange={e => set('spriteUrl', e.target.value)}
          placeholder="/crops/crop05.png  or  https://cdn.example.com/my-crop.png"
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-green-500"
        />
        <p className="text-[10px] text-gray-600 mt-0.5">
          1200×200px PNG · 6 frames left→right (Seed · Sprout · Growing · Mature · Harvest · Withered)
        </p>
      </div>

      {/* Sprite preview */}
      {form.spriteUrl && (
        <div className="flex items-center gap-3 mb-3 p-2 bg-gray-700/40 rounded-lg border border-gray-700">
          <span className="text-[10px] text-gray-500 shrink-0">Preview (stage 0):</span>
          <div
            className="rounded shrink-0"
            style={{
              width: 48, height: 48,
              backgroundImage:    `url(${form.spriteUrl})`,
              backgroundSize:     '600% 100%',
              backgroundPosition: '0% 0%',
              backgroundRepeat:   'no-repeat',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          />
        </div>
      )}

      <button
        disabled={!valid || pending}
        onClick={handleAdd}
        className="bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-2 rounded-lg transition-colors"
      >
        {pending ? '⏳ Adding…' : '+ Add Crop'}
      </button>

      {feedback && (
        <p className={`text-[11px] mt-2 ${feedback.ok ? 'text-green-400' : 'text-red-400'}`}>
          {feedback.ok ? '✓ ' : '✗ '}{feedback.msg}
        </p>
      )}
    </div>
  )
}

// ── Reusable config section with one or more fields ────────────
function ConfigSection({ title, fields, gameAddr, publicClient, refetchAll }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{title}</h3>
      <div className="space-y-4">
        {fields.map(field => (
          <ConfigField
            key={field.fn}
            {...field}
            gameAddr={gameAddr}
            publicClient={publicClient}
            refetchAll={refetchAll}
          />
        ))}
      </div>
    </div>
  )
}

// ── Single editable config field ───────────────────────────────
function ConfigField({ label, hint, value, unit, fn, parse, validate, display, gameAddr, publicClient, refetchAll }) {
  const [input,      setInput]      = useState('')
  const [pending,    setPending]    = useState(false)
  const [feedback,   setFeedback]   = useState(null) // { ok, msg }

  const { mutateAsync: writeContractAsync } = useWriteContract()

  const editVal  = input !== '' ? input : (value !== '' ? String(value) : '')
  const parsed   = parseFloat(editVal)
  const validMsg = editVal !== '' ? validate(parsed) : null   // null = valid, string = error
  const isDirty  = editVal !== '' && String(value) !== editVal

  async function save() {
    if (validMsg !== true && validMsg !== null && validMsg !== false) {
      // validMsg is an error string
      setFeedback({ ok: false, msg: validMsg })
      return
    }
    if (!isDirty || pending) return
    setPending(true)
    setFeedback(null)
    try {
      const hash = await writeContractAsync({
        address: gameAddr, abi: FARMING_GAME_ABI,
        functionName: fn, args: [parse(parsed)],
      })
      await publicClient.waitForTransactionReceipt({ hash })
      setInput('')
      setFeedback({ ok: true, msg: `Saved: ${display(parsed)}` })
      refetchAll()
    } catch (err) {
      setFeedback({ ok: false, msg: txErr(err) })
    } finally {
      setPending(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-semibold text-gray-200">{label}</label>
        {value !== '' && (
          <span className="text-xs text-gray-500">
            Current: <span className="text-amber-400 font-mono">{display(value)}</span>
          </span>
        )}
      </div>
      <p className="text-[11px] text-gray-500 mb-2">{hint}</p>
      <div className="flex gap-2">
        <input
          type="number"
          value={editVal}
          disabled={pending}
          onChange={e => { setInput(e.target.value); setFeedback(null) }}
          onKeyDown={e => e.key === 'Enter' && save()}
          placeholder={String(value ?? '…')}
          className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-red-500 disabled:opacity-50"
        />
        <span className="text-xs text-gray-500 self-center shrink-0">{unit}</span>
        <button
          disabled={!isDirty || pending || (validMsg !== null && validMsg !== true)}
          onClick={save}
          className="bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
        >
          {pending ? '⏳' : 'Save'}
        </button>
      </div>
      {validMsg && validMsg !== true && (
        <p className="text-[11px] text-red-400 mt-1">{validMsg}</p>
      )}
      {feedback && (
        <p className={`text-[11px] mt-1 ${feedback.ok ? 'text-green-400' : 'text-red-400'}`}>
          {feedback.ok ? '✓ ' : '✗ '}{feedback.msg}
        </p>
      )}
    </div>
  )
}

// ── Liquidity section: fund the contract ──────────────────────
function LiquiditySection({ gameAddr, publicClient, liquidity, refetchAll }) {
  const [amount,   setAmount]   = useState('')
  const [pending,  setPending]  = useState(false)
  const [feedback, setFeedback] = useState(null)

  const { mutateAsync: writeContractAsync } = useWriteContract()

  const parsed   = parseFloat(amount) || 0
  const liquidityFmt = liquidity != null
    ? parseFloat(formatUnits(liquidity, 18)).toLocaleString()
    : '…'

  async function handleFund() {
    if (parsed <= 0 || pending) return
    setPending(true)
    setFeedback(null)
    try {
      const wei = parseUnits(String(parsed), 18)
      // Step 1: approve
      const approveTx = await writeContractAsync({
        address: FBMX_ADDRESS, abi: ERC20_ABI,
        functionName: 'approve', args: [gameAddr, wei],
      })
      await publicClient.waitForTransactionReceipt({ hash: approveTx })
      // Step 2: fund
      const fundTx = await writeContractAsync({
        address: gameAddr, abi: FARMING_GAME_ABI,
        functionName: 'fund', args: [wei],
      })
      await publicClient.waitForTransactionReceipt({ hash: fundTx })
      setAmount('')
      setFeedback({ ok: true, msg: `Funded ${parsed} FBMX. New balance updating…` })
      refetchAll()
    } catch (err) {
      setFeedback({ ok: false, msg: txErr(err) })
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Contract Liquidity</h3>

      <div className="bg-gray-700/50 rounded-lg p-3 mb-4 flex items-center justify-between">
        <span className="text-sm text-gray-400">FBMX Balance</span>
        <span className="font-bold text-amber-400 font-mono">{liquidityFmt} FBMX</span>
      </div>

      <p className="text-[11px] text-gray-500 mb-2">
        Add FBMX liquidity so players can withdraw. Requires 2 wallet confirmations.
      </p>

      <div className="flex gap-2">
        <input
          type="number"
          min={0}
          value={amount}
          disabled={pending}
          onChange={e => { setAmount(e.target.value); setFeedback(null) }}
          onKeyDown={e => e.key === 'Enter' && handleFund()}
          placeholder="Amount to fund"
          className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-green-500 disabled:opacity-50"
        />
        <span className="text-xs text-gray-500 self-center shrink-0">FBMX</span>
        <button
          disabled={parsed <= 0 || pending}
          onClick={handleFund}
          className="bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
        >
          {pending ? '⏳' : 'Fund'}
        </button>
      </div>

      {feedback && (
        <p className={`text-[11px] mt-2 ${feedback.ok ? 'text-green-400' : 'text-red-400'}`}>
          {feedback.ok ? '✓ ' : '✗ '}{feedback.msg}
        </p>
      )}
    </div>
  )
}
