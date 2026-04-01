/**
 * plants.js — pure, stateless stage calculations.
 * All functions take a plot object and return a value.
 * Designed to mirror future smart contract view functions.
 *
 * Stage model (6 visual states):
 *   0 🫘 Seed       — just planted
 *   1 🌱 Sprout     — stage 1 complete
 *   2 🪴 Growing    — stage 2 complete
 *   3 🌾 Mature     — stage 3 complete
 *   4 🚜 Harvest ✅  — window OPEN, harvest now → +1% (101 seeds)
 *   5 🍂 Withered ⚠️ — window CLOSED, harvest late → -1% (99 seeds)
 */

export const STAGE_DURATION     = 1 * 60 * 1000  // 1 min per stage (adjust for prod)
export const HARVEST_STAGE      = 4               // stage at which harvest window opens
export const WITHERED_STAGE     = 5               // stage at which penalty applies (grain shatters)
export const MAX_STAGE          = 5               // visual cap (capped at withered)
export const MAX_SEEDS_PER_PLOT = 100
export const EARN_RATE          = 0.01            // 1% of seedCount (gain on time, lose if late)

const STAGE_EMOJIS = ['🫘', '🌱', '🪴', '🌾', '🚜', '🍂']
const STAGE_LABELS = ['Seed', 'Sprout', 'Growing', 'Mature', 'Harvest Window', 'Withered']

/** Elapsed stages, capped at MAX_STAGE. Maps to: contract `getStage(player, plotIndex)` */
export function getStage(plot) {
  const elapsed   = Date.now() - plot.plantedAt
  const duration  = plot.stageDuration ?? STAGE_DURATION
  return Math.min(Math.floor(elapsed / duration), MAX_STAGE)
}

/**
 * Harvest window is open once stage 4 begins.
 * Maps to: contract `isHarvestReady(player, plotIndex) → bool`
 */
export function isHarvestReady(plot) {
  return getStage(plot) >= HARVEST_STAGE
}

/**
 * Past the harvest window — penalty applies.
 * Mirrors contract _isHarvestLate: elapsed >= WITHERED_STAGE * stageDuration + harvestGracePeriod
 * Grace period absorbs tx mining delay so on-time clicks aren't penalised by block confirmation lag.
 */
export function isHarvestLate(plot) {
  const duration    = plot.stageDuration      ?? STAGE_DURATION
  const grace       = plot.harvestGracePeriod ?? 30_000        // default 30s
  const elapsed     = Date.now() - plot.plantedAt
  return elapsed >= WITHERED_STAGE * duration + grace
}

/**
 * Expected seed delta on harvest.
 * Uses plot.profit (locked in by the contract at plant time) when available.
 * Falls back to EARN_RATE estimate only for plots without on-chain data.
 *
 *   On time: +plot.profit  (e.g. +3 for 100 seeds at 3% earnRateBps)
 *   Late:    -plot.profit
 */
export function getHarvestDelta(plot) {
  const delta = plot.profit != null
    ? Number(plot.profit)                           // from contract — locked at planting
    : Math.floor(plot.seedCount * EARN_RATE)        // fallback estimate
  return isHarvestLate(plot) ? -delta : delta
}

/** Total seeds returned on harvest (principal ± delta). */
export function getHarvestTotal(plot) {
  return plot.seedCount + getHarvestDelta(plot)
}

/**
 * Progress 0–1 within the current stage.
 * Stage 4: fills toward withered deadline (urgency indicator).
 * Stage 5: clamped at 1 (fully withered).
 */
export function getProgress(plot) {
  const elapsed      = Date.now() - plot.plantedAt
  const duration     = plot.stageDuration ?? STAGE_DURATION
  const stage        = getStage(plot)
  const stageElapsed = elapsed - stage * duration
  return Math.min(stageElapsed / duration, 1)
}

/**
 * Milliseconds until current stage ends.
 * Stage 4: countdown to withered (the deadline).
 * Stage 5: 0 (already withered).
 */
export function getTimeToNext(plot) {
  const duration = plot.stageDuration ?? STAGE_DURATION
  const stage    = getStage(plot)
  if (stage >= MAX_STAGE) return 0
  const elapsed  = Date.now() - plot.plantedAt
  return Math.max(0, (stage + 1) * duration - elapsed)
}

export function getStageEmoji(plot) {
  return STAGE_EMOJIS[getStage(plot)]
}

export function getStageLabel(plot) {
  return STAGE_LABELS[getStage(plot)]
}

export function formatMs(ms) {
  const totalSec = Math.ceil(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}
