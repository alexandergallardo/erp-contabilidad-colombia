'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { BrandLogo } from '@/components/brand/BrandLogo'

const links = [
  { href: '/#plataforma', label: 'Plataforma' },
  { href: '/funciones', label: 'Módulos' },
  { href: '/precios', label: 'Planes' },
  { href: '/contacto', label: 'Contacto' },
]

export function MarketingHeader() {
  const [open, setOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const mobileNavRef = useRef<HTMLElement>(null)
  const homeLinkRef = useRef<HTMLAnchorElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 700px)')
    const closeOnDesktop = () => {
      if (mobile.matches) return
      if (mobileNavRef.current?.contains(document.activeElement) || document.activeElement === menuButtonRef.current) {
        homeLinkRef.current?.focus()
      }
      setOpen(false)
    }
    mobile.addEventListener('change', closeOnDesktop)
    return () => mobile.removeEventListener('change', closeOnDesktop)
  }, [])

  return (
    <header className="site-header" onKeyDown={event => {
      if (event.key !== 'Escape' || !open) return
      event.preventDefault()
      setOpen(false)
      menuButtonRef.current?.focus()
    }}>
      <div className="site-width site-header-inner">
        <Link ref={homeLinkRef} href="/" aria-label="ClovEnt, inicio" onClick={() => setOpen(false)}><BrandLogo light /></Link>
        <nav aria-label="Navegación principal" className="site-desktop-nav">
          {links.map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? 'page' : undefined}>{link.label}</Link>)}
        </nav>
        <div className="site-header-actions">
          <Link className="site-login-link" href="/login">Ingresar <ArrowUpRight size={15} aria-hidden="true" /></Link>
          <button ref={menuButtonRef} type="button" className="site-menu-toggle" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} aria-controls={open ? 'site-mobile-nav' : undefined} onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <nav ref={mobileNavRef} id="site-mobile-nav" aria-label="Navegación móvil" className="site-mobile-nav">
          {links.map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}<ArrowUpRight size={16} aria-hidden="true" /></Link>)}
          <Link href="/registro" onClick={() => setOpen(false)}>Registrar empresa<ArrowUpRight size={16} aria-hidden="true" /></Link>
        </nav>
      )}
    </header>
  )
}
