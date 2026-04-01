CROP SPRITE SHEETS — /public/crops/
=====================================

FORMAT REQUIREMENTS
-------------------
  Layout   : Horizontal strip — 6 frames side by side, left to right
  Frame    : 200 × 200 px each
  Total    : 1200 × 200 px (width × height)
  Format   : PNG (preferred) or WebP
  Bg       : Transparent (PNG-24 with alpha) recommended

FRAME ORDER (left → right)
---------------------------
  [0] Seed       — just planted        🫘
  [1] Sprout     — stage 1 complete    🌱
  [2] Growing    — stage 2 complete    🪴
  [3] Mature     — stage 3 complete    🌾
  [4] Harvest    — window open         🚜
  [5] Withered   — penalty stage       🍂

DEFAULT FILES
-------------
  crop01.png — Millet (🌾  50 seeds, 1%,  10 min/stage · real: 60–90 days)
  crop02.png — Wheat  (🌾 100 seeds, 3%,   1 hr/stage  · real: 100–130 days)
  crop03.png — Corn   (🌽 250 seeds, 8%,   6 hr/stage  · real: 80–125 days)
  crop04.png — Rice   (🍚 500 seeds, 20%, 24 hr/stage  · real: 105–150 days)

  crop01.png–crop04.png are auto-assigned to the 4 default crops.
  Add more files (crop05.png, etc.) and reference them via the Admin Panel
  → Crops section → Sprite URL field.

SETTING A CUSTOM URL
--------------------
  You can host sprites anywhere (CDN, IPFS, etc.).
  Enter the full URL in Admin Panel → Crops → Sprite URL.
  Example: https://cdn.example.com/crops/mythical-plant.webp

TOOLS FOR CREATING SPRITES
---------------------------
  - Aseprite (pixel art, recommended)
  - Photoshop → Export As → PNG, manually arrange 6 frames at 200px each
  - GIMP → Canvas size 1200×200, place each frame at x=0,200,400,600,800,1000
  - Any online sprite sheet packer (TexturePacker, etc.)
