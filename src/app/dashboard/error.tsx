'use client'

import { RefreshCw } from 'lucide-react'

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <div role="alert" className="flex min-h-64 flex-col items-center justify-center gap-4">
      <p>No se pudo cargar el resumen.</p>
      <button onClick={reset} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm text-white hover:bg-teal-700">
        <RefreshCw className="h-4 w-4" /> Reintentar
      </button>
    </div>
  )
}
