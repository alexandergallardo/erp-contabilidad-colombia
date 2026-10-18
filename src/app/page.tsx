import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Building2, ShieldCheck, Users } from 'lucide-react'
import { MarketingHeader } from '@/components/marketing/MarketingHeader'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { ProductTour } from '@/components/marketing/ProductTour'
import { BrandMark } from '@/components/brand/BrandMark'

export const metadata: Metadata = {
  title: { absolute: 'ClovEnt | Tu empresa conectada' },
  description: 'ERP para empresas en crecimiento en Colombia. Ventas, inventario, compras, contabilidad y punto de venta en ClovEnt.',
  alternates: { canonical: 'https://www.clovent.co' },
  openGraph: { title: 'ClovEnt | Tu empresa conectada', description: 'ERP para empresas en crecimiento.', url: 'https://www.clovent.co', images: [{ url: '/brand/clovent-dark.webp', width: 1800, height: 600, alt: 'ClovEnt, tu empresa conectada' }] },
  twitter: { card: 'summary_large_image', images: ['/brand/clovent-dark.webp'] },
}

export default function MarketingHomePage() {
  return (
    <div className="brand-site">
      <MarketingHeader />
      <main>
        <section className="site-hero" aria-labelledby="home-title">
          <Image className="hero-art" src="/brand/clovent-dark.webp" alt="" fill sizes="100vw" priority loading="eager" />
          <div className="site-width hero-content">
            <p className="hero-eyebrow">ERP para empresas en crecimiento</p>
            <h1 id="home-title" className="sr-only">ClovEnt</h1>
            <div className="hero-brand-space" aria-hidden="true" />
            <p className="hero-tagline">Tu empresa conectada.</p>
            <p className="hero-description">Más claridad en tus cuentas.<br className="mobile-break" /> Más tiempo para tu negocio.</p>
            <div className="site-actions"><Link href="/registro" className="site-button site-button-primary">Crear mi empresa <ArrowUpRight size={18} aria-hidden="true" /></Link><Link href="/login" className="site-button site-button-outline">Entrar a ClovEnt <ArrowRight size={18} aria-hidden="true" /></Link></div>
            <p className="hero-footnote">Ventas · Inventario · Contabilidad</p>
          </div>
        </section>
        <ProductTour />
        <section className="site-control" id="control">
          <div className="site-width control-inner">
            <div className="control-intro"><BrandMark size="xl" /><p className="site-eyebrow">La base de tu operación</p><h2>Tu negocio crece.<br />El control se queda.</h2><Link href="/funciones" className="site-text-link">Conocer ClovEnt <ArrowUpRight size={18} /></Link></div>
            <div className="control-list">
              {[{ icon: Building2, number: '01', title: 'Cada empresa, su espacio', text: 'Información y operación separadas por empresa.' }, { icon: Users, number: '02', title: 'Cada persona, su rol', text: 'Administración, contabilidad y ventas con sus propios accesos.' }, { icon: ShieldCheck, number: '03', title: 'Cada movimiento, su registro', text: 'Documentos y movimientos para dar seguimiento a tu operación.' }].map(item => <article key={item.number}><span className="control-number">{item.number}</span><div><h3>{item.title}</h3><p>{item.text}</p></div><item.icon size={24} strokeWidth={1.4} aria-hidden="true" /></article>)}
            </div>
          </div>
        </section>
        <section className="site-contact-band"><div className="site-width"><div><p className="site-eyebrow">El siguiente paso</p><h2>Conectemos tu empresa.</h2></div><Link href="/contacto" className="site-button site-button-ink">Hablemos <ArrowUpRight size={19} aria-hidden="true" /></Link></div></section>
      </main>
      <MarketingFooter />
    </div>
  )
}
