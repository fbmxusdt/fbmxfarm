/**
 * useTokenBalance — reads FBMX token balance from BSC.
 *
 * Shows live on-chain balance when connected to BSC (chainId 56) or
 * BSC testnet (97) or hardhat local (31337 with mock token).
 * Returns "—" when on an unsupported network.
 */

import { useReadContract, useChainId } from 'wagmi'
import { formatUnits } from 'viem'
import { FBMX_ADDRESS, ERC20_ABI } from '../lib/contracts.js'

// Supported chain IDs where FBMX exists
const SUPPORTED = new Set([56, 97, 31337])

export function useTokenBalance(address) {
  const chainId   = useChainId()
  const supported = SUPPORTED.has(chainId)

  const { data, isLoading, refetch } = useReadContract({
    address:      FBMX_ADDRESS,
    abi:          ERC20_ABI,
    functionName: 'balanceOf',
    args:         [address],
    query:        { enabled: !!address && supported, refetchInterval: 10_000 },
  })

  const raw     = data ?? 0n
  // Plain JS number — used for arithmetic (e.g. max deposit amount)
  const balance = data != null ? parseFloat(formatUnits(raw, 18)) : 0
  // Locale-formatted string — display only, NOT for parseFloat
  const formatted = data != null
    ? (Number.isInteger(balance)
        ? balance.toLocaleString()
        : balance.toLocaleString(undefined, { maximumFractionDigits: 4 }))
    : (supported ? '…' : '—')

  return { raw, balance, formatted, isLoading, supported, refetch }
}
