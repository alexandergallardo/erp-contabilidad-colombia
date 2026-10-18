export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { CheckCircle2, FileText, ShieldCheck } from 'lucide-react'
import {
  formatEmpresaPublicaDireccion,
  getEmpresaPublicaById,
  getFacturaPublicaById,
  type FacturaPublicaLinea,
} from '@/lib/db/factura-publica'
import { formatCOP, formatFecha } from '@/utils/cn'

interface PageProps {
  params: Promise<{ id: string }>
}

function formatNit(empresa: Awaited<ReturnType<typeof getEmpresaPublicaById>>) {
  if (!empresa?.nit) return '—'
  return `${empresa.nit}${empresa.dv ? `-${empresa.dv}` : ''}`
}

function estadoLabel(estado?: string | null) {
  switch (estado) {
    case 'pagada':
      return 'Pagada'
    case 'pendiente':
      return 'Pendiente'
    case 'vencida':
      return 'Vencida'
    case 'cancelada':
      return 'Cancelada'
    default:
      return estado ?? 'Registrada'
  }
}

export default async function ValidarFacturaPage({ params }: PageProps) {
  const { id } = await params
  const factura = await getFacturaPublicaById(id).catch(() => null)

  if (!factura) notFound()

  const empresa = await getEmpresaPublicaById(factura.empresa_id).catch(() => null)
  const lineas = (factura.lineas ?? []) as FacturaPublicaLinea[]
  const cliente = factura.cliente

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="border-b border-emerald-100 bg-emerald-50">
        <div className="mx-auto flex max-w-3xl items-start gap-3 px-5 py-6">
          <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Factura validada</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-950">
              {factura.prefijo}{factura.numero}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Este documento fue encontrado en el sistema de {empresa?.nombre ?? 'la empresa emisora'}.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-6">
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Emisor</p>
            <p className="mt-2 font-bold">{empresa?.nombre ?? '—'}</p>
            {empresa?.razon_social && empresa.razon_social !== empresa.nombre && (
              <p className="text-sm text-gray-600">{empresa.razon_social}</p>
            )}
            <p className="mt-1 text-sm text-gray-600">NIT: {formatNit(empresa)}</p>
            <p className="text-sm text-gray-600">{formatEmpresaPublicaDireccion(empresa)}</p>
            {empresa?.telefono && <p className="text-sm text-gray-600">Tel: {empresa.telefono}</p>}
            {empresa?.email && <p className="text-sm text-gray-600">{empresa.email}</p>}
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Documento</p>
            <div className="mt-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <p className="font-bold">{estadoLabel(factura.estado)}</p>
            </div>
            <p className="mt-1 text-sm text-gray-600">Fecha: {formatFecha(factura.fecha)}</p>
            {factura.fecha_vencimiento && (
              <p className="text-sm text-gray-600">Vence: {formatFecha(factura.fecha_vencimiento)}</p>
            )}
            {factura.forma_pago?.descripcion && (
              <p className="text-sm text-gray-600">Forma de pago: {factura.forma_pago.descripcion}</p>
            )}
            {factura.cufe && <p className="mt-2 break-all text-xs text-gray-500">CUFE: {factura.cufe}</p>}
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Cliente</p>
          <p className="mt-2 font-bold">{cliente?.razon_social ?? 'Consumidor Final'}</p>
          {cliente?.numero_documento && (
            <p className="text-sm text-gray-600">{cliente.tipo_documento ?? 'Documento'}: {cliente.numero_documento}</p>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3">
            <FileText className="h-4 w-4 text-gray-500" />
            <p className="text-sm font-semibold">Detalle de productos</p>
          </div>
          <div className="divide-y divide-gray-100">
            {lineas.map((linea, index) => (
              <div key={linea.id ?? index} className="grid gap-2 px-4 py-3 sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-medium">{linea.producto?.descripcion ?? linea.descripcion ?? '—'}</p>
                  {linea.producto?.codigo && <p className="font-mono text-xs text-gray-500">{linea.producto.codigo}</p>}
                  <p className="text-sm text-gray-600">
                    {linea.cantidad} x {formatCOP(linea.precio_unitario)}
                  </p>
                </div>
                <p className="font-mono font-semibold sm:text-right">{formatCOP(linea.total)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-xs rounded-lg border border-gray-200 p-4">
            <div className="flex justify-between py-1 text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-mono">{formatCOP(factura.subtotal)}</span>
            </div>
            {factura.total_descuento > 0 && (
              <div className="flex justify-between py-1 text-sm">
                <span className="text-gray-600">Descuento</span>
                <span className="font-mono">-{formatCOP(factura.total_descuento)}</span>
              </div>
            )}
            <div className="flex justify-between py-1 text-sm">
              <span className="text-gray-600">IVA</span>
              <span className="font-mono">{formatCOP(factura.total_iva)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-gray-900 pt-2 font-bold">
              <span>Total</span>
              <span className="font-mono">{formatCOP(factura.total)}</span>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-gray-500">
          Validación pública de documento. Esta página solo muestra información de la factura escaneada.
        </p>
      </section>
    </main>
  )
}
