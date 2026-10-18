export const dynamic = 'force-dynamic'

import { PantallaPOS } from '@/components/pos/PantallaPOS'
import { getBodegas, getImpuestos } from '@/lib/db/productos'
import { getColaboradores, getFormasPago } from '@/lib/db/maestros'

export default async function POSPage() {
  const [bodegas, formasPago, impuestos, colaboradores] = await Promise.all([
    getBodegas(),
    getFormasPago(),
    getImpuestos(),
    getColaboradores(),
  ])

  return (
    <PantallaPOS
      bodegas={bodegas}
      formasPago={formasPago}
      impuestos={impuestos}
      colaboradores={colaboradores}
    />
  )
}
