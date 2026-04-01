import { useState } from 'react'

export function PlantModal({ plotIndex, seeds, crops, onConfirm, onClose }) {
  const [selectedCrop, setSelectedCrop] = useState(0)
  if (plotIndex === null) return null

  const activeCrops = crops?.length ? crops.filter(c => c.active) : []
  const crop        = activeCrops[selectedCrop] ?? activeCrops[0]
  const canPlant    = crop != null && seeds >= crop.minSeeds

  function fmtDuration(sec) {
    if (sec >= 86400) return `${(sec / 86400).toFixed(0)}d/stage`
    if (sec >= 3600)  return `${(sec / 3600).toFixed(0)}h/stage`
    if (sec >= 60)    return `${(sec / 60).toFixed(0)}m/stage`
    return `${sec}s/stage`
  }

  function handleConfirm() {
    onConfirm(plotIndex, crop.id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-800 border border-green-700 rounded-2xl p-6 w-96 shadow-2xl flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-bold text-green-400">🌱 Plant Seeds</h3>
          <p className="text-xs text-gray-500">Plot {plotIndex + 1} · {seeds.toLocaleString()} seeds available</p>
        </div>

        {/* Crop selector */}
        {activeCrops.length === 0 ? (
          <div className="text-xs text-amber-400 text-center py-4">No crops available</div>
        ) : (
          <div className="flex flex-col gap-2">
            {activeCrops.map((c, idx) => {
              const affordable   = seeds >= c.minSeeds
              const cycleSec     = c.stageDuration * 4
              const cyclesPerDay = c.cyclesPerDay
              const isSelected   = selectedCrop === idx
              return (
                <button
                  key={c.id}
                  onClick={() => affordable && setSelectedCrop(idx)}
                  disabled={!affordable}
                  className={`
                    w-full text-left rounded-xl border p-3 transition-all
                    ${isSelected
                      ? 'border-green-500 bg-green-900/20'
                      : affordable
                        ? 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                        : 'border-gray-700 bg-gray-800/30 opacity-40 cursor-not-allowed'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{c.name}</span>
                    <span className={`text-xs font-bold ${isSelected ? 'text-green-400' : 'text-gray-400'}`}>
                      +{c.profitPct.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                    <span>🌱 {c.minSeeds} seeds</span>
                    <span>⏱ {fmtDuration(c.stageDuration)}</span>
                    <span>🔄 {cyclesPerDay > 0 ? `${cyclesPerDay}/day` : `${(1 / (cycleSec / 86400)).toFixed(2)}/day`}</span>
                  </div>
                  {!affordable && (
                    <div className="text-[10px] text-red-400 mt-1">Need {c.minSeeds} seeds</div>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Selected crop summary */}
        {crop && (
          <div className="bg-gray-700/40 rounded-xl px-4 py-3 text-xs text-gray-300 flex justify-between">
            <span>Seeds used: <strong className="text-white">{crop.minSeeds}</strong></span>
            <span>Profit: <strong className="text-green-400">+{(crop.minSeeds * crop.profitPct / 100).toFixed(1)} seeds</strong></span>
            <span>Cycle: <strong className="text-amber-400">{fmtDuration(crop.stageDuration * 4)}</strong></span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            disabled={!canPlant}
            onClick={handleConfirm}
            className="flex-1 bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2 rounded-xl transition-colors"
          >
            Plant {crop?.name ?? ''}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold py-2 rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
