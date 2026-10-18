import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/055_facturacion_integridad_contable_y_tenant.sql'),
  'utf8'
)

test('el asiento de venta reconoce ingreso neto y conserva el balance', () => {
  assert.match(
    migration,
    /v_ingreso_neto := ROUND\(COALESCE\(v_doc\.total, 0\) - COALESCE\(v_doc\.total_iva, 0\), 2\)/
  )
  assert.match(
    migration,
    /VALUES \(v_asiento_id, v_cuenta_ingresos_id, 'Ingresos por ventas', 0, v_ingreso_neto\)/
  )
})

test('la RPC de facturacion valida todas las referencias multiempresa', () => {
  for (const table of [
    'ejercicios',
    'clientes',
    'bodegas',
    'formas_pago',
    'colaboradores',
    'productos',
    'impuestos',
    'producto_variantes',
  ]) {
    assert.match(migration, new RegExp(`FROM ${table}\\b|JOIN ${table}\\b`))
  }

  assert.match(migration, /USING ERRCODE = '42501'/)
})
