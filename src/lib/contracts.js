/**
 * contracts.js — ABIs, addresses, and unit helpers.
 */

import { parseUnits, formatUnits } from 'viem'

// Real BSC FBMX address — also used on localhost after hardhat_setCode in deploy.js
export const FBMX_ADDRESS = '0x5951f937ff590239d38c10e871f9982359e56c36'

export const ERC20_ABI = [
  {
    name: 'balanceOf', type: 'function', stateMutability: 'view',
    inputs:  [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'symbol', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'approve', type: 'function', stateMutability: 'nonpayable',
    inputs:  [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
]

export const FARMING_GAME_ADDRESS = {
  31337: import.meta.env.VITE_FARMING_GAME_ADDRESS_HARDHAT || '0x0165878A594ca255338adfa4d48449f69242Eb8F',
  97:    import.meta.env.VITE_FARMING_GAME_ADDRESS_BSC_TEST || '',
  56:    import.meta.env.VITE_FARMING_GAME_ADDRESS_BSC     || '0x9A9d51edb12aA03abDD1ead955F01eE489617b83',
}

export const FARMING_GAME_ABI = [
  // ── Read: player state ──────────────────────────────────────
  { name: 'players',        type: 'function', stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: 'coins', type: 'uint256' }, { name: 'seeds', type: 'uint256' }] },
  { name: 'plots',          type: 'function', stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }, { name: '', type: 'uint256' }],
    outputs: [
      { name: 'seedCount', type: 'uint256' }, { name: 'plantedAt', type: 'uint256' },
      { name: 'profit',    type: 'uint256' }, { name: 'duration',  type: 'uint256' },
      { name: 'cropId',    type: 'uint8'   },
    ]},
  { name: 'getPlayerState', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [
      { name: 'state', type: 'tuple', components: [
        { name: 'coins', type: 'uint256' }, { name: 'seeds', type: 'uint256' },
      ]},
      { name: 'plots', type: 'tuple[9]', components: [
        { name: 'seedCount', type: 'uint256' }, { name: 'plantedAt', type: 'uint256' },
        { name: 'profit',    type: 'uint256' }, { name: 'duration',  type: 'uint256' },
        { name: 'cropId',    type: 'uint8'   },
      ]},
    ]},
  { name: 'getCrops', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'tuple[]', components: [
      { name: 'name',          type: 'string'  },
      { name: 'minSeeds',      type: 'uint256' },
      { name: 'profitBps',     type: 'uint256' },
      { name: 'stageDuration', type: 'uint256' },
      { name: 'spriteUrl',     type: 'string'  },
      { name: 'active',        type: 'bool'    },
    ]}]},

  // ── Read: market ────────────────────────────────────────────
  { name: 'getActiveListingIds', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'bytes32[]' }] },
  { name: 'getListings', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'ids', type: 'bytes32[]' }],
    outputs: [{ name: '', type: 'tuple[]', components: [
      { name: 'seller',       type: 'address' },
      { name: 'seedCount',    type: 'uint256' },
      { name: 'remaining',    type: 'uint256' },
      { name: 'pricePerSeed', type: 'uint256' },
      { name: 'listedAt',     type: 'uint256' },
      { name: 'totalEarned',  type: 'uint256' },
    ]}]},

  // ── Read: price & stats ─────────────────────────────────────
  { name: 'getCurrentSeedPrice', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'getMarketStats', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'tuple', components: [
      { name: 'currentSeedPrice', type: 'uint256' },
      { name: 'vwap',             type: 'uint256' },
      { name: 'supply',           type: 'uint256' },
      { name: 'planted',          type: 'uint256' },
      { name: 'listed',           type: 'uint256' },
    ]}]},

  // ── Read: harvest helpers ───────────────────────────────────
  { name: 'isHarvestReady', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }, { name: 'plotIndex', type: 'uint8' }],
    outputs: [{ name: '', type: 'bool' }] },
  { name: 'isHarvestLate', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }, { name: 'plotIndex', type: 'uint8' }],
    outputs: [{ name: '', type: 'bool' }] },
  { name: 'getStage', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }, { name: 'plotIndex', type: 'uint8' }],
    outputs: [{ name: '', type: 'uint256' }] },

  // ── Read: config ────────────────────────────────────────────
  { name: 'stageDuration',  type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'baseSeedPrice',  type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'plotCount',      type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'earnRateBps',    type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'seedsPerPlot',   type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'harvestGracePeriod', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'totalPlayers',       type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'getGameConfig',  type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'tuple', components: [
      { name: 'stageDuration',      type: 'uint256' },
      { name: 'baseSeedPrice',      type: 'uint256' },
      { name: 'plotCount',          type: 'uint256' },
      { name: 'earnRateBps',        type: 'uint256' },
      { name: 'seedsPerPlot',       type: 'uint256' },
      { name: 'harvestGracePeriod', type: 'uint256' },
    ]}]},
  { name: 'owner', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'address' }] },
  { name: 'contractFBMXBalance', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'uint256' }] },

  // ── Write: game ─────────────────────────────────────────────
  { name: 'deposit',    type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] },
  { name: 'withdraw',   type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] },
  { name: 'buySeeds',   type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] },
  { name: 'plant',      type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'plotIndex', type: 'uint8' }, { name: 'cropId', type: 'uint8' }], outputs: [] },
  { name: 'harvest',    type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'plotIndex', type: 'uint8' }], outputs: [] },
  { name: 'listSeeds',  type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }, { name: 'pricePerSeed', type: 'uint256' }],
    outputs: [{ name: 'listingId', type: 'bytes32' }] },
  { name: 'cancelListing', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'listingId', type: 'bytes32' }], outputs: [] },
  { name: 'buy',        type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'listingId', type: 'bytes32' }, { name: 'amount', type: 'uint256' }], outputs: [] },
  { name: 'fund',       type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] },

  // ── Write: owner setters ────────────────────────────────────
  { name: 'setStageDuration',  type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'duration', type: 'uint256' }], outputs: [] },
  { name: 'setBaseSeedPrice',  type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'price',    type: 'uint256' }], outputs: [] },
  { name: 'setPlotCount',      type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'count',    type: 'uint256' }], outputs: [] },
  { name: 'setEarnRateBps',    type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'bps',      type: 'uint256' }], outputs: [] },
  { name: 'setSeedsPerPlot',        type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'count',       type: 'uint256' }], outputs: [] },
  { name: 'setHarvestGracePeriod', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'seconds_',    type: 'uint256' }], outputs: [] },
  { name: 'setActionCooldown',     type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'seconds_',    type: 'uint256' }], outputs: [] },
  { name: 'actionCooldown',        type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'updateCrop', type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'cropId',         type: 'uint8'   },
      { name: 'name',           type: 'string'  },
      { name: 'minSeeds',       type: 'uint256' },
      { name: 'profitBps',      type: 'uint256' },
      { name: 'stageDuration_', type: 'uint256' },
      { name: 'spriteUrl',      type: 'string'  },
    ], outputs: [] },
  { name: 'setCropActive', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'cropId', type: 'uint8' }, { name: 'active', type: 'bool' }], outputs: [] },
  { name: 'setCropSpriteUrl', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'cropId', type: 'uint8' }, { name: 'spriteUrl', type: 'string' }], outputs: [] },

  // ── Events ──────────────────────────────────────────────────
  { name: 'CropAdded', type: 'event',
    inputs: [
      { name: 'cropId',        type: 'uint8',   indexed: true },
      { name: 'name',          type: 'string'  },
      { name: 'minSeeds',      type: 'uint256' },
      { name: 'profitBps',     type: 'uint256' },
      { name: 'stageDuration', type: 'uint256' },
    ]},
  { name: 'CropUpdated', type: 'event',
    inputs: [
      { name: 'cropId',        type: 'uint8',   indexed: true },
      { name: 'name',          type: 'string'  },
      { name: 'minSeeds',      type: 'uint256' },
      { name: 'profitBps',     type: 'uint256' },
      { name: 'stageDuration', type: 'uint256' },
    ]},
  { name: 'Deposited', type: 'event',
    inputs: [{ name: 'player', type: 'address', indexed: true }, { name: 'amount', type: 'uint256' }] },
  { name: 'Funded', type: 'event',
    inputs: [{ name: 'funder', type: 'address', indexed: true }, { name: 'amount', type: 'uint256' }] },
  { name: 'Withdrawn', type: 'event',
    inputs: [{ name: 'player', type: 'address', indexed: true }, { name: 'amount', type: 'uint256' }] },
  { name: 'Purchase', type: 'event',
    inputs: [
      { name: 'listingId', type: 'bytes32', indexed: true },
      { name: 'buyer',     type: 'address', indexed: true },
      { name: 'seller',    type: 'address', indexed: true },
      { name: 'amount',    type: 'uint256' },
      { name: 'totalCost', type: 'uint256' },
    ]},
]

// ── Unit helpers ──────────────────────────────────────────────

/** Convert whole coins (off-chain) to FBMX wei (on-chain) */
export const coinsToWei = (coins) => parseUnits(coins.toString(), 18)

/** Convert FBMX wei (on-chain) to display string */
export const weiToCoins = (wei) => formatUnits(wei, 18)

/** Display-friendly: trim trailing zeros */
export const fmtFBMX = (wei) => {
  const n = parseFloat(formatUnits(wei, 18))
  return Number.isInteger(n) ? n.toLocaleString() : n.toFixed(4)
}
