import type { Metadata } from 'next'
import { ArrowUpRight, Mail, MapPin } from 'lucide-react'
import { MarketingLayout } from '@/components/marketing/MarketingLayout'

export const metadata: Metadata = { title: 'Contacto', description: 'Contacta al equipo de ClovEnt.', alternates: { canonical: 'https://www.clovent.co/contacto' } }
export default function ContactoPage() {
  return <MarketingLayout><div className="contact-layout"><section><p className="site-eyebrow">Hablemos</p><h1>Conectemos tu empresa.</h1><p className="site-lead">Cuéntanos sobre tu negocio. Revisemos juntos tus necesidades de operación, inventario y contabilidad.</p><a href="mailto:info@clovent.co?subject=Quiero%20conocer%20ClovEnt" className="site-button site-button-ink mt-8">Escribir al equipo <ArrowUpRight size={18} /></a></section><section className="contact-details" aria-label="Datos de contacto"><div><Mail size={22} /><div><h2>Correo</h2><a href="mailto:info@clovent.co">info@clovent.co</a></div></div><div><MapPin size={22} /><div><h2>Desde Colombia</h2><p>Ipiales, Nariño</p></div></div></section></div></MarketingLayout>
}
