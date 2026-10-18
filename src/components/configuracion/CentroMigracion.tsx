'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Boxes,
  Clock3,
  Download,
  FileSpreadsheet,
  FolderSync,
  Package,
  Receipt,
  Scale,
  Users,
} from 'lucide-react'
import { ImportarCSV } from '@/components/configuracion/ImportarCSV'
import type { HistorialImportacionItem } from '@/lib/db/importaciones'
import { type ImportEntity, IMPORT_ENTITY_META, normalizeImportEntity } from '@/lib/import/migration'
import { getVisibleExports } from '@/lib/export/registry'
import type { AppRole } from '@/lib/auth/permissions'
import { cardCls, cn } from '@/utils/cn'

interface CentroMigracionProps {
  initialEntidad: ImportEntity
  historial: HistorialImportacionItem[]
  role: AppRole | null
}

type ImportCard = {
  entidad: ImportEntity
  resumen: string
  icon: typeof FolderSync
  accent: string
}

const IMPORTACIONES_UTILES: readonly ImportCard[] = [
  {
    entidad: 'cuentas-puc',
    resumen: 'Plan de cuentas base para contabilidad.',
    icon: Scale,
    accent: 'border-blue-200 bg-blue-50 text-blue-700',
  },
  {
    entidad: 'clientes',
    resumen: 'Maestro comercial para ventas y cartera.',
    icon: Users,
    accent: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  },
  {
    entidad: 'proveedores',
    resumen: 'Maestro para compras y cuentas por pagar.',
    icon: Users,
    accent: 'border-orange-200 bg-orange-50 text-orange-700',
  },
  {
    entidad: 'productos',
    resumen: 'Catalogo, precios, impuesto y familia.',
    icon: Package,
    accent: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  {
    entidad: 'inventario-inicial',
    resumen: 'Existencias, stock minimo y costo inicial.',
    icon: Boxes,
    accent: 'border-lime-200 bg-lime-50 text-lime-700',
  },
  {
    entidad: 'asientos-contables',
    resumen: 'Saldos de apertura o comprobantes manuales.',
    icon: Scale,
    accent: 'border-violet-200 bg-violet-50 text-violet-700',
  },
  {
    entidad: 'facturas-compra',
    resumen: 'Historico de compras sin mover inventario.',
    icon: Receipt,
    accent: 'border-amber-200 bg-amber-50 text-amber-700',
  },
] as const

const EXPORTACIONES_UTILES = new Set(['inventario', 'clientes', 'proveedores', 'compras', 'ventas'])

function getHistorialLabel(tabla: string) {
  const map: Record<string, string> = {
    import_clientes: 'Clientes',
    import_proveedores: 'Proveedores',
    import_productos: 'Productos',
    import_inventario_inicial: 'Inventario inicial',
    import_facturas_compra: 'Facturas compra',
    import_cuentas_puc: 'PUC',
    import_asientos_contables: 'Asientos',
  }
  return map[tabla] ?? tabla
}

export function CentroMigracion({ initialEntidad, historial, role }: CentroMigracionProps) {
  const [selectedEntidad, setSelectedEntidad] = useState<ImportEntity>(initialEntidad)
  const exportCards = useMemo(
    () => role
      ? getVisibleExports(role).filter((item) => EXPORTACIONES_UTILES.has(item.id))
      : [],
    [role]
  )
  const selectedMeta = IMPORT_ENTITY_META[selectedEntidad]

  useEffect(() => {
    setSelectedEntidad(initialEntidad)
  }, [initialEntidad])

  useEffect(() => {
    function syncFromUrl() {
      const params = new URLSearchParams(window.location.search)
      setSelectedEntidad(normalizeImportEntity(params.get('entidad')))
    }

    window.addEventListener('popstate', syncFromUrl)
    return () => window.removeEventListener('popstate', syncFromUrl)
  }, [])

  const seleccionarEntidad = useCallback((entidad: ImportEntity, options?: { scroll?: boolean; replace?: boolean }) => {
    setSelectedEntidad(entidad)

    const url = new URL(window.location.href)
    url.searchParams.set('entidad', entidad)
    url.hash = 'importador'
    if (options?.replace) {
      window.history.replaceState({}, '', url)
    } else {
      window.history.pushState({}, '', url)
    }

    if (options?.scroll ?? true) {
      window.requestAnimationFrame(() => {
        document.getElementById('importador')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
          <FolderSync className="h-3.5 w-3.5" />
          Migracion, importacion y exportacion
        </div>
        <div className="max-w-3xl space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Centro operativo de datos</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Solo se muestran cargas y salidas con endpoint activo: maestros, catalogo, inventario,
            saldos contables, compras historicas y respaldos exportables.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {IMPORTACIONES_UTILES.map(({ entidad, resumen, icon: Icon, accent }) => {
          const meta = IMPORT_ENTITY_META[entidad]
          return (
            <button
              key={entidad}
              type="button"
              onClick={() => seleccionarEntidad(entidad)}
              aria-pressed={selectedEntidad === entidad}
              className={cn(
                cardCls,
                'group flex min-h-32 flex-col justify-between p-5 text-left transition-shadow hover:shadow-sm',
                selectedEntidad === entidad && 'border-teal-300 ring-2 ring-teal-100 dark:border-teal-700 dark:ring-teal-900/40'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg border', accent)}>
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">{meta.shortLabel}</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{resumen}</p>
              </div>
            </button>
          )
        })}
      </section>

      <section className={cn(cardCls, 'p-5')}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
              <Download className="h-4 w-4 text-blue-600" />
              Exportaciones utiles
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Respalda los datos que se importan o se consultan en migraciones reales.
            </p>
          </div>
          <Link href="/informes/exportaciones" className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100">
            Ver todas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {exportCards.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            No hay exportaciones visibles para este rol.
          </div>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {exportCards.map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</p>
                <p className="mt-1 min-h-10 text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
                <div className="mt-3 flex gap-2">
                  <a
                    href={`${item.route}?format=csv`}
                    download
                    className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    CSV
                  </a>
                  <a
                    href={`${item.route}?format=xlsx`}
                    download
                    className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    XLSX
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={cn(cardCls, 'p-5')}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
              <Clock3 className="h-4 w-4 text-teal-600" />
              Historial de importaciones
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Ultimas ejecuciones registradas desde este centro.</p>
          </div>
        </div>
        {historial.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            Todavia no hay importaciones registradas para esta empresa.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 text-left dark:border-gray-800">
                <tr>
                  <th className="px-3 py-2 font-medium text-gray-500">Fecha</th>
                  <th className="px-3 py-2 font-medium text-gray-500">Entidad</th>
                  <th className="px-3 py-2 font-medium text-gray-500">Resultado</th>
                  <th className="px-3 py-2 font-medium text-gray-500">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {historial.map((item) => {
                  const resumen = item.datos_nuevos ?? {}
                  const exitosos = Number(resumen.exitosos ?? 0)
                  const fallidos = Number(resumen.fallidos ?? 0)
                  return (
                    <tr key={item.id}>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                        {new Date(item.created_at).toLocaleString('es-CO')}
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">
                        {getHistorialLabel(item.tabla)}
                      </td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                        {resumen.total ?? '—'} fila(s) / {exitosos} ok / {fallidos} error(es)
                      </td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                        {resumen.detalle ?? 'Importacion registrada en auditoria'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section id="importador" className="scroll-mt-24">
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
            <FileSpreadsheet className="h-4 w-4 text-teal-600" />
            Importar ahora
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Entidad seleccionada: {selectedMeta.label}
          </p>
        </div>
        <ImportarCSV
          initialEntidad={selectedEntidad}
          onEntidadChange={(entidad) => seleccionarEntidad(entidad, { scroll: false, replace: true })}
        />
      </section>
    </div>
  )
}
