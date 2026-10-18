import test from 'node:test'
import assert from 'node:assert/strict'
import {
  EMPRESA_CONFIG_UPDATE_FIELDS,
  EMPRESA_FACTURA_SELECT_FIELDS,
  buildColaboradorLookupTerms,
  resolveFacturaColaboradorId,
} from '../../src/lib/billing/guardrails'

test('facturacion no consulta columnas opcionales ausentes en produccion', () => {
  assert.equal(EMPRESA_FACTURA_SELECT_FIELDS.includes('plantilla_pdf' as never), false)
})

test('configuracion de empresa no intenta actualizar columnas ausentes en produccion', () => {
  assert.equal(EMPRESA_CONFIG_UPDATE_FIELDS.includes('plantilla_pdf' as never), false)
})

test('busqueda de colaborador limpia email y nombre del vendedor', () => {
  assert.deepEqual(
    buildColaboradorLookupTerms({
      email: '  martha@example.com ',
      nombre: '  Martha Jurado  ',
    }),
    {
      email: 'martha@example.com',
      nombre: 'Martha Jurado',
    }
  )
})

test('vendedor puede facturar aunque no tenga colaborador asociado', () => {
  assert.equal(resolveFacturaColaboradorId({
    rol: 'vendedor',
    requestedColaboradorId: 'colaborador-seleccionado',
    matchedColaboradorId: null,
  }), null)
})

test('admin conserva colaborador seleccionado manualmente', () => {
  assert.equal(resolveFacturaColaboradorId({
    rol: 'admin',
    requestedColaboradorId: 'colaborador-seleccionado',
    matchedColaboradorId: null,
  }), 'colaborador-seleccionado')
})
