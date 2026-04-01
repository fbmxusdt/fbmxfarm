import { useState, useEffect } from 'react'
import { useReadContract, useChainId } from 'wagmi'
import { formatUnits } from 'viem'
import { FARMING_GAME_ABI, FARMING_GAME_ADDRESS } from '../lib/contracts.js'

const SUPPORTED = new Set([56, 97, 31337])
const DEXSCREENER_URL =
  'https://api.dexscreener.com/latest/dex/pairs/bsc/0x200410102224189d502e33a1691f13f1b872755a'

const S = {
  bg:        'var(--forest-dark)',
  bgAlt:     'var(--soil-dark)',
  card:      'var(--card-bg)',
  border:    'var(--card-border)',
  gold:      'var(--gold-bright)',
  goldMid:   'var(--gold-mid)',
  moss:      'var(--moss)',
  parchment: 'var(--parchment)',
  muted:     'var(--parchment-dim)',
  bark:      'var(--bark)',
  soilMid:   'var(--soil-mid)',
}

const stages = [
  {
    stage: 0, emoji: '🫘', name: 'Seed',         time: 'Hour 0',
    color: '#9b6b4d',
    desc: 'The moment you plant, the clock starts. Your seed sits in rich, dark soil, drawing nutrients and beginning its transformation.',
    tip: 'Plant all 9 plots at the same time to synchronize your harvests — one big payoff every 24 hours.',
  },
  {
    stage: 1, emoji: '🌱', name: 'Sprout',        time: 'Hour 6',
    color: '#4a7a3a',
    desc: 'A tender green shoot breaks the surface after 6 hours. Your investment is on its way — still fragile, but growing with purpose.',
    tip: 'Perfect time to check your seed inventory and plan your next cycle\'s purchase.',
  },
  {
    stage: 2, emoji: '🪴', name: 'Growing Plant', time: 'Hour 12',
    color: '#3d6630',
    desc: 'Halfway through. Leaves unfurl, roots deepen. The plant is establishing itself — you\'re past the point of no return.',
    tip: 'Scout the marketplace at midday — seed prices often dip when other farmers are busy.',
  },
  {
    stage: 3, emoji: '🌳', name: 'Mature Plant',  time: 'Hour 18',
    color: '#2d5224',
    desc: 'Six more hours. Full height, strong trunk, deep roots. The plant has earned its place in the farm — prepare your harvest strategy.',
    tip: 'Decide now: sell coins directly or list seeds on the marketplace for a premium?',
  },
  {
    stage: 4, emoji: '🚜', name: 'Harvest Ready', time: 'Hour 24',
    color: '#d4a017',
    desc: 'One full day has passed. The plant has reached its peak. Harvest now and replant immediately to keep the cycle running without interruption.',
    tip: 'Harvest and replant in the same session. Any delay is a full 24-hour cycle lost.',
  },
]

const mechanics = [
  {
    icon: '⏰',
    title: 'Time-Based Evolution',
    body: 'Plants evolve every 6 hours using on-chain block timestamps. Close the app, go to work, sleep — your plants keep growing. Come back at the 24-hour mark and everything is ready to harvest.',
  },
  {
    icon: '📊',
    title: 'The Economy',
    body: 'Seeds are purchased at the shop using in-game coins. A harvest returns coins based on your earn rate and the current seed price. The bonding-curve price adjusts with supply and demand, rewarding early farmers.',
  },
  {
    icon: '🔄',
    title: 'FBMX ↔ Coins',
    body: 'The exchange rate is 1:1. Deposit FBMX tokens from your wallet to get in-game coins. Withdraw coins back to your wallet as FBMX at any time. Your earnings are real on-chain assets.',
  },
  {
    icon: '🏪',
    title: 'The Marketplace',
    body: 'List your seeds for sale at any price you choose. Buy seeds below shop price to cut your cost basis. Sell above during demand spikes. The marketplace is a player-driven exchange — another lever for profit.',
  },
]

const strategies = [
  {
    level: 'Beginner',
    color: 'var(--moss)',
    bg: 'rgba(106,172,82,0.08)',
    border: 'rgba(106,172,82,0.25)',
    steps: [
      'Start with 50 FBMX — enough for seeds and multiple cycles',
      'Plant all 9 plots simultaneously at the same time of day',
      'Return 24 hours later, harvest everything, replant immediately',
      'After 3 cycles, reinvest 50% of profits into extra seed reserves',
      'Build a routine: morning plant, morning harvest the next day',
    ],
  },
  {
    level: 'Intermediate',
    color: 'var(--gold-bright)',
    bg: 'rgba(212,160,23,0.08)',
    border: 'rgba(212,160,23,0.25)',
    steps: [
      'Stagger two groups of plots 12 hours apart for twice-daily harvests',
      'Monitor the marketplace — buy seeds below shop floor price when available',
      'List surplus seeds between plantings to earn passive income',
      'Track the bonding-curve price: buy seeds when price is at floor',
      'Convert FBMX profits at market peaks, hold coins for reinvestment at troughs',
    ],
  },
  {
    level: 'Advanced',
    color: '#c084fc',
    bg: 'rgba(192,132,252,0.08)',
    border: 'rgba(192,132,252,0.25)',
    steps: [
      'Stagger all 9 plots across 6-hour windows for near-continuous harvest flow',
      'Arbitrage: buy marketplace seeds below shop floor, harvest, profit on the spread',
      'Time large FBMX deposits to coincide with low bonding-curve price windows',
      'Compound 100% of earnings for 5 full cycles before withdrawing profit',
      'Track market volume — list seeds when new depositors arrive and demand spikes',
    ],
  },
]

const faqs = [
  {
    q: 'What happens if I don\'t harvest exactly at hour 24?',
    a: 'Your plant stays at stage 4 — it won\'t wither. There\'s also a grace period built into the contract. However, every hour you delay is an hour you\'re not replanting and earning the next cycle.',
  },
  {
    q: 'Can I lose my seeds or coins?',
    a: 'No. Game state is stored on-chain. Seeds and coins only leave your account by your deliberate action — planting, buying, or withdrawing.',
  },
  {
    q: 'What is the best time of day to farm?',
    a: 'Pick a consistent time — morning or evening — and stick to it. Since evolution uses real timestamps, planting at 8am means harvest at 8am the next day. Consistency is the strategy.',
  },
  {
    q: 'Is there a maximum number of plots?',
    a: 'Currently 9 plots per wallet. Plot expansion is on the roadmap — early farmers will have first-mover advantages when the grid grows.',
  },
  {
    q: 'How do I get FBMX tokens?',
    a: 'FBMX is a BEP-20 token on BSC, available on supported DEXes. Once you hold FBMX, deposit it via the in-game swap interface to start farming.',
  },
]

// ── Live on-chain calculator ──────────────────────────────────────
function LiveCalculator() {
  const chainId  = useChainId()
  const gameAddr = SUPPORTED.has(chainId) ? FARMING_GAME_ADDRESS[chainId] : null

  const q = { enabled: !!gameAddr, staleTime: 30_000, refetchOnWindowFocus: true }

  const { data: cfg  } = useReadContract({ address: gameAddr, abi: FARMING_GAME_ABI, functionName: 'getGameConfig',   query: q })
  const { data: mkt  } = useReadContract({ address: gameAddr, abi: FARMING_GAME_ABI, functionName: 'getMarketStats',  query: q })

  const [fbmxUsd,    setFbmxUsd]    = useState(null)
  const [fetching,   setFetching]   = useState(false)
  const [fetchErr,   setFetchErr]   = useState(null)
  const [lastFetched,setLastFetched] = useState(null)

  const fetchPrice = async () => {
    setFetching(true); setFetchErr(null)
    try {
      const res  = await fetch(DEXSCREENER_URL)
      const data = await res.json()
      const p    = data?.pairs?.[0]?.priceUsd
      if (p) { setFbmxUsd(parseFloat(p)); setLastFetched(new Date()) }
      else   { setFetchErr('Price not found') }
    } catch (e) { setFetchErr(e.message) }
    finally { setFetching(false) }
  }

  // Auto-fetch on mount
  useEffect(() => { fetchPrice() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Parse on-chain config
  const fromWei = (v) => v != null ? parseFloat(formatUnits(v, 18)) : null

  const stageSec    = cfg?.stageDuration     != null ? Number(cfg.stageDuration)     : null
  const seedsPerPlt = cfg?.seedsPerPlot      != null ? Number(cfg.seedsPerPlot)      : null
  const earnBps     = cfg?.earnRateBps       != null ? Number(cfg.earnRateBps)        : null
  const basePrice   = fromWei(cfg?.baseSeedPrice)   // FBMX per seed (floor)
  const livePrice   = fromWei(mkt?.currentSeedPrice) // FBMX per seed (bonding curve)
  const vwap        = mkt?.vwap > 0n ? fromWei(mkt?.vwap) : null

  const seedPrice   = livePrice ?? basePrice   // use live price if available

  // ── Economy math ────────────────────────────────────────────────
  //
  // How harvest works:
  //   • You SPEND:   seedsPerPlot × seedPrice  coins  (to plant)
  //   • You RECEIVE: (seedsPerPlot + seedsEarned) × seedPrice  coins  (principal back + profit)
  //   • NET PROFIT:  seedsEarned × seedPrice  coins  (always positive as long as earnRate > 0)
  //
  // seedsEarned = seedsPerPlot × (earnRateBps / 10_000)
  //   e.g. 100 seeds × 5% = 5 extra seeds earned per harvest
  //
  const cycleSec      = stageSec != null ? 4 * stageSec : null
  const cyclesPerDay  = cycleSec != null && cycleSec > 0 ? Math.floor(86_400 / cycleSec) : null

  const seedsEarned      = (seedsPerPlt != null && earnBps != null)
    ? seedsPerPlt * (earnBps / 10_000) : null

  const earnRatePct      = earnBps != null ? (earnBps / 100).toFixed(2) : null

  // Coins you invest when planting
  const plantCost        = (seedsPerPlt != null && seedPrice != null)
    ? seedsPerPlt * seedPrice : null

  // Coins you receive on harvest (principal returned + earned profit)
  const harvestReturn    = (seedsPerPlt != null && seedsEarned != null && seedPrice != null)
    ? (seedsPerPlt + seedsEarned) * seedPrice : null

  // Net profit per plot per cycle = earned seeds × price (principal is returned, not lost)
  const netPerCycle      = (seedsEarned != null && seedPrice != null)
    ? seedsEarned * seedPrice : null

  // 9 plots × cyclesPerDay
  const dailyNet9Plots   = (netPerCycle != null && cyclesPerDay != null)
    ? netPerCycle * 9 * cyclesPerDay : null

  const usdNet           = (dailyNet9Plots != null && fbmxUsd != null)
    ? dailyNet9Plots * fbmxUsd : null

  const fmt  = (v, d = 4) => v != null ? v.toFixed(d) : '—'
  const fmtC = (v, plus = true) =>
    v != null ? `${plus && v >= 0 ? '+' : ''}${v.toFixed(4)} 🪙` : '—'

  const rows = [
    {
      metric: 'Cycle time',
      sub: '4 stages × stage duration',
      perPlot: stageSec != null ? `${(stageSec/3600).toFixed(0)}h / stage` : '—',
      nine:    stageSec != null ? `${(stageSec/3600).toFixed(0)}h / stage` : '—',
      day:     cycleSec != null ? `${(cycleSec/3600).toFixed(0)}h full cycle` : '—',
    },
    {
      metric: 'Cycles per day',
      sub: '24h ÷ cycle time',
      perPlot: cyclesPerDay ?? '—',
      nine:    cyclesPerDay != null ? `${cyclesPerDay} × 9` : '—',
      day:     cyclesPerDay != null ? `${cyclesPerDay * 9} total` : '—',
    },
    {
      metric: 'Earn rate',
      sub: 'earnRateBps from contract',
      perPlot: earnRatePct != null ? `${earnRatePct}%` : '—',
      nine:    earnRatePct != null ? `${earnRatePct}%` : '—',
      day:     earnRatePct != null ? `${earnRatePct}% / cycle` : '—',
    },
    {
      metric: 'Seeds earned (profit)',
      sub: 'seedsPerPlot × earnRate',
      perPlot: seedsEarned != null ? `+${seedsEarned.toFixed(2)} seeds` : '—',
      nine:    seedsEarned != null ? `+${(seedsEarned * 9).toFixed(2)} seeds` : '—',
      day:     seedsEarned != null && cyclesPerDay != null
        ? `+${(seedsEarned * 9 * cyclesPerDay).toFixed(2)} seeds` : '—',
    },
    {
      metric: '① Plant cost',
      sub: 'coins you spend to plant',
      perPlot: plantCost != null ? `${fmt(plantCost)} 🪙` : '—',
      nine:    plantCost != null ? `${fmt(plantCost * 9)} 🪙` : '—',
      day:     plantCost != null && cyclesPerDay != null
        ? `${fmt(plantCost * 9 * cyclesPerDay)} 🪙` : '—',
    },
    {
      metric: '② Harvest return',
      sub: 'principal back + earned profit',
      perPlot: harvestReturn != null ? `${fmt(harvestReturn)} 🪙` : '—',
      nine:    harvestReturn != null ? `${fmt(harvestReturn * 9)} 🪙` : '—',
      day:     harvestReturn != null && cyclesPerDay != null
        ? `${fmt(harvestReturn * 9 * cyclesPerDay)} 🪙` : '—',
    },
    {
      metric: '③ Net profit  (②−①)',
      sub: 'earned seeds × seed price',
      perPlot: fmtC(netPerCycle),
      nine:    netPerCycle != null ? fmtC(netPerCycle * 9) : '—',
      day:     dailyNet9Plots != null ? fmtC(dailyNet9Plots) : '—',
      highlight: true,
      positive: netPerCycle != null && netPerCycle >= 0,
    },
    {
      metric: 'Daily profit in USD',
      sub: 'net profit × FBMX price',
      perPlot: usdNet != null ? `$${(usdNet/9).toFixed(4)}` : '—',
      nine:    usdNet != null ? `$${usdNet.toFixed(4)}` : '—',
      day:     usdNet != null ? `$${usdNet.toFixed(4)}` : '—',
      highlight: true,
      positive: usdNet != null && usdNet >= 0,
    },
  ]

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${S.border}` }}
    >
      {/* Live price bar */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-wrap gap-2"
        style={{ background: S.soilMid, borderBottom: `1px solid ${S.border}` }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(126,220,119,0.15)', color: S.moss, border: `1px solid ${S.moss}` }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ background: S.moss, animation: 'pulse 2s infinite' }}
            />
            Live On-Chain Data
          </span>
          {fbmxUsd && (
            <span className="text-xs font-bold" style={{ color: S.gold }}>
              FBMX = ${fbmxUsd.toFixed(4)}
            </span>
          )}
          {vwap && (
            <span className="text-xs" style={{ color: S.muted }}>
              VWAP: {fmt(vwap)} FBMX/seed
            </span>
          )}
          {livePrice && (
            <span className="text-xs" style={{ color: S.muted }}>
              Shop: {fmt(livePrice)} FBMX/seed
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lastFetched && (
            <span className="text-[10px]" style={{ color: S.muted }}>
              Price at {lastFetched.toLocaleTimeString()}
            </span>
          )}
          {fetchErr && (
            <span className="text-[10px] text-red-400">{fetchErr}</span>
          )}
          <button
            onClick={fetchPrice}
            disabled={fetching}
            className="text-xs px-2.5 py-1 rounded-full font-semibold transition-all disabled:opacity-40 hover:opacity-80"
            style={{ background: S.card, border: `1px solid ${S.border}`, color: S.muted }}
          >
            {fetching ? '⏳' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {/* Table header */}
      <div
        className="grid grid-cols-4 text-xs font-black uppercase tracking-wider px-4 py-3"
        style={{ background: S.soilMid, color: S.goldMid }}
      >
        <span>Metric</span>
        <span className="text-center">Per Plot</span>
        <span className="text-center">9 Plots</span>
        <span className="text-right">Daily (24h)</span>
      </div>

      {/* Table rows */}
      {rows.map((row, i) => (
        <div
          key={row.metric}
          className="grid grid-cols-4 px-4 py-3 text-xs sm:text-sm"
          style={{
            background: row.highlight
              ? row.positive ? 'rgba(126,220,119,0.08)' : 'rgba(239,68,68,0.08)'
              : i % 2 === 0 ? S.card : 'rgba(24,74,54,0.4)',
            borderTop: `1px solid ${S.border}`,
            color: S.parchment,
          }}
        >
          <span className="font-semibold text-xs" style={{ color: S.muted }}>{row.metric}</span>
          <span className="text-center">{row.perPlot}</span>
          <span className="text-center">{row.nine}</span>
          <span
            className="text-right font-bold"
            style={{
              color: row.highlight
                ? row.positive ? S.moss : '#f87171'
                : S.parchment,
            }}
          >
            {row.day}
          </span>
        </div>
      ))}

      <p className="text-[10px] px-4 py-3" style={{ color: S.muted, borderTop: `1px solid ${S.border}` }}>
        * Revenue uses live bonding-curve seed price from on-chain. USD value uses DexScreener FBMX/USDT pool price.
        Excludes gas fees. Actual returns depend on market conditions and harvest timing.
      </p>
    </div>
  )
}

// ── FAQ accordion ─────────────────────────────────────────────────
function AccordionItem({ q, a }) {
  return (
    <details className="rounded-xl overflow-hidden group" style={{ background: S.card, border: `1px solid ${S.border}` }}>
      <summary
        className="flex items-center justify-between px-5 py-4 cursor-pointer select-none list-none font-semibold text-sm"
        style={{ color: S.parchment }}
      >
        <span>{q}</span>
        <span
          className="ml-3 shrink-0 text-base transition-transform group-open:rotate-45"
          style={{ color: S.goldMid }}
        >+</span>
      </summary>
      <div className="px-5 pb-4 text-sm leading-relaxed" style={{ color: S.muted, borderTop: `1px solid ${S.border}` }}>
        <p className="pt-3">{a}</p>
      </div>
    </details>
  )
}

// ── Main export ───────────────────────────────────────────────────
export function AboutGame({ onPlay }) {
  return (
    <div style={{ background: S.bg, color: S.parchment }} className="overflow-x-hidden">

      {/* ── Header ── */}
      <section
        className="py-16 sm:py-20 px-4 text-center"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(47,143,99,0.3) 0%, transparent 65%), var(--forest-dark)`,
        }}
      >
        <div className="max-w-3xl mx-auto">
          <p className="text-xs uppercase tracking-widest mb-3 font-semibold" style={{ color: S.goldMid }}>Game Guide</p>
          <h1 className="text-3xl sm:text-5xl font-black mb-4 leading-tight" style={{ color: S.gold }}>
            Master the Farm
          </h1>
          <p className="text-sm sm:text-base leading-relaxed" style={{ color: S.muted }}>
            Everything you need to know about the 6-hour evolution cycle, game mechanics,
            and the strategies that separate top earners from casual farmers.
          </p>
        </div>
      </section>

      {/* ── Stages ── */}
      <section className="py-16 sm:py-20 px-4" style={{ background: S.bgAlt }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-3" style={{ color: S.gold }}>
            5 Stages · 6 Hours Each · 1 Full Day
          </h2>
          <p className="text-center text-sm mb-10" style={{ color: S.muted }}>
            Every stage takes exactly 6 hours on-chain. Plant in the morning — harvest the next morning.
          </p>

          <div className="flex flex-col gap-4">
            {stages.map((s, i) => (
              <div
                key={s.stage}
                className="flex flex-col sm:flex-row gap-4 rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:scale-[1.01]"
                style={{ background: S.card, border: `1px solid ${S.border}` }}
              >
                <div className="flex sm:flex-col items-center sm:items-center gap-3 sm:gap-1 shrink-0 sm:w-20">
                  <div className="text-4xl sm:text-5xl">{s.emoji}</div>
                  <div
                    className="text-xs font-black px-2 py-0.5 rounded-full"
                    style={{ background: `${s.color}25`, color: s.color, border: `1px solid ${s.color}60` }}
                  >
                    Stage {s.stage}
                  </div>
                  <div className="text-xs font-bold hidden sm:block text-center" style={{ color: S.goldMid }}>
                    {s.time}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-black text-lg" style={{ color: S.parchment }}>{s.name}</h3>
                    <span className="text-xs font-semibold sm:hidden" style={{ color: S.goldMid }}>{s.time}</span>
                  </div>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: S.muted }}>{s.desc}</p>
                  <div
                    className="flex items-start gap-2 text-xs rounded-lg px-3 py-2"
                    style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.2)' }}
                  >
                    <span className="shrink-0">💡</span>
                    <span style={{ color: 'var(--gold-pale)' }}>{s.tip}</span>
                  </div>
                </div>

                {i < stages.length - 1 && (
                  <div className="hidden sm:flex items-center shrink-0" style={{ color: S.bark }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mechanics ── */}
      <section className="py-16 sm:py-20 px-4" style={{ background: S.bg }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-10" style={{ color: S.gold }}>
            How the Game Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mechanics.map(m => (
              <div key={m.title} className="rounded-xl p-6" style={{ background: S.card, border: `1px solid ${S.border}` }}>
                <div className="text-3xl mb-3">{m.icon}</div>
                <h3 className="font-black text-base mb-3" style={{ color: S.gold }}>{m.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: S.muted }}>{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Calculator ── */}
      <section className="py-16 sm:py-20 px-4" style={{ background: S.bgAlt }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-3" style={{ color: S.gold }}>
            The Numbers Behind the Farm
          </h2>
          <p className="text-center text-sm mb-8" style={{ color: S.muted }}>
            Real-time data pulled directly from the contract and the FBMX/USDT on-chain price feed.
            One full 24-hour cycle per row.
          </p>
          <LiveCalculator />
        </div>
      </section>

      {/* ── Strategies ── */}
      <section className="py-16 sm:py-20 px-4" style={{ background: S.bg }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-3" style={{ color: S.gold }}>
            Farming Strategies
          </h2>
          <p className="text-center text-sm mb-10" style={{ color: S.muted }}>
            From first-time farmers to market veterans — pick your playstyle.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {strategies.map(s => (
              <div
                key={s.level}
                className="rounded-2xl p-6 flex flex-col"
                style={{ background: s.bg, border: `1px solid ${s.border}` }}
              >
                <div
                  className="inline-block text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 self-start"
                  style={{ background: `${s.color}20`, color: s.color, border: `1px solid ${s.color}50` }}
                >
                  {s.level}
                </div>
                <ol className="flex flex-col gap-2.5 flex-1">
                  {s.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <span
                        className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black mt-0.5"
                        style={{ background: `${s.color}25`, color: s.color }}
                      >
                        {i + 1}
                      </span>
                      <span style={{ color: S.parchment }}>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 sm:py-20 px-4" style={{ background: S.bgAlt }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-10" style={{ color: S.gold }}>
            Frequently Asked Questions
          </h2>
          <div className="flex flex-col gap-3">
            {faqs.map(f => <AccordionItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 sm:py-20 px-4 text-center" style={{ background: S.bg }}>
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black mb-4" style={{ color: S.gold }}>
            Ready to Put Your Knowledge to Work?
          </h2>
          <p className="text-sm mb-8" style={{ color: S.muted }}>
            Theory is nice — harvests are better. Connect your wallet and start your first cycle.
          </p>
          <button
            onClick={onPlay}
            className="px-10 py-4 rounded-full font-bold text-base transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, var(--gold-mid) 0%, var(--gold-bright) 100%)',
              color: '#1a110a',
              boxShadow: '0 4px 24px rgba(212,160,23,0.35)',
            }}
          >
            🌱 Start Farming
          </button>
        </div>
      </section>
    </div>
  )
}
