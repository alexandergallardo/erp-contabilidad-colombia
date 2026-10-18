import Link from 'next/link'
import { BrandLogo } from '@/components/brand/BrandLogo'

export function MarketingFooter() {
  return (
    <footer className="site-footer">
      <div className="site-width site-footer-inner">
        <div><Link href="/" aria-label="ClovEnt, inicio"><BrandLogo light /></Link><p>Tu empresa conectada.</p></div>
        <nav aria-label="Enlaces al pie"><Link href="/funciones">Módulos</Link><Link href="/precios">Planes</Link><Link href="/contacto">Contacto</Link><Link href="/login">Ingresar</Link></nav>
        <p>Hecho para empresas en Colombia.<br /><span>© {new Date().getFullYear()} ClovEnt</span></p>
      </div>
    </footer>
  )
}
