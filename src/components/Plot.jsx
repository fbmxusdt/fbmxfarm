import {
  getStage, getStageLabel,
  getHarvestDelta, getHarvestTotal,
  getProgress, getTimeToNext,
  isHarvestReady, isHarvestLate,
  HARVEST_STAGE, formatMs,
} from '../lib/plants.js'
import { PlantSprite } from './PlantSprite.jsx'

export function Plot({ plot, index, onPlant, onHarvest, walletConnected, crops }) {
  if (!plot) return <EmptyPlot index={index} onPlant={onPlant} walletConnected={walletConnected} />
  const spriteUrl = crops?.find(c => c.id === plot.cropId)?.spriteUrl
  return <PlantedPlot plot={plot} index={index} onHarvest={onHarvest} spriteUrl={spriteUrl} />
}

function EmptyPlot({ index, onPlant, walletConnected }) {
  return (
    <div
      onClick={() => walletConnected && onPlant(index)}
      className={`
        relative flex flex-col items-center justify-center gap-2
        aspect-square min-h-28 rounded-xl border-2 border-dashed border-gray-700
        bg-gray-800/50 overflow-hidden transition-all
        ${walletConnected ? 'cursor-pointer hover:border-green-600 hover:bg-green-900/10' : 'opacity-50 cursor-not-allowed'}
      `}
    >
      <span className="text-3xl opacity-40">⛏️</span>
      <span className="text-xs text-gray-500">
        {walletConnected ? 'Click to plant' : 'Connect wallet'}
      </span>
    </div>
  )
}

function PlantedPlot({ plot, index, onHarvest, spriteUrl }) {
  const stage    = getStage(plot)
  // ready: local time (responsive button — harvest window is 1 full stage wide, drift is negligible)
  // late:  chain truth (accurate penalty display — contractLate ?? local fallback while polling)
  const ready    = isHarvestReady(plot)
  const late     = plot.contractLate ?? isHarvestLate(plot)
  const delta    = getHarvestDelta(plot)
  const total    = getHarvestTotal(plot)
  const progress = getProgress(plot)
  const timeLeft = getTimeToNext(plot)
  const label    = getStageLabel(plot)
  const pct      = Math.round(progress * 100)

  // inGrace = last N seconds INSIDE stage 4 (harvest window), before it closes
  // e.g. harvest window = 60s, grace = 30s → warning fires when 30s remain
  const gracePeriodMs = plot.harvestGracePeriod ?? 30_000
  const inGrace       = ready && !late && timeLeft <= gracePeriodMs

  const stageText = late
    ? '🍂 Withered! Penalty applies (−1%)'
    : inGrace
      ? `⚠️ Closing soon! ${formatMs(timeLeft)} left`
      : ready
        ? `✅ Harvest window · ${formatMs(timeLeft)}`
        : `Stage ${stage}/${HARVEST_STAGE} · ${formatMs(timeLeft)}`

  const borderClass = late
    ? 'border-red-500 shadow-[0_0_18px_rgba(239,68,68,0.35)]'
    : inGrace
      ? 'border-orange-400 shadow-[0_0_18px_rgba(251,146,60,0.35)] animate-pulse'
      : ready
        ? 'border-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.35)]'
        : 'border-gray-700 hover:border-green-700'

  const barClass = late ? 'bg-red-500' : inGrace ? 'bg-orange-400' : ready ? 'bg-amber-400' : 'bg-green-500'

  const btnClass = late
    ? 'bg-red-600/90 hover:bg-red-500 text-white cursor-pointer'
    : ready
      ? 'bg-amber-500/90 hover:bg-amber-400 text-gray-900 cursor-pointer'
      : 'bg-black/40 text-gray-500 cursor-not-allowed opacity-60'

  return (
    <div className={`
      relative aspect-square min-h-28 rounded-xl border-2 overflow-hidden transition-all
      ${borderClass}
    `}>
      {/* ── Cover sprite ── */}
      <PlantSprite
        stage={stage}
        spriteUrl={spriteUrl}
        cover
        className={ready ? 'plot-bounce' : ''}
      />

      {/* ── Bottom gradient overlay ── */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

      {/* ── UI layer ── */}
      <div className="absolute inset-0 flex flex-col justify-end p-2 gap-1">

        {/* Stage label + seed count */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-300 font-medium leading-none">{label}</span>
          <span className="text-xs font-bold text-green-300 leading-none">
            {plot.seedCount}
            {ready && (
              <span className={`ml-0.5 ${late ? 'text-red-400' : 'text-amber-300'}`}>
                {delta > 0 ? `+${delta}` : delta}
              </span>
            )}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${barClass}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Timer */}
        <div className={`text-[9px] text-center leading-none ${late ? 'text-red-400' : ready ? 'text-amber-300' : 'text-gray-400'}`}>
          {stageText}
        </div>

        {/* Harvest button */}
        <button
          disabled={!ready}
          onClick={() => onHarvest(index)}
          className={`w-full text-[11px] font-bold py-1 rounded-lg transition-all ${btnClass} ${!ready ?'invisible lg:visible':'' } `}
        >
          {late
            ? `🍂 Withered ${total} (−1%)`
            : inGrace
              ? `⚠️ Hurry! ${total} (+1%)`
              : ready
                ? `🚜 ${total} (+1%)`
                : '🌾 Growing…'}
        </button>
      </div>
    </div>
  )
}
