import { createClient } from '@/lib/supabase/server'
import { buildColaboradorLookupTerms } from '@/lib/billing/guardrails'
import { getSession } from '@/lib/auth/session'
import { cache } from 'react'

function ordenarFormasPago<T extends { descripcion?: string | null }>(formas: T[]) {
  return [...formas].sort((a, b) => {
    const descA = (a.descripcion ?? '').trim()
    const descB = (b.descripcion ?? '').trim()
    const esEfectivoA = descA.localeCompare('Efectivo', 'es', { sensitivity: 'base' }) === 0
    const esEfectivoB = descB.localeCompare('Efectivo', 'es', { sensitivity: 'base' }) === 0

    if (esEfectivoA !== esEfectivoB) return esEfectivoA ? -1 : 1
    return descA.localeCompare(descB, 'es', { sensitivity: 'base' })
  })
}

export const getFormasPago = cache(async function getFormasPago() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('formas_pago')
    .select('*')
    .eq('activa', true)
    .order('descripcion')
  if (error) throw error
  return ordenarFormasPago(data ?? [])
})

export const getEjercicioActivo = cache(async function getEjercicioActivo() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ejercicios')
    .select('*')
    .eq('estado', 'activo')
    .order('año', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error && error.code !== 'PGRST116') throw error
  return data ?? null
})

export async function getColaboradores() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('colaboradores')
    .select('*')
    .eq('activo', true)
    .order('nombre')
  if (error) throw error
  return data ?? []
}

export async function getColaboradorIdForUsuario(
  userId: string,
  email?: string | null,
  nombre?: string | null
): Promise<string | null> {
  const supabase = await createClient()

  const { data: linked, error: linkedError } = await supabase
    .from('colaboradores')
    .select('id')
    .eq('activo', true)
    .eq('usuario_id', userId)
    .maybeSingle()
  if (linkedError) throw linkedError
  if (linked?.id) return linked.id

  const terms = buildColaboradorLookupTerms({ email, nombre })
  const normalizedEmail = terms.email
  if (normalizedEmail) {
    const { data: matched, error: matchedError } = await supabase
      .from('colaboradores')
      .select('id')
      .eq('activo', true)
      .is('usuario_id', null)
      .ilike('email', normalizedEmail)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (matchedError) throw matchedError
    if (matched?.id) return matched.id
  }

  const normalizedName = terms.nombre
  if (!normalizedName) return null

  const { data: named, error: namedError } = await supabase
    .from('colaboradores')
    .select('id')
    .eq('activo', true)
    .is('usuario_id', null)
    .ilike('nombre', normalizedName)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (namedError) throw namedError

  return named?.id ?? null
}

export async function getCuentasPUC() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cuentas_puc')
    .select('*')
    .eq('activa', true)
    .order('codigo')
  if (error) throw error
  return data ?? []
}

export async function getEmpresaId(): Promise<string> {
  const session = await getSession()
  if (!session) throw new Error('No autenticado')
  return session.empresa_id
}
