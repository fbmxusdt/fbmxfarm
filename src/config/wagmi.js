import { createConfig, http } from 'wagmi'
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

export const wagmiConfig = createConfig({
  chains: [bsc, bscTestnet, hardhatLocal],
  connectors: [
    injected(),
    walletConnect({ projectId: WC_PROJECT_ID }),
  ],
  transports: {
    [bsc.id]:         http(),
    [bscTestnet.id]:  http(),
    [hardhatLocal.id]:http('http://127.0.0.1:8545'),
  },
})

export { bsc, bscTestnet }
