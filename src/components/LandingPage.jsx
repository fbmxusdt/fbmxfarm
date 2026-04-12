const S = {
  // colours
  bg:           'var(--forest-dark)',
  bgAlt:        'var(--soil-dark)',
  card:         'var(--card-bg)',
  border:       'var(--card-border)',
  gold:         'var(--gold-bright)',
  goldMid:      'var(--gold-mid)',
  moss:         'var(--moss)',
  parchment:    'var(--parchment)',
  muted:        'var(--parchment-dim)',
  bark:         'var(--bark)',
  soilMid:      'var(--soil-mid)',
}

const stages = [
  { emoji: '🫘', name: 'Seed',    desc: 'Planted in fertile soil' },
  { emoji: '🌱', name: 'Sprout',  desc: 'First signs of life' },
  { emoji: '🪴', name: 'Growing', desc: 'Reaching for the sun' },
  { emoji: '🌳', name: 'Mature',  desc: 'Full strength achieved' },
  { emoji: '🚜', name: 'Harvest', desc: 'Rewards ready to collect' },
]

const reasons = [
  {
    icon: '⏱️',
    title: 'Play at Your Pace',
    text: 'No frantic clicking or constant attention needed. Plant your seeds, go live your life, come back to a harvest waiting for you.',
  },
  {
    icon: '💰',
    title: 'Real Token Rewards',
    text: 'Every harvest earns you FBMX tokens — real BEP-20 assets you can hold, trade, or reinvest. Your farm, your income.',
  },
  {
    icon: '📈',
    title: 'Compound Your Growth',
    text: 'Reinvest harvests into more seeds, unlock more plots, and watch your earnings compound like a real-world portfolio.',
  },
  {
    icon: '🧠',
    title: 'Strategy Rewarded',
    text: 'Time your harvests, read the market, choose when to sell on the player marketplace — skill amplifies your returns.',
  },
  {
    icon: '🌐',
    title: 'On-Chain Transparency',
    text: 'Every plant, every harvest, every trade — recorded on BSC. No hidden mechanics. No rigged odds. Provably fair.',
  },
  {
    icon: '🤝',
    title: 'Player Marketplace',
    text: 'List your seeds on the shared market. Buy low, sell high. A living economy driven entirely by players.',
  },
]

const testimonials = [
  {
    handle: '@crypto_harvest',
    text: 'Started with 50 FBMX. Three weeks later I\'m running 9 plots and earning passive income every few hours. This game is the idle game done right.',
    earned: '+380 FBMX',
  },
  {
    handle: '@defi_farmer_77',
    text: 'I check it twice a day — once in the morning, once before bed. It\'s become part of my routine. The satisfaction of a full harvest never gets old.',
    earned: '+215 FBMX',
  },
  {
    handle: '@plant_ape',
    text: 'Love that I can actually trade seeds on the marketplace. Bought a bunch when prices were low, planted them all, made a killing. Real DeFi strategy.',
    earned: '+520 FBMX',
  },
]

export function LandingPage({ onPlay, onAbout }) {
  return (
    <div style={{ background: S.bg, color: S.parchment }} className="overflow-x-hidden">

      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden flex flex-col items-center justify-center text-center px-4 py-20 sm:py-28 lg:py-36"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(45,74,34,0.5) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 20% 100%, rgba(61,37,24,0.4) 0%, transparent 60%),
            var(--forest-dark)
          `,
        }}
      >
        {/* Decorative floating leaves */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden>
          {['🍃','🌿','🍀','🌾','🍃','🌱'].map((leaf, i) => (
            <span
              key={i}
              className="absolute text-2xl opacity-10"
              style={{
                left:  `${10 + i * 15}%`,
                top:   `${10 + (i % 3) * 25}%`,
                animation: `float ${4 + i * 0.7}s ease-in-out infinite`,
                animationDelay: `${i * 0.6}s`,
              }}
            >{leaf}</span>
          ))}
        </div>

        <div className="relative z-5 max-w-4xl mx-auto">
          <img
            src="/logo.png"
            alt="FBMX Farm"
            className="mx-auto mb-1 w-100 h-100 sm:w-150 sm:h-150 lg:w-200 lg:h-200 object-contain float-anim"
          />

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black mb-4 leading-tight tracking-tight gold-shimmer">
            Farming Evolution
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl mb-3 font-medium" style={{ color: S.moss }}>
            The idle farming game that pays you while you sleep.
          </p>

          <p className="text-sm sm:text-base max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: S.muted }}>
            Plant seeds on the blockchain, watch them evolve through 5 stages, harvest real FBMX tokens,
            and trade on a living player marketplace. No energy bars. No pay-to-win. Just pure, rewarding farming.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={onPlay}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full font-bold text-base transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, var(--gold-mid) 0%, var(--gold-bright) 100%)',
                color: '#1a110a',
                boxShadow: '0 4px 24px rgba(212,160,23,0.35)',
              }}
            >
              🌱 Start Farming Now
            </button>
            <button
              onClick={onAbout}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full font-semibold text-base transition-all duration-200 hover:scale-105"
              style={{
                background: 'transparent',
                border: '1.5px solid var(--gold-mid)',
                color: 'var(--gold-bright)',
              }}
            >
              Learn How It Works ↓
            </button>
          </div>

          {/* Mini stats */}
          <div className="flex flex-wrap justify-center gap-6 mt-12">
            {[
              { value: '6 hrs', label: 'Per Evolution Stage' },
              { value: '5 Stages', label: 'Seed → Harvest' },
              { value: '24 hrs', label: 'Full Cycle' },
              { value: 'BSC', label: 'BEP-20 On-Chain' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-xl sm:text-2xl font-black" style={{ color: S.gold }}>{stat.value}</div>
                <div className="text-xs mt-0.5" style={{ color: S.muted }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stage Preview Strip ── */}
      <section
        className="py-10 px-4"
        style={{ background: 'linear-gradient(90deg, var(--soil-dark) 0%, var(--forest-mid) 50%, var(--soil-dark) 100%)' }}
      >
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs uppercase tracking-widest mb-6" style={{ color: S.muted }}>
            Evolution Path
          </p>
          <div className="flex items-center justify-center gap-0 flex-wrap sm:flex-nowrap">
            {stages.map((s, i) => (
              <div key={s.name} className="flex items-center">
                <div className="flex flex-col items-center text-center px-3 py-2">
                  <div className="text-3xl sm:text-4xl mb-1">{s.emoji}</div>
                  <div className="text-xs font-bold" style={{ color: S.gold }}>{s.name}</div>
                  <div className="text-[10px] hidden sm:block mt-0.5 max-w-16" style={{ color: S.muted }}>{s.desc}</div>
                </div>
                {i < stages.length - 1 && (
                  <div className="text-base px-1 shrink-0" style={{ color: S.bark }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Story Section ── */}
      <section className="py-16 sm:py-24 px-4" style={{ background: S.bg }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4" style={{ color: S.gold }}>
              Why Farmers Can't Stop Playing
            </h2>
            <p className="max-w-2xl mx-auto text-sm sm:text-base leading-relaxed" style={{ color: S.muted }}>
              There's something deeply satisfying about planting a seed and watching it grow —
              even more so when it turns into real income.
            </p>
          </div>

          {/* Story narrative */}
          <div
            className="rounded-2xl p-6 sm:p-10 mb-12 relative overflow-hidden"
            style={{ background: S.soilMid, border: `1px solid ${S.bark}` }}
          >
            <div className="text-4xl mb-4">📖</div>
            <blockquote className="text-base sm:text-lg leading-relaxed italic max-w-3xl" style={{ color: S.parchment }}>
              "It started as curiosity — just to see what all the fuss was about. I deposited 20 FBMX,
              bought some seeds, and planted my first 3 plots before bed. Each stage takes 6 hours, so
              by the next morning my plots were already halfway through. I harvested my first crop the
              following evening.
              <br /><br />
              That was six weeks ago. Now I check in twice a day — morning and evening — time my harvests,
              and replant immediately. I've grown my portfolio from 20 FBMX to over 400 — and I still get
              that same little rush every time I click Harvest."
            </blockquote>
            <footer className="mt-4 text-sm font-bold" style={{ color: S.goldMid }}>
              — A typical Farming Evolution story
            </footer>
          </div>

          {/* Reasons grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reasons.map(r => (
              <div
                key={r.title}
                className="rounded-xl p-5 transition-all duration-200 hover:scale-[1.02]"
                style={{ background: S.card, border: `1px solid ${S.border}` }}
              >
                <div className="text-2xl mb-3">{r.icon}</div>
                <h3 className="font-bold text-base mb-2" style={{ color: S.gold }}>{r.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: S.muted }}>{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-16 sm:py-24 px-4" style={{ background: S.bgAlt }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-12" style={{ color: S.gold }}>
            From Zero to Harvest in 4 Steps
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: '01', icon: '🔗', title: 'Connect Wallet', text: 'Link your Web3 wallet. Deposit FBMX tokens to get your starting coins.' },
              { step: '02', icon: '🛒', title: 'Buy Seeds', text: 'Visit the shop. 1 coin gets you 10 seeds. Stock up before you plant.' },
              { step: '03', icon: '🌱', title: 'Plant & Wait', text: 'Click any empty plot to plant. Each stage evolves every 6 hours — one full cycle per day.' },
              { step: '04', icon: '💰', title: 'Harvest & Earn', text: 'At stage 4 your plant is ready. Harvest for coins, convert back to FBMX.' },
            ].map(s => (
              <div
                key={s.step}
                className="rounded-xl p-5 flex flex-col"
                style={{ background: S.card, border: `1px solid ${S.border}` }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-xs font-black px-2 py-1 rounded-full shrink-0" style={{ background: S.soilMid, color: S.goldMid }}>
                    {s.step}
                  </span>
                  <span className="text-2xl">{s.icon}</span>
                </div>
                <h3 className="font-bold text-sm mb-2" style={{ color: S.parchment }}>{s.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: S.muted }}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-16 sm:py-24 px-4" style={{ background: S.bg }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-12" style={{ color: S.gold }}>
            Farmers Are Earning Right Now
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map(t => (
              <div
                key={t.handle}
                className="rounded-xl p-5 flex flex-col gap-3"
                style={{ background: S.card, border: `1px solid ${S.border}` }}
              >
                <p className="text-sm leading-relaxed italic flex-1" style={{ color: S.parchment }}>
                  "{t.text}"
                </p>
                <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${S.border}` }}>
                  <span className="text-xs font-bold" style={{ color: S.moss }}>{t.handle}</span>
                  <span
                    className="text-xs font-black px-2 py-1 rounded-full"
                    style={{ background: 'rgba(106,172,82,0.15)', color: S.moss, border: `1px solid ${S.moss}` }}
                  >
                    {t.earned}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section
        className="py-20 sm:py-28 px-4 text-center"
        style={{
          background: `
            radial-gradient(ellipse 70% 80% at 50% 100%, rgba(61,37,24,0.6) 0%, transparent 70%),
            var(--forest-dark)
          `,
        }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="text-6xl mb-6">🚜</div>
          <h2 className="text-3xl sm:text-4xl font-black mb-4 leading-tight" style={{ color: S.gold }}>
            Your Farm is Waiting
          </h2>
          <p className="text-sm sm:text-base mb-8 leading-relaxed" style={{ color: S.muted }}>
            Every minute you're not farming is a minute your coins aren't growing.
            Connect your wallet now and plant your first seed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={onPlay}
              className="w-full sm:w-auto px-10 py-4 rounded-full font-bold text-lg transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, var(--gold-mid) 0%, var(--gold-bright) 100%)',
                color: '#1a110a',
                boxShadow: '0 4px 32px rgba(212,160,23,0.4)',
              }}
            >
              🌾 Launch the Farm
            </button>
          </div>
          <p className="text-xs mt-4" style={{ color: S.muted }}>
            Requires MetaMask or compatible Web3 wallet · BSC Network
          </p>
        </div>
      </section>

    </div>
  )
}
