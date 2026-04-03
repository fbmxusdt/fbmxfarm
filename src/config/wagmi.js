import { createConfig, http, fallback } from 'wagmi'
import { bsc, bscTestnet } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'
import { defineChain } from 'viem'

// Local Hardhat network
export const hardhatLocal = defineChain({
  id:   31337,
  name: 'Hardhat Local',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } },
})

// Replace with your WalletConnect Cloud project ID
const WC_PROJECT_ID = import.meta.env.VITE_WC_PROJECT_ID || 'YOUR_WALLETCONNECT_PROJECT_ID'

// ── BSC RPC fallback pools ───────────────────────────────────────
// Public endpoints are free but rate-limited; fallback() rotates to the
// next URL automatically on timeout or error so the dApp stays responsive.
// Add a private node (QuickNode / NodeReal) as the first entry for best UX.
const BSC_MAINNET_RPCS = fallback([
  http(import.meta.env.VITE_BSC_RPC_URL || 'https://bsc-dataseed.binance.org/'),
  http('https://bsc-rpc.publicnode.com'),
  http('https://bsc-dataseed1.defibit.io/'),
  http('https://bsc-dataseed1.ninicoin.io/'),
  http('https://bsc-dataseed2.defibit.io/'),
  http('https://bsc-dataseed3.defibit.io/'),
], { rank: false })   // rank:false = round-robin, not latency-ranked (avoids extra probe calls)

const BSC_TESTNET_RPCS = fallback([
  http('https://data-seed-prebsc-1-s1.binance.org:8545/'),
  http('https://data-seed-prebsc-2-s1.binance.org:8545/'),
  http('https://data-seed-prebsc-1-s2.binance.org:8545/'),
], { rank: false })

export const wagmiConfig = createConfig({
  chains: [bsc, bscTestnet, hardhatLocal],
  connectors: [
    injected(),
    walletConnect({ projectId: WC_PROJECT_ID }),
  ],
  transports: {
    [bsc.id]:          BSC_MAINNET_RPCS,
    [bscTestnet.id]:   BSC_TESTNET_RPCS,
    [hardhatLocal.id]: http('http://127.0.0.1:8545'),
  },
})

export { bsc, bscTestnet }
