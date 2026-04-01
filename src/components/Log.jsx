export function Log({ entries }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-col max-h-48">
      <h2 className="text-sm font-bold text-green-400 uppercase tracking-widest mb-2">Log</h2>
      <ul className="overflow-y-auto space-y-1 flex-1">
        {entries.length === 0 && (
          <li className="text-xs text-gray-600">No activity yet.</li>
        )}
        {entries.map(entry => (
          <li
            key={entry.id}
            className={`text-xs px-2 py-1 rounded bg-gray-700/60 fade-in ${
              entry.type === 'good' ? 'text-green-400'
              : entry.type === 'bad'  ? 'text-red-400'
              : entry.type === 'gold' ? 'text-amber-400'
              : 'text-gray-400'
            }`}
          >
            {entry.msg}
          </li>
        ))}
      </ul>
    </div>
  )
}
