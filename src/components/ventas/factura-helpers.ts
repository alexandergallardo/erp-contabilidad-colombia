import type { Bodega, Impuesto } from '@/types'

export interface FacturaFormaPago {
  id: string
  descripcion: string
  tipo?: string | null
  dias_vencimiento?: number | null
}

export interface FacturaColaborador {
  id: string
  nombre: string
}

export interface FacturaProductoOption {
  id: string
  codigo?: string | null
  descripcion?: string | null
  precio_venta?: number | null
  impuesto_id?: string | null
}

export interface FacturaLinea {
  producto_id: string
  producto_codigo: string
  descripcion: string
  cantidad: number
  precio_unitario: number
  descuento_valor: number
  impuesto_id: string
  iva_pct: number
}

export function calcLinea(linea: FacturaLinea) {
  const subtotal = linea.cantidad * linea.precio_unitario
  const descuento = Math.min(linea.descuento_valor, subtotal)
  const base = subtotal - descuento
  const iva = base * (linea.iva_pct / 100)
  return { subtotal, descuento, iva, total: base + iva }
}

export function descuentoToPct(linea: FacturaLinea): number {
  const subtotal = linea.cantidad * linea.precio_unitario
  if (subtotal <= 0 || linea.descuento_valor <= 0) return 0
  return Math.round(((linea.descuento_valor / subtotal) * 100) * 10000) / 10000
}

export function formatProductoLabel(producto: { codigo?: string | null; descripcion?: string | null }) {
  return [producto.codigo, producto.descripcion].filter(Boolean).join(' · ')
}

export function createEmptyFacturaLinea(impuestos: Impuesto[]): FacturaLinea {
  const impuestoBase = impuestos[0]
  return {
    producto_id: '',
    producto_codigo: '',
    descripcion: '',
    cantidad: 1,
    precio_unitario: 0,
    descuento_valor: 0,
    impuesto_id: impuestoBase?.id ?? '',
    iva_pct: impuestoBase?.porcentaje ?? 0,
  }
}

export function applyProductoToLinea(
  linea: FacturaLinea,
  producto: FacturaProductoOption,
  impuestos: Impuesto[]
): FacturaLinea {
  const impuesto = impuestos.find((item) => item.id === producto.impuesto_id) ?? impuestos[0]
  return {
    ...linea,
    producto_id: producto.id,
    producto_codigo: producto.codigo ?? '',
    descripcion: producto.descripcion ?? '',
    precio_unitario: Number(producto.precio_venta ?? 0),
    impuesto_id: impuesto?.id ?? '',
    iva_pct: impuesto?.porcentaje ?? 0,
  }
}

export function clearProductoFromLinea(linea: FacturaLinea): FacturaLinea {
  return {
    ...linea,
    producto_id: '',
    producto_codigo: '',
    descripcion: '',
    precio_unitario: 0,
  }
}

export function updateLineaTotal(linea: FacturaLinea, nuevoTotal: number): FacturaLinea {
  const qty = linea.cantidad || 1
  const ivaMult = 1 + (linea.iva_pct / 100)
  const base = nuevoTotal / ivaMult
  const precioUnitario = (base + linea.descuento_valor) / qty
  return { ...linea, precio_unitario: Math.round(precioUnitario * 100) / 100 }
}

export function getDefaultBodegaId(bodegas: Bodega[]) {
  return bodegas.find((bodega) => bodega.principal)?.id ?? bodegas[0]?.id ?? ''
}
