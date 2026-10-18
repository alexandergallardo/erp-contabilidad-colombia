import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, Check } from 'lucide-react'
import { MarketingLayout } from '@/components/marketing/MarketingLayout'

export const metadata: Metadata = { title: 'Planes', description: 'Consulta las modalidades de ClovEnt para tu empresa.', alternates: { canonical: 'https://www.clovent.co/precios' } }
const modes = [
  { title: 'Mensual', text: 'Un paso a la vez, con pago mes a mes.', items: ['Operación comercial y contable', 'Usuarios con permisos por rol', 'Acceso desde la web'] },
  { title: 'Anual', text: 'Continuidad para una operación que crece.', items: ['Modalidad por periodo anual', 'Módulos conectados', 'Información separada por empresa'] },
  { title: 'Implementación', text: 'Un comienzo con tus datos en orden.', items: ['Parametrización inicial', 'Carga de información', 'Acompañamiento en la puesta en marcha'] },
]
export default function PreciosPage() {
  return <MarketingLayout><p className="site-eyebrow">ClovEnt para tu negocio</p><h1>Planes e implementación</h1><p className="site-lead">Conversemos sobre tu empresa y la modalidad que necesitas. Solicita una cotización con el alcance y las condiciones de tu servicio.</p><div className="site-subpage-grid">{modes.map(mode => <article key={mode.title}><h2>{mode.title}</h2><p>{mode.text}</p><ul>{mode.items.map(item => <li key={item}><Check size={17} />{item}</li>)}</ul><Link href="/contacto" className="site-text-link">Consultar condiciones <ArrowUpRight size={16} /></Link></article>)}</div></MarketingLayout>
}
