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

PROMPT FOR AI IMAGE GENERATOR
---------------------------
Create a high-quality HD 2D game sprite sheet showing the full lifecycle of ONE crop plant.

SUBJECT:
Choose ONLY ONE: Millet OR Wheat OR Corn OR Rice
(Do not mix multiple crops in one image)
(The result must be not similar from the previous crops since they are almost alike)

CANVAS & LAYOUT (STRICT):
- Exact canvas size: 1200x200 pixels (no scaling, no cropping)
- Horizontal strip with EXACTLY 6 equal frames (left to right)
- Each frame: EXACTLY 200x200 pixels
- Perfect grid alignment (6 columns, 1 row)
- Each plant centered inside its frame
- All plants rooted at the same baseline (consistent ground level)
- Maintain consistent scale and camera angle across all frames
- Keep plant width within ~70–80% of each 200x200 frame for safe padding

GROWTH STAGES (LEFT → RIGHT):
[0] Seed — small seed resting on a small soil patch  
[1] Sprout — tiny green shoot emerging from soil  
[2] Growing — young plant with a few leaves  
[3] Mature — fully grown green plant, early grains/buds visible  
[4] Harvest-ready — full, rich crop with slightly golden tones  
[5] Withered — dry, brown, wilted plant  

STYLE & RENDERING:
- Clean HD 2D game art (farming sim style, mobile/PC game ready)
- Stylized realism (photorealistic, NOT painterly)
- Sharp edges, clean silhouettes, readable at small size
- Consistent lighting across all frames (top-down soft light)
- Natural color progression: green → yellow → brown
- No motion blur, no depth of field, no glow effects

BACKGROUND (CRITICAL):
- White background
- NO checkerboard pattern, NO gradient, NO sky, solid white background color
- Only include a small centered soil base under each plant
- No shadows extending outside each frame

OUTPUT:
- PNG format
- Clean edges (no white halo / artifacts)
- Ready for WebP conversion
- No text, no labels, no watermark, no UI elements

QUALITY CONTROL:
- Each stage must be visually distinct and clearly progressive
- No overlapping between frames
- No extra padding outside 1200x200 canvas
- Keep proportions consistent across all stages

