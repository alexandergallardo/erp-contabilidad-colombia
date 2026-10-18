import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getEmpresasAccesoUsuario } from '@/lib/auth/empresas-acceso'
import { toErrorMsg } from '@/lib/utils/errors'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const empresas = await getEmpresasAccesoUsuario(session.id, session.empresa_id)

    return NextResponse.json(empresas)
  } catch (e: unknown) {
    return NextResponse.json({ error: toErrorMsg(e) }, { status: 500 })
  }
}
