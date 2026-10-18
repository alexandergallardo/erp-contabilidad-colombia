import { createServiceClient } from '@/lib/supabase/service'
import { EMPRESA_FACTURA_SELECT } from '@/lib/billing/guardrails'

export type EmpresaPublica = {
  id?: string | null
  nombre?: string | null
  nit?: string | null
  dv?: string | null
  razon_social?: string | null
  direccion?: string | null
  ciudad?: string | null
  departamento?: string | null
  telefono?: string | null
  email?: string | null
  regimen?: string | null
  plantilla_pdf?: string | null
}

export type FacturaPublicaLinea = {
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

export type FacturaPublica = {
  id: string
  empresa_id: string
  tipo: string
  prefijo?: string | null
  numero: number
  fecha: string
  fecha_vencimiento?: string | null
  subtotal: number
  total_iva: number
  total_descuento: number
  total: number
  estado?: string | null
  cufe?: string | null
  dian_estado?: string | null
  created_at?: string | null
  cliente?: {
    razon_social?: string | null
    numero_documento?: string | null
    tipo_documento?: string | null
  } | null
  forma_pago?: { descripcion?: string | null; tipo?: string | null } | null
  lineas?: FacturaPublicaLinea[]
}

const EMPRESA_SELECT = EMPRESA_FACTURA_SELECT

export async function getEmpresaPublicaById(empresaId?: string | null): Promise<EmpresaPublica | null> {
  if (!empresaId) return null

  const admin = createServiceClient()
  const { data, error } = await admin
    .from('empresas')
    .select(EMPRESA_SELECT)
    .eq('id', empresaId)
    .maybeSingle()

  if (error) throw error
  return (data ?? null) as EmpresaPublica | null
}

export async function getFacturaPublicaById(id: string): Promise<FacturaPublica | null> {
  const admin = createServiceClient()
  const { data, error } = await admin
    .from('documentos')
    .select(`
      id, empresa_id, tipo, prefijo, numero, fecha, fecha_vencimiento,
      subtotal, total_iva, total_descuento, total, estado, cufe, dian_estado, created_at,
      cliente:clientes(razon_social, numero_documento, tipo_documento),
      forma_pago:formas_pago(descripcion, tipo),
      lineas:documentos_lineas(
        id, descripcion, cantidad, precio_unitario, descuento_porcentaje, subtotal, total_iva, total,
        producto:productos(codigo, descripcion),
        impuesto:impuestos(porcentaje)
      )
    `)
    .eq('id', id)
    .eq('tipo', 'factura_venta')
    .maybeSingle()

  if (error) throw error
  return (data ?? null) as FacturaPublica | null
}

export function formatEmpresaPublicaDireccion(empresa: EmpresaPublica | null) {
  return [empresa?.direccion, empresa?.ciudad, empresa?.departamento].filter(Boolean).join(' · ') || '—'
}
