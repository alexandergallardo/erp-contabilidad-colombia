'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Lock, User } from 'lucide-react'
import { BrandLogo } from '@/components/brand/BrandLogo'

export function LoginPageClient() {
  const searchParams = useSearchParams()
  const [identifier, setIdentifier] = useState(searchParams.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const registered = searchParams.get('registered') === '1'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, password }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        setError(body?.error ?? 'Usuario o contraseña incorrectos')
        setLoading(false)
        return
      }
      const target = body?.debe_cambiar_password ? '/cambiar-password'
        : body?.seleccionar_empresa ? '/seleccionar-empresa' : '/dashboard'
      window.location.assign(target)
    } catch {
      setError('No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.')
      setLoading(false)
    }
  }

  return (
    <main className="brand-auth">
      <section className="auth-brand" aria-label="ClovEnt, tu empresa conectada">
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-white/70"><ArrowLeft size={15} /> Volver al inicio</Link>
        <div className="auth-brand-message"><Image src="/brand/clovent-dark.webp" width={1800} height={600} alt="ClovEnt" className="auth-brand-art" sizes="50vw" priority /><p>Tu empresa conectada.</p></div>
        <div className="auth-brand-footer"><span>ClovEnt</span><span>ERP para empresas en crecimiento</span></div>
      </section>
      <section className="auth-form-section">
        <div className="auth-form-wrap">
          <Link href="/" className="auth-mobile-logo" aria-label="ClovEnt, volver al inicio"><BrandLogo /></Link>
          <p className="site-eyebrow">Bienvenido de nuevo</p>
          <h1>Entrar a ClovEnt</h1>
          <p className="auth-form-subtitle">Tu operación, lista para un nuevo día.</p>
          {registered && <div role="status" className="auth-feedback auth-feedback-success mt-6">Registro completado. Ya puedes iniciar sesión con tu correo administrador.</div>}
          <form onSubmit={handleSubmit}>
            <div><label htmlFor="identifier">Email o cédula</label><div className="auth-field"><User size={16} aria-hidden="true" /><input id="identifier" name="identifier" type="text" placeholder="correo@empresa.com" value={identifier} onChange={e => setIdentifier(e.target.value)} autoComplete="username" required /></div></div>
            <div><label htmlFor="password">Contraseña</label><div className="auth-field"><Lock size={16} aria-hidden="true" /><input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Tu contraseña" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="auth-password-toggle" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPassword}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></div>
            {error && <div role="alert" className="auth-feedback auth-feedback-error">{error}</div>}
            <Button type="submit" className="auth-submit" disabled={loading}>{loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Ingresando...</> : <>Entrar <ArrowRight size={17} /></>}</Button>
          </form>
          <div className="auth-form-footer"><span>¿Aún no tienes una cuenta?</span><Link href="/registro">Registrar empresa <ArrowRight size={14} className="inline" /></Link></div>
          <Link href="/contacto" className="mt-8 inline-block text-xs text-[#60766a]">Contactar al equipo de ClovEnt</Link>
        </div>
      </section>
    </main>
  )
}
