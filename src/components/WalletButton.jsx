import { useConnection, useConnect, useConnectors, useDisconnect } from 'wagmi'

export function WalletButton() {
  const { address, isConnected }     = useConnection()
  const { mutate: connect, isPending } = useConnect()
  const { mutate: disconnect }       = useDisconnect()
  const connectors                   = useConnectors()

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
        <button
          onClick={() => disconnect()}
          className="text-xs text-red-400 border border-red-400/40 px-3 py-1 rounded-full hover:bg-red-400/10 transition-colors"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {connectors.map(connector => (
        <button
          key={connector.uid}
          onClick={() => connect({ connector })}
          disabled={isPending}
          className="text-sm font-semibold bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white px-4 py-1.5 rounded-full transition-colors"
        >
          {isPending ? 'Connecting…' : `Connect ${connector.name}`}
        </button>
      ))}
    </div>
  )
}
