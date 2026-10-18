export type FacturaPrintFormat = 'normal' | 'termica-80' | 'termica-58'

export const FACTURA_PRINT_OPTIONS: Array<{
  value: FacturaPrintFormat
  label: string
  shortLabel: string
}> = [
  { value: 'normal', label: 'Normal', shortLabel: 'Normal' },
  { value: 'termica-80', label: 'Termica 80 mm', shortLabel: '80 mm' },
  { value: 'termica-58', label: 'Termica 58 mm', shortLabel: '58 mm' },
]

export function normalizeFacturaPrintFormat(value?: string | null): FacturaPrintFormat {
  return FACTURA_PRINT_OPTIONS.some((option) => option.value === value)
    ? (value as FacturaPrintFormat)
    : 'normal'
}

export function buildFacturaPrintHref(id: string, formato: FacturaPrintFormat = 'normal') {
  return formato === 'normal'
    ? `/print/factura/${id}`
    : `/print/factura/${id}?formato=${formato}`
}
