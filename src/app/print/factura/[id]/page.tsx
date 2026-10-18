export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getFacturaById } from '@/lib/db/ventas'
import { formatEmpresaPublicaDireccion, getEmpresaPublicaById, type EmpresaPublica } from '@/lib/db/factura-publica'
import { cn, formatCOP, formatFecha } from '@/utils/cn'
import { PrintButton } from '@/components/print/PrintButton'
import { PrintLayout } from '@/components/print/PrintLayout'
import { QRDocumento } from '@/components/print/QRDocumento'
import { headers } from 'next/headers'
import {
  FACTURA_PRINT_OPTIONS,
  buildFacturaPrintHref,
  normalizeFacturaPrintFormat,
  type FacturaPrintFormat,
} from '@/lib/print/factura'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ formato?: string }>
}

type EmpresaPrint = EmpresaPublica

type FacturaLineaPrint = {
  id: string
  descripcion?: string | null
  cantidad: number
  precio_unitario: number
  descuento_porcentaje: number
  subtotal: number
  total_iva: number
  total: number
  producto?: { codigo?: string | null; descripcion?: string | null } | null
  impuesto?: { porcentaje?: number | null } | null
}

type FacturaReciboPrint = {
  id: string
  numero: number
  valor: number
  fecha: string
  forma_pago?: { descripcion?: string | null } | null
}

type FacturaClientePrint = {
  razon_social?: string | null
  numero_documento?: string | null
  tipo_documento?: string | null
  email?: string | null
  telefono?: string | null
  direccion?: string | null
} | null

async function getEmpresaById(empresaId?: string | null) {
  return getEmpresaPublicaById(empresaId)
}

function getThermalPrintCss(formato: Extract<FacturaPrintFormat, 'termica-80' | 'termica-58'>) {
  const pageWidth = formato === 'termica-58' ? '58mm' : '80mm'
  const pageMargin = formato === 'termica-58' ? '3mm' : '4mm'
  const fontSize = formato === 'termica-58' ? '10px' : '11px'
  const lineHeight = formato === 'termica-58' ? '1.28' : '1.35'

  return `
    @page {
      size: ${pageWidth} auto;
      margin: ${pageMargin};
    }

    [data-print-format="${formato}"] {
      background: #f5f5f5;
    }

    [data-print-format="${formato}"] .thermal-shell {
      width: ${pageWidth};
      max-width: calc(100vw - 24px);
      font-size: ${fontSize};
      line-height: ${lineHeight};
    }

    @media print {
      html, body {
        background: #ffffff !important;
      }

      [data-print-format="${formato}"] .thermal-toolbar {
        display: none !important;
      }

      [data-print-format="${formato}"] .thermal-shell {
        width: 100% !important;
        max-width: none !important;
        margin: 0 !important;
        border: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        padding: 0 !important;
      }
    }
  `
}

function ThermalPrintLayout({ formato }: { formato: Extract<FacturaPrintFormat, 'termica-80' | 'termica-58'> }) {
  return <style dangerouslySetInnerHTML={{ __html: getThermalPrintCss(formato) }} />
}

function ThermalFacturaDocument({
  factura,
  empresa,
  cliente,
  lineas,
  recibos,
  formato,
  validationUrl,
}: {
  factura: Awaited<ReturnType<typeof getFacturaById>>
  empresa: EmpresaPrint | null
  cliente: FacturaClientePrint
  lineas: FacturaLineaPrint[]
  recibos: FacturaReciboPrint[]
  formato: Extract<FacturaPrintFormat, 'termica-80' | 'termica-58'>
  validationUrl: string
}) {
  const is58 = formato === 'termica-58'

  return (
    <div className="px-3 py-4 print:px-0 print:py-0">
      <div className="thermal-shell mx-auto rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm print:shadow-none">
        <div className="border-b border-dashed border-gray-300 pb-3 text-center">
          <p className={cn('font-bold uppercase tracking-wide text-gray-900', is58 ? 'text-sm' : 'text-base')}>
            {empresa?.nombre ?? 'EMPRESA'}
          </p>
          {empresa?.razon_social && empresa.razon_social !== empresa.nombre && (
            <p className="mt-0.5 text-[10px] text-gray-500">{empresa.razon_social}</p>
          )}
          <p className="mt-1 text-[10px] text-gray-600">
            NIT: {empresa?.nit ?? '—'}{empresa?.dv ? `-${empresa.dv}` : ''}
          </p>
          <p className="text-[10px] text-gray-500">Dirección: {formatEmpresaPublicaDireccion(empresa)}</p>
          <p className="text-[10px] text-gray-500">Tel: {empresa?.telefono ?? '—'}</p>
          {empresa?.email && <p className="text-[10px] text-gray-500">{empresa.email}</p>}
        </div>

        <div className="border-b border-dashed border-gray-300 py-3 text-center">
          <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Factura de venta</p>
          <p className={cn('mt-1 font-mono font-bold text-gray-900', is58 ? 'text-lg' : 'text-xl')}>
            {factura.prefijo}{factura.numero}
          </p>
          <div className="mt-2 space-y-0.5 text-[10px] text-gray-600">
            <p>Fecha: {formatFecha(factura.fecha)}</p>
            {factura.fecha_vencimiento && <p>Vence: {formatFecha(String(factura.fecha_vencimiento))}</p>}
            {factura.forma_pago && <p>Forma de pago: {(factura.forma_pago as { descripcion?: string }).descripcion ?? '—'}</p>}
          </div>
        </div>

        <div className="border-b border-dashed border-gray-300 py-3 text-[10px] text-gray-700">
          <p className="font-semibold uppercase tracking-wide text-gray-500">Cliente</p>
          <p className="mt-1 font-semibold text-gray-900">{cliente?.razon_social ?? 'Consumidor Final'}</p>
          {cliente?.numero_documento && (
            <p>{cliente.tipo_documento ?? 'CC'}: {cliente.numero_documento}</p>
          )}
          {cliente?.telefono && <p>Tel: {cliente.telefono}</p>}
          {cliente?.direccion && <p>{cliente.direccion}</p>}
        </div>

        <div className="border-b border-dashed border-gray-300 py-3">
          <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            <span>Detalle</span>
            <span>Total</span>
          </div>
          <div className="space-y-2">
            {lineas.map((linea, index) => (
              <div key={linea.id ?? index} className="border-b border-dotted border-gray-200 pb-2 last:border-b-0 last:pb-0">
                <p className="font-medium text-gray-900">{linea.producto?.descripcion ?? linea.descripcion ?? '—'}</p>
                {linea.producto?.codigo && <p className="font-mono text-[10px] text-gray-400">{linea.producto.codigo}</p>}
                <div className="mt-1 flex items-start justify-between gap-2 text-[10px] text-gray-600">
                  <div className="space-y-0.5">
                    <p>{linea.cantidad} x {formatCOP(linea.precio_unitario)}</p>
                    {(linea.descuento_porcentaje > 0 || linea.impuesto?.porcentaje) && (
                      <p>
                        {linea.descuento_porcentaje > 0 ? `Dcto ${linea.descuento_porcentaje}%` : 'Sin dcto'}
                        {` · IVA ${linea.impuesto?.porcentaje ?? 0}%`}
                      </p>
                    )}
                  </div>
                  <p className="font-mono font-semibold text-gray-900">{formatCOP(linea.total)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-b border-dashed border-gray-300 py-3 text-[10px]">
          <div className="flex justify-between py-0.5 text-gray-600">
            <span>Subtotal</span>
            <span className="font-mono">{formatCOP(factura.subtotal)}</span>
          </div>
          {factura.total_descuento > 0 && (
            <div className="flex justify-between py-0.5 text-gray-600">
              <span>Descuento</span>
              <span className="font-mono">-{formatCOP(factura.total_descuento)}</span>
            </div>
          )}
          <div className="flex justify-between py-0.5 text-gray-600">
            <span>IVA</span>
            <span className="font-mono">{formatCOP(factura.total_iva)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-gray-900 pt-1 text-sm font-bold text-gray-900">
            <span>TOTAL</span>
            <span className="font-mono">{formatCOP(factura.total)}</span>
          </div>
        </div>

        {(factura.observaciones || recibos.length > 0) && (
          <div className="border-b border-dashed border-gray-300 py-3 text-[10px] text-gray-600">
            {factura.observaciones && (
              <div className="mb-2">
                <p className="font-semibold uppercase tracking-wide text-gray-500">Observaciones</p>
                <p className="mt-1 italic">{factura.observaciones}</p>
              </div>
            )}

            {recibos.length > 0 && (
              <div>
                <p className="font-semibold uppercase tracking-wide text-gray-500">Pagos registrados</p>
                <div className="mt-1 space-y-1">
                  {recibos.map((recibo) => (
                    <div key={recibo.id} className="flex justify-between gap-2">
                      <span>{formatFecha(recibo.fecha)} · {recibo.forma_pago?.descripcion ?? '—'}</span>
                      <span className="font-mono">{formatCOP(recibo.valor)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pt-3 text-center text-[10px] text-gray-500">
          <div className="mb-2 flex justify-center">
            <QRDocumento url={validationUrl} size={is58 ? 64 : 72} label="Validar factura" />
          </div>
          <p>Gracias por tu compra</p>
          <p className="mt-1">Generado por ClovEnt · {new Date().toLocaleDateString('es-CO')}</p>
        </div>
      </div>
    </div>
  )
}

export default async function PrintFacturaPage({ params, searchParams }: PageProps) {
  const [{ id }, sp] = await Promise.all([params, searchParams])
  const formato = normalizeFacturaPrintFormat(sp?.formato)
  const factura = await getFacturaById(id).catch(() => null)

  if (!factura) notFound()

  const empresa = await getEmpresaById(String(factura.empresa_id ?? ''))
  const empresaFactura = (factura as { empresa?: EmpresaPrint | EmpresaPrint[] | null }).empresa
  const empresaFallback = Array.isArray(empresaFactura) ? empresaFactura[0] : empresaFactura
  const empresaPrint = empresa ?? empresaFallback ?? null

  const lineas = (factura.lineas ?? []) as unknown as FacturaLineaPrint[]
  const recibos = (factura.recibos ?? []) as unknown as FacturaReciboPrint[]
  const cliente = factura.cliente as FacturaClientePrint
  const plantilla = empresaPrint?.plantilla_pdf ?? 'clasica'
  const hdrs = await headers()
  const host = hdrs.get('host') ?? 'localhost:3000'
  const proto = host.includes('localhost') ? 'http' : 'https'
  const validationUrl = `${proto}://${host}/validar/factura/${id}`

  return (
    <div className="min-h-screen bg-white" data-plantilla={plantilla} data-print-format={formato}>
      {formato === 'normal'
        ? <PrintLayout plantilla={plantilla} />
        : <ThermalPrintLayout formato={formato} />}

      <div className="thermal-toolbar print:hidden flex flex-wrap items-center gap-3 border-b border-gray-200 bg-gray-100 px-6 py-3">
        <PrintButton />
        <div className="flex flex-wrap gap-2">
          {FACTURA_PRINT_OPTIONS.map((option) => (
            <a
              key={option.value}
              href={buildFacturaPrintHref(id, option.value)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-sm transition-colors',
                formato === option.value
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              )}
            >
              {option.label}
            </a>
          ))}
        </div>
        <a href={`/ventas/facturas/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
          ← Volver
        </a>
      </div>

      {formato === 'normal' ? (
        <div className="max-w-2xl mx-auto px-8 py-8 print:px-6 print:py-4 print:max-w-none">
          <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-800">
            <div>
              <h1 className="text-xl font-bold text-gray-900 uppercase">{empresaPrint?.nombre ?? 'EMPRESA'}</h1>
              {empresaPrint?.razon_social && empresaPrint.razon_social !== empresaPrint.nombre && (
                <p className="text-sm text-gray-600">{empresaPrint.razon_social}</p>
              )}
              <p className="text-sm text-gray-600 mt-1">NIT: {empresaPrint?.nit ?? '—'}{empresaPrint?.dv ? `-${empresaPrint.dv}` : ''}</p>
              <p className="text-sm text-gray-500">Dirección: {formatEmpresaPublicaDireccion(empresaPrint)}</p>
              <p className="text-sm text-gray-500">Tel: {empresaPrint?.telefono ?? '—'}</p>
              {empresaPrint?.email && <p className="text-sm text-gray-500">{empresaPrint.email}</p>}
              {empresaPrint?.regimen && (
                <p className="text-xs text-gray-400 mt-1 uppercase">Régimen {empresaPrint.regimen}</p>
              )}
            </div>
            <div className="text-right">
              <div className="border-2 border-gray-800 px-4 py-2 rounded">
                <p className="text-xs font-medium text-gray-500 uppercase">Factura de Venta</p>
                <p className="text-2xl font-bold text-gray-900 font-mono">{factura.prefijo}{factura.numero}</p>
              </div>
              <p className="text-sm text-gray-600 mt-2">Fecha: <strong>{formatFecha(factura.fecha)}</strong></p>
              {factura.fecha_vencimiento && (
                <p className="text-sm text-gray-600">Vence: <strong>{formatFecha(String(factura.fecha_vencimiento))}</strong></p>
              )}
            </div>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Cliente</p>
            <p className="font-bold text-gray-900">{cliente?.razon_social ?? '—'}</p>
            {cliente?.numero_documento && (
              <p className="text-sm text-gray-600">{cliente.tipo_documento ?? 'CC'}: {cliente.numero_documento}</p>
            )}
            {cliente?.email && <p className="text-sm text-gray-600">{cliente.email}</p>}
            {cliente?.telefono && <p className="text-sm text-gray-600">Tel: {cliente.telefono}</p>}
          </div>

          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b-2 border-gray-800">
                <th className="pb-2 text-left font-semibold text-gray-700">Descripción</th>
                <th className="pb-2 text-right font-semibold text-gray-700 w-16">Cant.</th>
                <th className="pb-2 text-right font-semibold text-gray-700 w-24">P. Unit.</th>
                <th className="pb-2 text-right font-semibold text-gray-700 w-16">Dcto%</th>
                <th className="pb-2 text-right font-semibold text-gray-700 w-16">IVA%</th>
                <th className="pb-2 text-right font-semibold text-gray-700 w-24">Total</th>
              </tr>
            </thead>
            <tbody>
              {lineas.map((linea, index) => (
                <tr key={linea.id ?? index} className="border-b border-gray-100">
                  <td className="py-2">
                    <p className="text-gray-900">{linea.producto?.descripcion ?? linea.descripcion ?? '—'}</p>
                    {linea.producto?.codigo && <p className="text-xs text-gray-400 font-mono">{linea.producto.codigo}</p>}
                  </td>
                  <td className="py-2 text-right text-gray-700">{linea.cantidad}</td>
                  <td className="py-2 text-right font-mono text-gray-700">{formatCOP(linea.precio_unitario)}</td>
                  <td className="py-2 text-right text-gray-500">
                    {linea.descuento_porcentaje > 0 ? `${linea.descuento_porcentaje}%` : '—'}
                  </td>
                  <td className="py-2 text-right text-gray-500">{linea.impuesto?.porcentaje ?? 0}%</td>
                  <td className="py-2 text-right font-mono font-medium text-gray-900">{formatCOP(linea.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-mono">{formatCOP(factura.subtotal)}</span>
              </div>
              {factura.total_descuento > 0 && (
                <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                  <span className="text-gray-600">Descuento</span>
                  <span className="font-mono text-red-600">-{formatCOP(factura.total_descuento)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                <span className="text-gray-600">IVA</span>
                <span className="font-mono">{formatCOP(factura.total_iva)}</span>
              </div>
              <div className="flex justify-between text-base font-bold py-2 border-t-2 border-gray-800 mt-1">
                <span>TOTAL</span>
                <span className="font-mono">{formatCOP(factura.total)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
            <div>
              {(factura.forma_pago as { descripcion?: string } | null) && (
                <p className="text-gray-600">
                  <strong>Forma de pago:</strong> {(factura.forma_pago as { descripcion?: string }).descripcion}
                </p>
              )}
              {factura.observaciones && (
                <p className="text-gray-500 mt-1 italic">{factura.observaciones}</p>
              )}
            </div>
            <div>
              {recibos.length > 0 && (
                <>
                  <p className="font-semibold text-gray-700 mb-1">Pagos registrados:</p>
                  {recibos.map((recibo) => (
                    <div key={recibo.id} className="flex justify-between text-xs text-gray-600">
                      <span>{formatFecha(recibo.fecha)} — {recibo.forma_pago?.descripcion ?? '—'}</span>
                      <span className="font-mono">{formatCOP(recibo.valor)}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 mt-12 pt-6 border-t border-gray-200 text-xs text-center text-gray-400">
            <div>
              <div className="border-b border-gray-300 mb-1 pb-4"></div>
              <p>Firma autorizada</p>
            </div>
            <div>
              <div className="border-b border-gray-300 mb-1 pb-4"></div>
              <p>Firma cliente / recibí conforme</p>
            </div>
            <div className="flex justify-center">
              <QRDocumento url={validationUrl} size={72} label="Validar factura" />
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Generado por ClovEnt · {empresaPrint?.nombre ?? 'EMPRESA'} · {new Date().toLocaleDateString('es-CO')}
          </p>
        </div>
      ) : (
        <ThermalFacturaDocument
          factura={factura}
          empresa={empresaPrint}
          cliente={cliente}
          lineas={lineas}
          recibos={recibos}
          formato={formato}
          validationUrl={validationUrl}
        />
      )}
    </div>
  )
}
