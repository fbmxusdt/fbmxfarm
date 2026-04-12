import { useState, useEffect }   from 'react'
import { useConnection }         from 'wagmi'
import { useOnChainGame }        from './hooks/useOnChainGame.js'
import { useTokenBalance }       from './hooks/useTokenBalance.js'
import { Header }                from './components/Header.jsx'
import { FarmGrid }              from './components/FarmGrid.jsx'
import { Shop }                  from './components/Shop.jsx'
import { Basket }                from './components/Basket.jsx'
import { Marketplace }           from './components/Marketplace.jsx'
import { StagesLegend }          from './components/StagesLegend.jsx'
import { Log }                   from './components/Log.jsx'
import { PlantModal }            from './components/PlantModal.jsx'
import { SwapModal }             from './components/SwapModal.jsx'
import { WalletButton }          from './components/WalletButton.jsx'
import { AdminPage }             from './components/AdminPage.jsx'
import { LeaderboardPage }       from './components/LeaderboardPage.jsx'
import { ProfitabilityWidget }   from './components/ProfitabilityWidget.jsx'
import { LandingPage }           from './components/LandingPage.jsx'
import { AboutGame }             from './components/AboutGame.jsx'

export default function App() {
  const { address, isConnected }                                        = useConnection()
  const { state, market, marketStats, crops, totalPlayers, log, actions, pendingAction, supported } = useOnChainGame(address)
  const { formatted: fbmxFormatted, balance: fbmxBalance }              = useTokenBalance(address)
  const [plantingPlot, setPlantingPlot]                                 = useState(null)
  const [showSwap, setShowSwap]                                         = useState(false)
  const [view, setView]                                                 = useState('landing')

  // Auto-navigate: go to game once wallet reconnects, back to landing on disconnect
  useEffect(() => {
    if (isConnected) setView(v => v === 'landing' ? 'game' : v)
    else setView('landing')
  }, [isConnected])

  return (
    <div className="min-h-screen" style={{ background: 'var(--forest-dark)', color: 'var(--parchment)' }}>
      <Header
        pendingAction={pendingAction}
        currentView={view}
        onNavigate={setView}
      />

      {/* ── Views ── */}
      {view === 'landing' && (
        <LandingPage
          onPlay={() => setView('game')}
          onAbout={() => setView('about')}
        />
      )}

      {view === 'about' && (
        <AboutGame onPlay={() => setView('game')} />
      )}

      {view === 'admin' && (
        <AdminPage onBack={() => setView('game')} />
      )}

      {view === 'leaderboard' && (
        <LeaderboardPage onBack={() => setView(address ? 'game' : 'landing')} />
      )}

      {view === 'game' && (
        !isConnected ? (
          <WalletGate onBack={() => setView('landing')} />
        ) : !supported ? (
          <div className="flex items-center justify-center h-64 flex-col gap-2" style={{ color: 'var(--parchment-dim)' }}>
            <span className="text-2xl">⛓️</span>
            <span className="text-sm">Switch to BSC, BSC Testnet, or Hardhat to play.</span>
          </div>
        ) : !state ? (
          <div className="flex items-center justify-center h-64" style={{ color: 'var(--parchment-dim)' }}>
            Loading…
          </div>
        ) : (
          <main className="max-w-7xl mx-auto px-4 xl:px-6 py-6 flex flex-col gap-5">

            {/* ── Player stats bar — always full width ── */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowSwap(true)}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-90"
                style={{ background: 'var(--soil-mid)', border: '1px solid var(--bark)', color: 'var(--gold-bright)' }}
                title="Swap FBMX ↔ Coins"
              >
                <span style={{ color: 'var(--gold-mid)' }}>FBMX</span>
                <span className="font-bold">{fbmxFormatted}</span>
                <span style={{ color: 'var(--gold-mid)' }}>⇄</span>
              </button>
              <div className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs"
                style={{ background: 'var(--soil-mid)', border: '1px solid var(--bark)' }}>
                <span>💰</span>
                <span className="font-bold" style={{ color: 'var(--gold-bright)' }}>
                  {parseFloat(state.coins).toFixed(1)}
                  <span className="ml-1 font-normal" style={{ color: 'var(--parchment-dim)' }}>coins</span>
                </span>
              </div>
              <div className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs"
                style={{ background: 'var(--soil-mid)', border: '1px solid var(--bark)' }}>
                <span>🌱</span>
                <span className="font-bold" style={{ color: 'var(--moss)' }}>
                  {state.seeds.toLocaleString()}
                  <span className="ml-1 font-normal" style={{ color: 'var(--parchment-dim)' }}>seeds</span>
                </span>
              </div>
              {totalPlayers != null && (
                <div className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs"
                  style={{ background: 'var(--soil-mid)', border: '1px solid var(--bark)' }}>
                  <span>👨‍🌾</span>
                  <span className="font-bold" style={{ color: 'var(--parchment)' }}>
                    {totalPlayers.toLocaleString()}
                    <span className="ml-1 font-normal" style={{ color: 'var(--parchment-dim)' }}>farmers</span>
                  </span>
                </div>
              )}
            </div>

            {/* ── Two-column layout ── */}
            <div className="flex flex-col lg:flex-row gap-5">

              {/* Left: Farm + Marketplace */}
              <section className="flex-1 min-w-0 flex flex-col gap-5">
                <FarmGrid
                  plots={state.plots}
                  crops={crops}
                  onPlant={setPlantingPlot}
                  onHarvest={(i) => actions.harvestPlot(i)}
                  walletConnected={isConnected}
                />
                <ProfitabilityWidget state={state} marketStats={marketStats} crops={crops} />
                <Marketplace
                  market={market}
                  myAddress={address}
                  myCoins={state.coins}
                  onBuy={actions.buyFromMarket}
                />
              </section>

              {/* Right sidebar */}
              <aside className="flex lg:w-72 xl:w-80 2xl:w-96 flex flex-col gap-4 shrink-0">
                <Shop coins={state.coins} marketStats={marketStats} onBuy={actions.buySeed} />
                <Basket
                  seeds={state.seeds}
                  myAddress={address}
                  market={market}
                  marketStats={marketStats}
                  onList={actions.listOnMarket}
                  onCancel={actions.cancelListing}
                />
                <StagesLegend />
                <Log entries={log} />
              </aside>

            </div>
          </main>
        )
      )}

      <PlantModal
        plotIndex={plantingPlot}
        seeds={state?.seeds ?? 0}
        crops={crops}
        onConfirm={actions.plantSeeds}
        onClose={() => setPlantingPlot(null)}
      />

      {showSwap && state && (
        <SwapModal
          coins={state.coins}
          fbmxBalance={fbmxBalance}
          fbmxFormatted={fbmxFormatted}
          address={address}
          onDeposit={actions.depositCoins}
          onWithdraw={actions.withdrawCoins}
          onClose={() => setShowSwap(false)}
        />
      )}

    </div>
  )
}

function WalletGate({ onBack }) {
  const features = [
    { emoji: '🫘', label: 'Plant Seeds' },
    { emoji: '🌳', label: 'Grow & Evolve' },
    { emoji: '🚜', label: 'Harvest' },
    { emoji: '💰', label: 'Earn FBMX' },
    { emoji: '🏪', label: 'Marketplace' },
    { emoji: '🔄', label: 'Compound' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--forest-dark)' }}>

      {/* ── Page header bar — mirrors AdminPage style ── */}
      <div
        className="border-b px-4 py-4"
        style={{ background: 'var(--soil-dark)', borderColor: 'rgba(139,96,64,0.4)' }}
      >
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all hover:scale-105"
            style={{
              background: 'var(--soil-mid)',
              border: '1px solid var(--bark)',
              color: 'var(--parchment-dim)',
            }}
          >
            ← Back
          </button>

          <div className="flex items-center gap-2 ml-1">
            <span className="text-xl">🌾</span>
            <div>
              <h1 className="font-black text-base leading-tight" style={{ color: 'var(--gold-bright)' }}>
                FBMX Farm
              </h1>
              <p className="text-[10px] leading-none mt-0.5" style={{ color: 'var(--parchment-dim)' }}>
                Connect your wallet to start farming
              </p>
            </div>
          </div>

          <span
            className="ml-auto text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
            style={{
              background: 'rgba(212,160,23,0.12)',
              border: '1px solid rgba(212,160,23,0.35)',
              color: 'var(--gold-bright)',
            }}
          >
            BSC · BEP-20
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex flex-col items-center justify-center px-4 py-12 min-h-[calc(100vh-73px)]">
        <div
          className="w-full max-w-md rounded-2xl p-8 flex flex-col items-center gap-6 text-center"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <div className="text-6xl float-anim">🌾</div>

          <div>
            <h2 className="text-2xl font-black mb-2" style={{ color: 'var(--gold-bright)' }}>
              Ready to Farm?
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--parchment-dim)' }}>
              Plant seeds, evolve through 5 stages over 24 hours, then harvest
              and trade. 1 FBMX = 1 coin — your earnings are real on-chain assets.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-3 gap-2.5 w-full">
            {features.map(f => (
              <div
                key={f.label}
                className="flex flex-col items-center gap-1.5 rounded-xl py-3 px-2"
                style={{ background: 'var(--forest-dark)', border: '1px solid var(--card-border)' }}
              >
                <span className="text-2xl">{f.emoji}</span>
                <span className="text-[10px] font-semibold" style={{ color: 'var(--parchment-dim)' }}>
                  {f.label}
                </span>
              </div>
            ))}
          </div>

          <WalletButton />

          <p className="text-[10px]" style={{ color: 'var(--parchment-dim)', opacity: 0.55 }}>
            On-chain · BSC · FBMX BEP-20
          </p>
        </div>
      </div>

    </div>
  )
}
