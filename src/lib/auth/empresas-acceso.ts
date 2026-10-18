import { ROLE_LABELS, resolveRoleById, type AppRole } from '@/lib/auth/permissions'
import { createServiceClient } from '@/lib/supabase/service'

type EmpresaJoin = {
  id?: string
  nombre?: string | null
  nit?: string | null
} | {
  id?: string
  nombre?: string | null
  nit?: string | null
}[] | null

type EmpresaAccesoRow = {
  empresa_id: string
  rol_id: string | null
  es_principal: boolean | null
  empresas?: EmpresaJoin
}

type EmpresaRow = {
  id: string
  nombre?: string | null
  nit?: string | null
}

export interface EmpresaAccesoInfo {
  empresa_id: string
  nombre: string
  nit: string
  rol: AppRole | 'solo_lectura'
  rol_label: string
  es_principal: boolean
  es_activa: boolean
}

function getEmpresaJoin(row: EmpresaJoin) {
  return Array.isArray(row) ? row[0] : row
}

function getEmpresaNombre(empresa: EmpresaRow | ReturnType<typeof getEmpresaJoin>, empresaId: string) {
  const nombre = empresa?.nombre?.trim()
  return nombre || `Empresa ${empresaId.slice(0, 8)}`
}

export function mapEmpresasAccesoRows(
  rows: EmpresaAccesoRow[],
  empresasById: Map<string, EmpresaRow>,
  empresaActiva: string
): EmpresaAccesoInfo[] {
  return rows.map((row) => {
    const empresa = empresasById.get(row.empresa_id) ?? getEmpresaJoin(row.empresas ?? null)
    const rol = resolveRoleById(row.rol_id)

    return {
      empresa_id: row.empresa_id,
      nombre: getEmpresaNombre(empresa, row.empresa_id),
      nit: empresa?.nit?.trim() ?? '',
      rol: rol ?? 'solo_lectura',
      rol_label: rol ? ROLE_LABELS[rol] : 'Sin rol',
      es_principal: Boolean(row.es_principal),
      es_activa: row.empresa_id === empresaActiva,
    }
  })
}

export async function getEmpresasAccesoUsuario(
  userId: string,
  empresaActiva: string
): Promise<EmpresaAccesoInfo[]> {
  const service = createServiceClient()

  const { data, error } = await service
    .from('usuario_empresas')
    .select('empresa_id, rol_id, es_principal')
    .eq('usuario_id', userId)
    .eq('activo', true)
    .order('es_principal', { ascending: false })

  if (error) throw error

  const rows = (data ?? []) as EmpresaAccesoRow[]
  const empresaIds = [...new Set(rows.map((row) => row.empresa_id).filter(Boolean))]

  const { data: empresas, error: empresasError } = empresaIds.length > 0
    ? await service
      .from('empresas')
      .select('id, nombre, nit')
      .in('id', empresaIds)
    : { data: [], error: null }

  if (empresasError) throw empresasError

  const empresasById = new Map(
    ((empresas ?? []) as EmpresaRow[]).map((empresa) => [empresa.id, empresa])
  )

  return mapEmpresasAccesoRows(rows, empresasById, empresaActiva)
}
