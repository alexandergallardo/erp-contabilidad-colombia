import { NextRequest, NextResponse } from 'next/server'
import { getSession, puedeAcceder } from '@/lib/auth/session'
import { getProductos } from '@/lib/db/productos'
import { toErrorMsg } from '@/lib/utils/errors'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    if (!puedeAcceder(session.rol, 'ventas')) {
      return NextResponse.json({ error: 'Sin permisos para ventas' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const result = await getProductos({
      busqueda: searchParams.get('q') ?? searchParams.get('busqueda') ?? undefined,
      familia_id: searchParams.get('familia_id') ?? undefined,
      fabricante_id: searchParams.get('fabricante_id') ?? undefined,
      activo: searchParams.get('activo') === 'false' ? false : true,
      limit: parseInt(searchParams.get('limit') ?? '50'),
      offset: parseInt(searchParams.get('offset') ?? '0'),
      select_mode: 'selector',
      include_total: searchParams.get('include_total') === 'false' ? false : undefined,
    })

    return NextResponse.json(result)
  } catch (e: unknown) {
    return NextResponse.json({ error: toErrorMsg(e) }, { status: 500 })
  }
}
