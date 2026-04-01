/**
 * PlantSprite — renders one frame of a crop's horizontal sprite sheet.
 *
 * Sprite sheet format: 1200×200px, 6 frames side by side (200×200 each)
 *   Frame: [0:Seed][1:Sprout][2:Growing][3:Mature][4:Harvest][5:Withered]
 *
 * spriteUrl defaults to /crops/crop01.png (Wheat fallback)
 *
 * cover=true  → fills 100% of positioned parent (plot background)
 * cover=false → fixed `size`px square (legend / modal thumbnails)
 */

const FRAMES   = 6
const FRAME_PX = 200   // px per frame in source sheet (200×200)
const DEFAULT_SPRITE = '/crops/crop01.png'

export function PlantSprite({ stage = 0, spriteUrl, size = 64, cover = false, className = '' }) {
  const s   = Math.min(Math.max(Math.floor(stage), 0), FRAMES - 1)
  const url = spriteUrl || DEFAULT_SPRITE

  // background-size: width=FRAMES×100% keeps each frame exactly 100% of the container
  // background-position-x: stage / (FRAMES-1) × 100% selects the correct column
  const xPct = (s / (FRAMES - 1)) * 100

  if (cover) {
    return (
      <div
        className={`absolute inset-0 ${className}`}
        style={{
          backgroundImage:    `url(${url})`,
          backgroundSize:     `${FRAMES * 100}% 100%`,
          backgroundPosition: `${xPct}% 0%`,
          backgroundRepeat:   'no-repeat',
        }}
        aria-label={`Plant stage ${s}`}
      />
    )
  }

  // Fixed-size thumbnail — scale the sheet so one frame = size×size
  const sheetW = FRAME_PX * FRAMES * (size / FRAME_PX)  // = size * FRAMES
  const offsetX = -(s * size)

  return (
    <div
      className={`shrink-0 ${className}`}
      style={{
        width:              size,
        height:             size,
        backgroundImage:    `url(${url})`,
        backgroundSize:     `${sheetW}px ${size}px`,
        backgroundPosition: `${offsetX}px 0px`,
        backgroundRepeat:   'no-repeat',
      }}
      aria-label={`Plant stage ${s}`}
    />
  )
}
