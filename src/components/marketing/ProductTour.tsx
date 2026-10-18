'use client'

import { useState, type KeyboardEvent } from 'react'
import { BarChart3, Box, Calculator, CreditCard, FileText, Receipt, Users } from 'lucide-react'

const modules = [
  { id: 'ventas', label: 'Ventas', icon: BarChart3, title: 'Cada venta, en su lugar.', metric: 'Ventas del mes', value: '$ 12.480.000', secondary: 'Por cobrar', secondaryValue: '$ 1.240.000', columns: ['Documento', 'Cliente', 'Estado', 'Total'], rows: [['FV-00128', 'Cliente de ejemplo A', 'Pagada', '$ 320.000'], ['FV-00127', 'Cliente de ejemplo B', 'Pendiente', '$ 185.000'], ['FV-00126', 'Consumidor final', 'Pagada', '$ 96.000']] },
  { id: 'inventario', label: 'Inventario', icon: Box, title: 'Existencias claras. Decisiones a tiempo.', metric: 'Artículos activos', value: '248', secondary: 'Stock bajo', secondaryValue: '8 artículos', columns: ['Código', 'Producto', 'Bodega', 'Disponible'], rows: [['PR-001', 'Producto de ejemplo A', 'Principal', '42 und.'], ['PR-002', 'Producto de ejemplo B', 'Principal', '18 und.'], ['PR-003', 'Producto de ejemplo C', 'Sucursal', '6 und.']] },
  { id: 'compras', label: 'Compras', icon: FileText, title: 'Tu próxima compra, con contexto.', metric: 'Compras del mes', value: '$ 6.320.000', secondary: 'Por pagar', secondaryValue: '$ 840.000', columns: ['Documento', 'Proveedor', 'Estado', 'Total'], rows: [['FC-00042', 'Proveedor de ejemplo A', 'Pagada', '$ 640.000'], ['FC-00041', 'Proveedor de ejemplo B', 'Pendiente', '$ 840.000'], ['FC-00040', 'Proveedor de ejemplo C', 'Pagada', '$ 280.000']] },
  { id: 'contabilidad', label: 'Contabilidad', icon: Calculator, title: 'Cuentas claras para avanzar.', metric: 'Débitos', value: '$ 18.800.000', secondary: 'Créditos', secondaryValue: '$ 18.800.000', columns: ['Asiento', 'Concepto', 'Estado', 'Valor'], rows: [['AS-00085', 'Venta de mercancía', 'Contabilizado', '$ 320.000'], ['AS-00084', 'Compra de inventario', 'Contabilizado', '$ 640.000'], ['AS-00083', 'Recibo de caja', 'Contabilizado', '$ 185.000']] },
  { id: 'pos', label: 'POS', icon: CreditCard, title: 'El ritmo de tu punto de venta.', metric: 'Venta actual', value: '$ 116.000', secondary: 'Artículos', secondaryValue: '3 unidades', columns: ['Código', 'Producto', 'Cantidad', 'Total'], rows: [['PR-001', 'Producto de ejemplo A', '1', '$ 48.000'], ['PR-002', 'Producto de ejemplo B', '1', '$ 36.000'], ['PR-003', 'Producto de ejemplo C', '1', '$ 32.000']] },
  { id: 'usuarios', label: 'Usuarios', icon: Users, title: 'Un equipo conectado, cada rol definido.', metric: 'Usuarios activos', value: '4', secondary: 'Empresa', secondaryValue: 'Empresa de ejemplo', columns: ['Usuario', 'Área', 'Rol', 'Estado'], rows: [['Usuario de ejemplo A', 'Administración', 'Admin', 'Activo'], ['Usuario de ejemplo B', 'Contabilidad', 'Contador', 'Activo'], ['Usuario de ejemplo C', 'Ventas', 'Vendedor', 'Activo']] },
  { id: 'reportes', label: 'Reportes', icon: Receipt, title: 'Una visión completa de tu negocio.', metric: 'Ingresos del periodo', value: '$ 12.480.000', secondary: 'Costos del periodo', secondaryValue: '$ 6.320.000', columns: ['Periodo', 'Concepto', 'Tipo', 'Valor'], rows: [['Octubre', 'Ingresos por ventas', 'Ingresos', '$ 12.480.000'], ['Octubre', 'Costo de ventas', 'Costos', '$ 6.320.000'], ['Octubre', 'Gastos operativos', 'Gastos', '$ 1.800.000']] },
]

export function ProductTour() {
  const [selected, setSelected] = useState(0)
  const active = modules[selected]
  function handleKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === 'ArrowRight' ? (index + 1) % modules.length
      : event.key === 'ArrowLeft' ? (index - 1 + modules.length) % modules.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? modules.length - 1 : null
    if (next === null) return
    event.preventDefault()
    setSelected(next)
    document.getElementById(`module-tab-${modules[next].id}`)?.focus()
  }
  return (
    <section id="plataforma" className="site-platform">
      <div className="module-band">
        <div className="site-width module-tabs" role="tablist" aria-label="Módulos de ClovEnt">
          {modules.map((module, index) => (
            <button key={module.id} type="button" role="tab" id={`module-tab-${module.id}`} aria-selected={selected === index} aria-controls="module-panel" tabIndex={selected === index ? 0 : -1} onClick={() => setSelected(index)} onKeyDown={e => handleKey(e, index)}>
              <module.icon size={24} strokeWidth={1.35} aria-hidden="true" /><span>{module.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="site-width platform-inner">
        <div className="platform-heading"><div><p className="site-eyebrow">Una sola plataforma</p><h2>Todo conectado.<br />Todo bajo control.</h2></div><p>Desde el primer movimiento<br />hasta el cierre del día.</p></div>
        <div role="tabpanel" id="module-panel" aria-labelledby={`module-tab-${active.id}`} tabIndex={0} className="product-demo">
          <div className="demo-heading"><h3>{active.title}</h3><span>Datos de ejemplo</span></div>
          <div className="demo-metrics"><div><p>{active.metric}</p><strong>{active.value}</strong></div><div><p>{active.secondary}</p><strong>{active.secondaryValue}</strong></div><div className="demo-company"><span>ClovEnt</span><p>Empresa de ejemplo</p></div></div>
          <div className="demo-table-scroll">
            <table>
              <caption className="sr-only">Ejemplo de {active.label}</caption>
              <thead><tr>{active.columns.map(col => <th key={col}>{col}</th>)}</tr></thead>
              <tbody>
                {active.rows.map((row, rowIndex) => (
                  <tr key={`${active.id}-${rowIndex}`}>
                    {row.map((value, i) => <td key={i}>{value === 'Pagada' || value === 'Activo' || value === 'Contabilizado' ? <span className="demo-status">{value}</span> : value}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
