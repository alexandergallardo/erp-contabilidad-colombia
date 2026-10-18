import test from 'node:test'
import assert from 'node:assert/strict'
import { readFacturaElectronicaInput } from '../../src/lib/import/factura-electronica'

test('PDF reader retains its worker and extracts a real PDF text layer', async () => {
  const stream = 'BT /F1 12 Tf 50 700 Td (Codigo AD05) Tj ET'
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = objects.map((object, i) => {
    const offset = pdf.length
    pdf += `${i + 1} 0 obj\n${object}\nendobj\n`
    return offset
  })
  const start = pdf.length
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.map(n => `${String(n).padStart(10, '0')} 00000 n \n`).join('')}`
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`
  const result = await readFacturaElectronicaInput(new File([pdf], 'qa.pdf', { type: 'application/pdf' }))
  assert.equal(result.sourceType, 'pdf')
  assert.equal(result.pdfText, 'Codigo AD05')
  assert.equal(result.pdfPages?.length, 1)
})
