/**
 * useOnChainGame — 100% on-chain game state via wagmi.
 *
 * Reads:  getPlayerState, getActiveListingIds, getListings, stageDuration
 * Writes: deposit (approve → deposit), withdraw, buySeeds, plant, harvest,
 *         listSeeds, cancelListing, buy
 *
 * All coin values are in wei on-chain (1 FBMX = 1e18 wei = 1 coin in-game).
 * Returned state uses plain numbers for UI convenience.
 */

import { useState, useCallback, useEffect } from 'react'
import { useReadContract, useReadContracts, useWriteContract, useChainId, usePublicClient } from 'wagmi'
import { formatUnits } from 'viem'
import {
  FARMING_GAME_ABI, FARMING_GAME_ADDRESS,
  ERC20_ABI, FBMX_ADDRESS,
  coinsToWei,
} from '../lib/contracts.js'

const SUPPORTED = new Set([56, 97, 31337])

/** Extract a short, user-readable message from a wagmi/viem error. */
function txErr(err) {
  // Contract revert string (e.g. "Insufficient contract liquidity")
  if (err?.cause?.reason)       return err.cause.reason
  // viem short message (e.g. "User rejected the request")
  if (err?.shortMessage)        return err.shortMessage
  return err?.message ?? 'Transaction failed'
}

/** Wei bigint → plain JS float */
function fromWei(wei) {
  return parseFloat(formatUnits(wei ?? 0n, 18))
}

export function useOnChainGame(address) {
  const chainId      = useChainId()
  const publicClient = usePublicClient()
  const supported    = SUPPORTED.has(chainId)
  const gameAddr     = supported ? FARMING_GAME_ADDRESS[chainId] : null

  const [log,           setLog]           = useState([])
  const [pendingAction, setPendingAction] = useState(null)

  const { mutateAsync: writeContractAsync } = useWriteContract()

  // ── Contract reads ────────────────────────────────────────────

  // Shared query options: poll every 3s, always refetch on mount and window focus
  const pollOpts = {
    staleTime:            0,
    refetchInterval:      3_000,
    refetchOnMount:       true,
    refetchOnWindowFocus: true,
  }

  const { data: playerData, refetch: refetchPlayer } = useReadContract({
    address:      gameAddr,
    abi:          FARMING_GAME_ABI,
    functionName: 'getPlayerState',
    args:         [address],
    query:        { enabled: !!address && !!gameAddr, ...pollOpts },
  })

  const { data: listingIds, refetch: refetchIds } = useReadContract({
    address:      gameAddr,
    abi:          FARMING_GAME_ABI,
    functionName: 'getActiveListingIds',
    query:        { enabled: !!gameAddr, ...pollOpts },
  })

  const { data: rawListings, refetch: refetchListings } = useReadContract({
    address:      gameAddr,
    abi:          FARMING_GAME_ABI,
    functionName: 'getListings',
    args:         [listingIds ?? []],
    query:        { enabled: !!gameAddr && !!(listingIds?.length), ...pollOpts },
  })

  const configQuery = { enabled: !!gameAddr, staleTime: 0, refetchOnMount: true, refetchOnWindowFocus: true }

  const { data: stageDurationSec,     refetch: refetchStageDuration } = useReadContract({
    address: gameAddr, abi: FARMING_GAME_ABI, functionName: 'stageDuration',    query: configQuery,
  })
  const { data: harvestGracePeriodSec, refetch: refetchGracePeriod } = useReadContract({
    address: gameAddr, abi: FARMING_GAME_ABI, functionName: 'harvestGracePeriod', query: configQuery,
  })

  const { data: rawMarketStats, refetch: refetchMarketStats } = useReadContract({
    address:      gameAddr,
    abi:          FARMING_GAME_ABI,
    functionName: 'getMarketStats',
    query:        { enabled: !!gameAddr, ...pollOpts },
  })

  const { data: rawCrops, refetch: refetchCrops } = useReadContract({
    address:      gameAddr,
    abi:          FARMING_GAME_ABI,
    functionName: 'getCrops',
    query:        { enabled: !!gameAddr, staleTime: 0, refetchOnMount: true },
  })

  const { data: rawTotalPlayers } = useReadContract({
    address:      gameAddr,
    abi:          FARMING_GAME_ABI,
    functionName: 'totalPlayers',
    query:        { enabled: !!gameAddr, staleTime: 0, refetchInterval: 30_000, refetchOnMount: true },
  })

  const { data: rawLeaderboardSeeds } = useReadContract({
    address:      gameAddr,
    abi:          FARMING_GAME_ABI,
    functionName: 'getLeaderboardSeeds',
    query:        { enabled: !!gameAddr, staleTime: 0, refetchInterval: 15_000, refetchOnMount: true },
  })

  const { data: rawLeaderboardCoins } = useReadContract({
    address:      gameAddr,
    abi:          FARMING_GAME_ABI,
    functionName: 'getLeaderboardCoins',
    query:        { enabled: !!gameAddr, staleTime: 0, refetchInterval: 15_000, refetchOnMount: true },
  })

  // ── Per-plot on-chain harvest status (ground truth, avoids Date.now() drift) ──
  // Query isHarvestReady and isHarvestLate for all 9 plot slots.
  const PLOT_INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8]
  const plotStatusContracts = address && gameAddr
    ? PLOT_INDICES.flatMap(i => [
        { address: gameAddr, abi: FARMING_GAME_ABI, functionName: 'isHarvestReady', args: [address, i] },
        { address: gameAddr, abi: FARMING_GAME_ABI, functionName: 'isHarvestLate',  args: [address, i] },
      ])
    : []

  const { data: plotStatusData, refetch: refetchPlotStatus } = useReadContracts({
    contracts: plotStatusContracts,
    query:     { enabled: !!address && !!gameAddr, ...pollOpts },
  })

  // ── Normalize data ────────────────────────────────────────────

  // seconds → ms, with fallbacks until chain responds
  const stageDurationMs    = stageDurationSec      ? Number(stageDurationSec)      * 1000 : 60_000
  const harvestGracePeriodMs = harvestGracePeriodSec ? Number(harvestGracePeriodSec) * 1000 : 30_000

  // viem v2 returns multi-output functions as a positional array:
  //   [0] = state tuple {coins, seeds}
  //   [1] = plots tuple[9] [{seedCount, plantedAt}, ...]
  // Named-property access (playerData.state) is also set when all outputs are named,
  // so we fall back to both forms to be safe.
  const pdState = playerData?.state ?? playerData?.[0]
  const pdPlots = playerData?.plots ?? playerData?.[1]

  // Game state (coins/seeds/plots) — null until loaded
  const state = pdState && address ? {
    address,
    coins: fromWei(pdState.coins),
    seeds: Number(pdState.seeds),
    plots: (pdPlots ?? []).map((p, i) => {
      if (!(p.plantedAt > 0n)) return null
      // useReadContracts returns pairs: [ready_0, late_0, ready_1, late_1, ...]
      const contractReady = plotStatusData?.[i * 2]?.result   ?? null
      const contractLate  = plotStatusData?.[i * 2 + 1]?.result ?? null
      // plot.duration is locked at plant time (crop's stageDuration, seconds → ms)
      const plotDurationMs = Number(p.duration) > 0 ? Number(p.duration) * 1000 : stageDurationMs
      return {
        // Synthetic id stable per plant lifecycle
        id:           `${address}-${i}-${String(p.plantedAt)}`,
        seedCount:    Number(p.seedCount),
        cropId:       Number(p.cropId),
        // Locked-in expected seed gain set by contract at plant time
        profit:       Number(p.profit),
        // Contract uses UNIX seconds; plants.js uses ms
        plantedAt:          Number(p.plantedAt) * 1000,
        stageDuration:      plotDurationMs,
        harvestGracePeriod: harvestGracePeriodMs,
        // Direct contract booleans — ground truth, no Date.now() drift
        contractReady,
        contractLate,
      }
    }),
  } : null

  // Market listings — shape matches what Basket/Marketplace expects
  const market = listingIds?.length && rawListings
    ? rawListings.map((l, i) => ({
        id:            listingIds[i],
        sellerAddress: l.seller,
        seedCount:     Number(l.seedCount),
        remaining:     Number(l.remaining),
        pricePerSeed:  fromWei(l.pricePerSeed), // wei → coins display
        listedAt:      Number(l.listedAt) * 1000,
        totalEarned:   fromWei(l.totalEarned),
      }))
    : []

  // Market stats: bonding curve price + VWAP from completed trades
  // rawMarketStats is a tuple: { currentSeedPrice, vwap, supply, planted, listed }
  // vwap == 0n means no trades yet (contract returns 0 when vwapDenominator == 0)
  const s = rawMarketStats
  const marketStats = s ? {
    currentSeedPrice: fromWei(s.currentSeedPrice),                          // coins per seed
    seedsPerCoin:     s.currentSeedPrice > 0n ? 1 / fromWei(s.currentSeedPrice) : 0,
    vwap:             s.vwap > 0n ? fromWei(s.vwap) : null,                 // null = no trades yet
    supply:           Number(s.supply),
    planted:          Number(s.planted),
    listed:           Number(s.listed),
    plantedPct:       s.supply > 0n ? Math.round(Number(s.planted) / Number(s.supply) * 100) : 0,
  } : null

  // Normalize crops array — plain JS objects for UI use
  const crops = rawCrops
    ? rawCrops.map((c, id) => ({
        id,
        name:          c.name,
        minSeeds:      Number(c.minSeeds),
        profitBps:     Number(c.profitBps),
        profitPct:     Number(c.profitBps) / 100,
        stageDuration: Number(c.stageDuration),          // seconds
        cyclesPerDay:  Math.floor(86_400 / (Number(c.stageDuration) * 4)),
        spriteUrl:     c.spriteUrl || `/crops/crop0${id + 1}.png`,
        active:        c.active,
      }))
    : []

  // ── Helpers ───────────────────────────────────────────────────

  const addLog = useCallback((msg, type = '') => {
    setLog(prev => [{ msg, type, id: Date.now() + Math.random() }, ...prev].slice(0, 40))
  }, [])

  async function refetchAll() {
    await Promise.all([refetchPlayer(), refetchIds(), refetchListings(), refetchStageDuration(), refetchGracePeriod(), refetchMarketStats(), refetchPlotStatus(), refetchCrops()])
  }

  // Refetch immediately whenever wallet or chain changes (page load / wallet switch)
  useEffect(() => {
    if (!gameAddr) return
    refetchAll()
  }, [address, gameAddr]) // eslint-disable-line react-hooks/exhaustive-deps

  /** Wait for a tx hash to be mined via the connected chain's public client. */
  async function waitTx(hash) {
    await publicClient.waitForTransactionReceipt({ hash })
  }

  /**
   * Wrap an async action with pending state + refetch + error logging.
   * Re-throws so callers (e.g. SwapModal) can keep UI open on failure.
   */
  async function run(label, fn) {
    setPendingAction(label)
    try {
      await fn()
      await refetchAll()
    } catch (err) {
      addLog(txErr(err), 'bad')
      throw err
    } finally {
      setPendingAction(null)
    }
  }

  // ── Actions ───────────────────────────────────────────────────

  const actions = {
    /** Buy seeds from the contract shop. 1 seed = 1 FBMX. */
    async buySeed(amount) {
      const n = Math.max(1, Math.floor(amount))
      await run('buySeeds', async () => {
        const h = await writeContractAsync({
          address: gameAddr, abi: FARMING_GAME_ABI,
          functionName: 'buySeeds', args: [BigInt(n)],
        })
        await waitTx(h)
        addLog(`Bought ${n} seed${n > 1 ? 's' : ''} for ${n} 💰.`, 'good')
      })
    },

    /** Plant 100 seeds on an empty plot. */
    async plantSeeds(plotIndex, cropId = 0) {
      const crop = crops[cropId]
      await run('plant', async () => {
        const h = await writeContractAsync({
          address: gameAddr, abi: FARMING_GAME_ABI,
          functionName: 'plant', args: [plotIndex, cropId],
        })
        await waitTx(h)
        addLog(`Planted ${crop?.minSeeds ?? '?'} seeds (${crop?.name ?? 'crop'}) on plot ${plotIndex + 1}. 🫘`, 'good')
      })
    },

    /** Harvest a ready plot. Reward calculated by contract. */
    async harvestPlot(plotIndex) {
      await run('harvest', async () => {
        const h = await writeContractAsync({
          address: gameAddr, abi: FARMING_GAME_ABI,
          functionName: 'harvest', args: [plotIndex],
        })
        await waitTx(h)
        addLog(`Harvested plot ${plotIndex + 1}. 🌾`, 'gold')
      })
    },

    /**
     * Deposit FBMX → in-game coins (two-step: approve then deposit).
     * Returns a Promise — SwapModal awaits it to show pending state.
     */
    async depositCoins(amount) {
      const wei = coinsToWei(amount)
      await run('deposit', async () => {
        addLog('Step 1/2 — Approving FBMX…', 'info')
        const approveTx = await writeContractAsync({
          address: FBMX_ADDRESS, abi: ERC20_ABI,
          functionName: 'approve', args: [gameAddr, wei],
        })
        await waitTx(approveTx)

        addLog('Step 2/2 — Depositing…', 'info')
        const depositTx = await writeContractAsync({
          address: gameAddr, abi: FARMING_GAME_ABI,
          functionName: 'deposit', args: [wei],
        })
        await waitTx(depositTx)
        addLog(`Deposited ${amount} FBMX → +${amount} coins. 💰`, 'good')
      })
    },

    /**
     * Withdraw in-game coins → FBMX to wallet.
     * Contract must hold sufficient FBMX liquidity.
     */
    async withdrawCoins(amount) {
      const wei = coinsToWei(amount)
      await run('withdraw', async () => {
        const h = await writeContractAsync({
          address: gameAddr, abi: FARMING_GAME_ABI,
          functionName: 'withdraw', args: [wei],
        })
        await waitTx(h)
        addLog(`Withdrew ${amount} coins → ${amount} FBMX. 💸`, 'gold')
      })
    },

    /** List seeds on the shared on-chain market. */
    async listOnMarket(seedCount, pricePerSeed) {
      const n = Math.floor(seedCount)
      const p = parseFloat(pricePerSeed)
      await run('listSeeds', async () => {
        const h = await writeContractAsync({
          address: gameAddr, abi: FARMING_GAME_ABI,
          functionName: 'listSeeds',
          args: [BigInt(n), coinsToWei(p)],
        })
        await waitTx(h)
        addLog(`Listed ${n} seeds @ ${p} 💰/seed.`, 'gold')
      })
    },

    /** Cancel own market listing — returns remaining seeds. */
    async cancelListing(listing) {
      await run('cancelListing', async () => {
        const h = await writeContractAsync({
          address: gameAddr, abi: FARMING_GAME_ABI,
          functionName: 'cancelListing', args: [listing.id],
        })
        await waitTx(h)
        addLog(`Listing cancelled — ${listing.remaining} seeds returned. ✅`, 'good')
      })
    },

    /** Buy seeds from another wallet's listing. */
    async buyFromMarket(listing, amount) {
      const n    = Math.max(1, Math.min(Math.floor(amount), listing.remaining))
      const cost = parseFloat((n * listing.pricePerSeed).toFixed(4))
      await run('buy', async () => {
        const h = await writeContractAsync({
          address: gameAddr, abi: FARMING_GAME_ABI,
          functionName: 'buy', args: [listing.id, BigInt(n)],
        })
        await waitTx(h)
        addLog(`Bought ${n} seeds for ${cost} 💰. 🫘`, 'gold')
      })
    },
  }

  const totalPlayers = rawTotalPlayers != null ? Number(rawTotalPlayers) : null

  const leaderboardSeeds = rawLeaderboardSeeds
    ? rawLeaderboardSeeds.map((e, i) => ({ rank: i + 1, player: e.player, seeds: Number(e.seeds) }))
    : []

  const leaderboardCoins = rawLeaderboardCoins
    ? rawLeaderboardCoins.map((e, i) => ({ rank: i + 1, player: e.player, coins: fromWei(e.coins) }))
    : []

  return { state, market, marketStats, crops, totalPlayers, leaderboardSeeds, leaderboardCoins, log, actions, pendingAction, supported }
}
