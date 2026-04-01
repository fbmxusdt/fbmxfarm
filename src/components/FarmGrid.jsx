import { Plot } from './Plot.jsx'
import { useGameTick } from '../hooks/useGameTick.js'

export function FarmGrid({ plots, crops, onPlant, onHarvest, walletConnected }) {
  useGameTick(2000) // re-render every 2s so progress bars stay live

  return (
    <section>
      <div className="grid grid-cols-3 gap-2">
        {plots.map((plot, i) => (
          <Plot
            key={plot?.id ?? `empty-${i}`}
            plot={plot}
            index={i}
            crops={crops}
            onPlant={onPlant}
            onHarvest={onHarvest}
            walletConnected={walletConnected}
          />
        ))}
      </div>
      <p className="text-xs text-gray-600 mt-2 text-center">
        Each plot holds 100 seeds · +1 seed per completed stage (1%)
      </p>
    </section>
  )
}
