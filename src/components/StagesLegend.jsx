import { STAGE_DURATION, HARVEST_STAGE } from '../lib/plants.js'
import { PlantSprite } from './PlantSprite.jsx'

const STAGES = [
  { stage: 0, label: 'Seed',          note: 'just planted',        color: 'text-gray-400' },
  { stage: 1, label: 'Sprout',        note: 'stage 1',             color: 'text-gray-400' },
  { stage: 2, label: 'Growing',       note: 'stage 2',             color: 'text-gray-400' },
  { stage: 3, label: 'Mature',        note: 'stage 3',             color: 'text-gray-400' },
  { stage: 4, label: 'Harvest Time',  note: 'stage 4 · +1% (101)', color: 'text-amber-400' },
  { stage: 5, label: 'Withered',      note: 'stage 5 · −1% (99)',  color: 'text-red-400' },
]

const minPerStage = Math.round(STAGE_DURATION / 60000)

export function StagesLegend() {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
      <h2 className="text-sm font-bold text-green-400 uppercase tracking-widest mb-3">Growth Stages</h2>
      <ul className="space-y-1.5">
        {STAGES.map((s) => (
          <li key={s.stage} className="flex items-center gap-3 text-xs border-b border-gray-700/50 pb-1.5 last:border-0">
            <PlantSprite stage={s.stage} size={32} />
            <span className={`font-medium ${s.color}`}>{s.label}</span>
            <span className="ml-auto text-gray-500">{s.note}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-600 mt-3">
        {minPerStage} min/stage · harvest on stage {HARVEST_STAGE} → +1% · miss it → −1%
      </p>
    </div>
  )
}
