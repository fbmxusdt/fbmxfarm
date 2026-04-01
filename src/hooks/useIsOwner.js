/**
 * useIsOwner — returns whether the connected wallet is the contract owner.
 *
 * Reads owner() once on mount (no polling needed — ownership rarely changes).
 * Safe to call from multiple components; wagmi deduplicates the RPC call.
 */

import { useConnection, useReadContract, useChainId } from 'wagmi'
import { FARMING_GAME_ABI, FARMING_GAME_ADDRESS }     from '../lib/contracts.js'

const SUPPORTED = new Set([56, 97, 31337])

export function useIsOwner() {
  const { address } = useConnection()
  const chainId     = useChainId()
  const gameAddr    = SUPPORTED.has(chainId) ? FARMING_GAME_ADDRESS[chainId] : null

  const { data: owner } = useReadContract({
    address:      gameAddr,
    abi:          FARMING_GAME_ABI,
    functionName: 'owner',
    query: {
      enabled:              !!gameAddr,
      staleTime:            0,
      refetchOnMount:       true,
      refetchOnWindowFocus: true,
    },
  })

  const isOwner = !!(address && owner && address.toLowerCase() === owner.toLowerCase())

  return { isOwner, owner }
}
