import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveRoleById, type AppRole } from '@/lib/auth/permissions'

type UsuarioContextRow = {
  id: string
  nombre: string
  empresa_id: string
  rol_id: string | null
  activo: boolean
  debe_cambiar_password: boolean
  empresas: { nombre: string } | { nombre: string }[] | null
}

export interface UsuarioContext {
  id: string
  nombre: string
  empresa_id: string
  rol: AppRole
  empresa_nombre?: string
  debe_cambiar_password: boolean
  tiene_multi_empresa: boolean
}

function getEmpresaNombre(empresas: UsuarioContextRow['empresas']) {
  const empresa = Array.isArray(empresas) ? empresas[0] : empresas
  return empresa?.nombre ?? undefined
}

export async function getUsuarioContext(
  supabase: Pick<SupabaseClient, 'from'>,
  userId: string,
  options: { includeMemberships?: boolean } = {}
): Promise<UsuarioContext | null> {
  const [usuario, memberships] = await Promise.all([
    supabase
      .from('usuarios')
      .select('id, nombre, empresa_id, rol_id, activo, debe_cambiar_password, empresas(nombre)')
      .eq('id', userId)
      .single(),
    options.includeMemberships === false
      ? Promise.resolve({ data: null })
      : supabase.from('usuario_empresas').select('empresa_id')
        .eq('usuario_id', userId).eq('activo', true).limit(2)
        .then(result => result, () => ({ data: null })),
  ])
  const { data, error } = usuario

  if (error || !data) return null

  const row = data as UsuarioContextRow
  if (!row.activo) return null

  const rol = resolveRoleById(row.rol_id)
  if (!rol) return null

  const tieneMultiEmpresa = (memberships.data?.length ?? 0) > 1

  return {
    id: row.id,
    nombre: row.nombre,
    empresa_id: row.empresa_id,
    rol,
    empresa_nombre: getEmpresaNombre(row.empresas),
    debe_cambiar_password: row.debe_cambiar_password ?? false,
    tiene_multi_empresa: tieneMultiEmpresa,
  }
}
