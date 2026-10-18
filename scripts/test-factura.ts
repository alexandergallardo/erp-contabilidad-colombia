import { getFacturaById, getFacturas } from '../src/lib/db/ventas'

async function run() {
  try {
    const facturas = await getFacturas({ limit: 1 })
    if (facturas.facturas.length > 0) {
      const id = facturas.facturas[0].id
      console.log('Testing id:', id)
      const factura = await getFacturaById(id)
      console.log('Success!', factura.id)
    } else {
      console.log('No facturas found')
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

run()
