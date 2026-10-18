import test from 'node:test'
import assert from 'node:assert/strict'
import { ACCOUNTING_ROLES, canAccessModule, getApiRouteAccess } from '../../src/lib/auth/permissions'

test('vendedor no tiene acceso de gestión a contabilidad', () => {
  assert.equal(canAccessModule('vendedor', 'contabilidad', 'manage'), false)
  assert.equal(canAccessModule('vendedor', 'ventas', 'manage'), true)
})

test('selector de productos de ventas usa permisos de ventas', () => {
  assert.deepEqual(getApiRouteAccess('/api/ventas/productos-selector', 'GET'), {
    module: 'ventas',
    scope: 'read',
  })
  assert.equal(canAccessModule('vendedor', 'ventas'), true)
})

test('solo admin y contador pueden ejecutar acciones contables críticas', () => {
  assert.deepEqual([...ACCOUNTING_ROLES], ['admin', 'contador'])
})

test('la importacion de factura electronica usa permisos de compras', () => {
  assert.deepEqual(getApiRouteAccess('/api/import/factura-electronica/parse', 'POST'), {
    module: 'compras',
    scope: 'manage',
  })
  assert.deepEqual(getApiRouteAccess('/api/import/factura-electronica/confirmar', 'POST'), {
    module: 'compras',
    scope: 'manage',
  })
})

test('otros imports siguen usando permisos de configuracion', () => {
  assert.deepEqual(getApiRouteAccess('/api/import/productos', 'POST'), {
    module: 'configuracion',
    scope: 'manage',
  })
})
