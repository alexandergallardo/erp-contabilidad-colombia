import test from 'node:test'
import assert from 'node:assert/strict'
import { getUsuarioContext } from '../../src/lib/auth/user-context'
import { ROLE_IDS } from '../../src/lib/auth/permissions'

const usuario = {
  id: 'user-a', nombre: 'Usuario', empresa_id: 'empresa-a', rol_id: ROLE_IDS.vendedor,
  activo: true, debe_cambiar_password: false, empresas: { nombre: 'Empresa A' },
}

type TestUsuario = Omit<typeof usuario, 'rol_id'> & { rol_id: string }

function client(options: { row?: TestUsuario | null; count?: number; rejected?: boolean } = {}) {
  const calls: Array<[string, ...unknown[]]> = []
  const from = (table: string) => {
    calls.push(['from', table])
    const query = {
      select: (...args: unknown[]) => { calls.push(['select', ...args]); return query },
      eq: (...args: unknown[]) => { calls.push(['eq', ...args]); return query },
      single: () => Promise.resolve({ data: options.row === undefined ? usuario : options.row, error: null }),
      limit: (limit: number) => {
        calls.push(['limit', limit])
        return options.rejected ? Promise.reject(new Error('Unavailable')) : Promise.resolve({
          data: Array.from({ length: Math.min(options.count ?? 1, limit) }, () => ({ empresa_id: 'empresa' })),
        })
      },
    }
    return query
  }
  return { supabase: { from } as unknown as Parameters<typeof getUsuarioContext>[0], calls }
}

test('proxy omits membership lookup but still validates user and role', async () => {
  const { supabase, calls } = client()
  const result = await getUsuarioContext(supabase, usuario.id, { includeMemberships: false })
  assert.equal(result?.rol, 'vendedor')
  assert.equal(result?.empresa_id, 'empresa-a')
  assert.equal(result?.tiene_multi_empresa, false)
  assert.deepEqual(calls.filter(c => c[0] === 'from'), [['from', 'usuarios']])
  assert.ok(calls.some(c => c[0] === 'eq' && c[1] === 'id' && c[2] === usuario.id))
})

test('session detects multiple active memberships with at most two rows', async () => {
  for (const count of [0, 1, 2, 5]) {
    const { supabase, calls } = client({ count })
    assert.equal((await getUsuarioContext(supabase, usuario.id))?.tiene_multi_empresa, count > 1)
    assert.ok(calls.some(c => c[0] === 'limit' && c[1] === 2))
    assert.ok(calls.some(c => c[0] === 'eq' && c[1] === 'activo' && c[2] === true))
  }
})

test('inactive, missing and unknown-role users remain denied', async () => {
  for (const row of [null, { ...usuario, activo: false }, { ...usuario, rol_id: 'unknown' }]) {
    for (const includeMemberships of [true, false]) {
      const { supabase } = client({ row })
      assert.equal(await getUsuarioContext(supabase, usuario.id, { includeMemberships }), null)
    }
  }
})

test('membership failure does not invalidate an otherwise valid session', async () => {
  const { supabase } = client({ rejected: true })
  assert.equal((await getUsuarioContext(supabase, usuario.id))?.empresa_id, 'empresa-a')
})
