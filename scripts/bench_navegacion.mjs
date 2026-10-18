import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { smokeNavigation } from './smoke_navegacion.mjs'

// Read-only page requests. Temporary login sessions are kept in memory and revoked.
const base = process.env.BENCH_BASE_URL || 'https://www.clovent.co'
const company = process.env.BENCH_EMPRESA || 'Bella y Saludable'
const output = process.argv[2]
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const { data: empresa, error } = await admin.from('empresas').select('id').eq('nombre', company).single()
if (error) throw error
const { data: users, error: usersError } = await admin.from('usuarios')
  .select('id,email,rol:roles(nombre)').eq('empresa_id', empresa.id).eq('activo', true)
  .eq('debe_cambiar_password', false)
if (usersError) throw usersError
const roles = ['admin', 'vendedor']
if (process.env.BENCH_SUPERADMIN === '1') {
  const { data, error } = await admin.from('usuarios').select('id,email,rol:roles!inner(nombre)')
    .eq('activo', true).eq('rol.nombre', 'superadmin').limit(1)
  if (error) throw error
  users.push(...data)
  roles.push('superadmin')
}

const results = []
for (const role of roles) {
  const user = users.find(u => u.rol?.nombre === role)
  if (!user) throw new Error(`No hay usuario disponible para ${role}`)
  const cookies = new Map()
  const client = createServerClient(url, key, { cookies: {
    getAll: () => Array.from(cookies, ([name, value]) => ({ name, value })),
    setAll: values => values.forEach(({ name, value }) => cookies.set(name, value)),
  } })
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: 'magiclink', email: user.email })
  if (linkError) throw linkError
  const { error: loginError } = await client.auth.verifyOtp({
    type: 'magiclink', token_hash: link.properties.hashed_token,
  })
  if (loginError) throw loginError
  try {
    const paths = role === 'superadmin'
      ? ['/superadmin', '/superadmin/empresas', '/superadmin/usuarios']
      : process.env.BENCH_ONLY_SMOKE === '1' ? [] : ['/dashboard', '/productos', '/ventas/facturas', '/ventas/facturas/nueva', '/pos']
    for (const path of paths) {
      const samples = []
      for (let run = 0; run < 3; run++) {
        const started = performance.now()
        const response = await fetch(`${base}${path}`, {
          redirect: 'manual', signal: AbortSignal.timeout(60000),
          headers: { Cookie: Array.from(cookies, ([k, v]) => `${k}=${v}`).join('; ') },
        })
        const ttfb = performance.now() - started
        const html = await response.text()
        if (!response.ok || html.includes('NEXT_HTTP_ERROR_FALLBACK;') || /:E\{"digest":/.test(html)) {
          throw new Error(`${role} ${path}: HTTP ${response.status} o error de renderizado`)
        }
        samples.push({ ttfb: Math.round(ttfb), total: Math.round(performance.now() - started), bytes: Buffer.byteLength(html) })
      }
      const result = { role, path, first: samples[0], medianMs: samples.map(s => s.total).sort((a,b) => a-b)[1], samples }
      results.push(result)
      console.log(JSON.stringify(result))
    }
    if (process.env.BENCH_SMOKE === '1' && role !== 'superadmin') await smokeNavigation({ base, role, cookies })
  } finally {
    await client.auth.signOut({ scope: 'local' })
  }
}
if (output) {
  await mkdir(dirname(output), { recursive: true })
  await writeFile(output, JSON.stringify({ base, measuredAt: new Date().toISOString(), results }, null, 2))
}
