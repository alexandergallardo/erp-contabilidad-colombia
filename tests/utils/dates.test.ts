import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatLongDateInAppTimeZone } from '../../src/lib/utils/dates'

test('la cabecera conserva el dia colombiano cuando el servidor ya cambio de fecha en UTC', () => {
  assert.equal(
    formatLongDateInAppTimeZone(new Date('2026-10-15T03:00:00Z')),
    'miércoles, 14 de octubre de 2026',
  )
})

test('la fecha colombiana cambia de dia y de anio a las 05:00 UTC', () => {
  assert.equal(
    formatLongDateInAppTimeZone(new Date('2027-01-01T04:59:59Z')),
    'jueves, 31 de diciembre de 2026',
  )
  assert.equal(
    formatLongDateInAppTimeZone(new Date('2027-01-01T05:00:00Z')),
    'viernes, 1 de enero de 2027',
  )
})
