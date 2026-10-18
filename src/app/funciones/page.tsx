import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, BarChart3, Box, Calculator, CreditCard, FileText, Users } from 'lucide-react'
import { MarketingLayout } from '@/components/marketing/MarketingLayout'

export const metadata: Metadata = { title: 'Módulos', description: 'Ventas, inventario, compras y contabilidad conectados en ClovEnt.', alternates: { canonical: 'https://www.clovent.co/funciones' } }
const modules = [
  { title: 'Ventas', icon: BarChart3, text: 'Clientes, cotizaciones, pedidos, facturas y recibos.' },
  { title: 'Inventario', icon: Box, text: 'Artículos, bodegas, existencias, kardex y rotación.' },
  { title: 'Compras', icon: FileText, text: 'Proveedores, órdenes, facturas y sugeridos de compra.' },
  { title: 'Contabilidad', icon: Calculator, text: 'Asientos, cuentas, periodos, balances y reportes.' },
  { title: 'Punto de venta', icon: CreditCard, text: 'Ventas desde escritorio y celular.' },
  { title: 'Usuarios', icon: Users, text: 'Accesos por rol y empresa, con responsabilidades definidas.' },
]
export default function FuncionesPage() {
  return <MarketingLayout><p className="site-eyebrow">Un mismo lugar</p><h1>Los módulos de ClovEnt</h1><p className="site-lead">Cada área de tu empresa, conectada con la siguiente.</p><div className="site-subpage-grid">{modules.map(module => <article key={module.title}><module.icon size={30} strokeWidth={1.4} /><h2>{module.title}</h2><p>{module.text}</p></article>)}</div><Link href="/registro" className="site-button site-button-ink mt-8">Registrar empresa <ArrowUpRight size={18} /></Link></MarketingLayout>
}
