const KEY = (address) => `farmingEvo_v2_${address.toLowerCase()}`

export function saveState(state) {
  try { localStorage.setItem(KEY(state.address), JSON.stringify(state)) }
  catch (e) { console.warn('Save failed:', e) }
}

export function loadState(address) {
  try {
    const raw = localStorage.getItem(KEY(address))
    return raw ? JSON.parse(raw) : null
  } catch (e) { return null }
}

export function clearState(address) {
  localStorage.removeItem(KEY(address))
}
