import test from 'node:test'
import assert from 'node:assert/strict'
import { mapEmpresasAccesoRows } from '../../src/lib/auth/empresas-acceso'
import { ROLE_IDS } from '../../src/lib/auth/permissions'

test('multiempresa resuelve cada nombre por empresa_id y no por la empresa activa', () => {
  const empresas = mapEmpresasAccesoRows(
    [
      {
        empresa_id: '11111111-1111-1111-1111-111111111111',
        rol_id: ROLE_IDS.contador,
        es_principal: true,
      },
      {
        empresa_id: '22222222-2222-2222-2222-222222222222',
        rol_id: ROLE_IDS.contador,
        es_principal: false,
      },
    ],
    new Map([
      ['11111111-1111-1111-1111-111111111111', {
        id: '11111111-1111-1111-1111-111111111111',
        nombre: 'Empresa principal',
        nit: '900111111',
      }],
      ['22222222-2222-2222-2222-222222222222', {
        id: '22222222-2222-2222-2222-222222222222',
        nombre: 'Empresa alterna',
        nit: '900222222',
      }],
    ]),
    '11111111-1111-1111-1111-111111111111'
  )

  assert.deepEqual(empresas.map((empresa) => empresa.nombre), [
    'Empresa principal',
    'Empresa alterna',
  ])
  assert.equal(empresas[0].es_activa, true)
  assert.equal(empresas[1].es_activa, false)
  assert.equal(empresas[1].rol_label, 'Contador')
})

test('multiempresa conserva fallback por id solo cuando no hay fila de empresa', () => {
  const [empresa] = mapEmpresasAccesoRows(
    [
      {
        empresa_id: '33333333-3333-3333-3333-333333333333',
        rol_id: ROLE_IDS.contador,
        es_principal: false,
      },
    ],
    new Map(),
    '11111111-1111-1111-1111-111111111111'
  )

  assert.equal(empresa.nombre, 'Empresa 33333333')
})
