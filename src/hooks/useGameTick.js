import { useState, useEffect } from 'react'

/** Forces a re-render every `ms` milliseconds to keep progress bars live. */
export function useGameTick(ms = 2000) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), ms)
    return () => clearInterval(id)
  }, [ms])
}
