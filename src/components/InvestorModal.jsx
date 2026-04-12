import { useEffect } from 'react'

export function InvestorModal({ onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4"
      style={{ background: 'rgba(8,14,7,0.92)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-6xl rounded-xl overflow-hidden shadow-2xl flex flex-col"
        style={{
          height: '90vh',
          border: '1px solid var(--forest-light)',
          background: 'var(--forest-mid)',
        }}
      >
        {/* Modal header bar */}
        <div
          className="flex items-center justify-between px-4 py-2.5 shrink-0"
          style={{ background: 'var(--forest-mid)', borderBottom: '1px solid var(--forest-light)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">💼</span>
            <span className="font-bold text-sm sm:text-base" style={{ color: 'var(--gold-bright)' }}>
              FBMX Farming — Learn
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
            style={{
              background: 'var(--soil-mid)',
              border: '1px solid var(--bark)',
              color: 'var(--parchment)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--soil-light)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--soil-mid)' }}
          >
            <span>✕</span>
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>

        {/* Investor deck iframe */}
        <iframe
          src="/LEARNV2.html"
          title="FBMX Farming — Game Introduction"
          className="w-full flex-1 border-0"
          style={{ minHeight: 0 }}
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  )
}
