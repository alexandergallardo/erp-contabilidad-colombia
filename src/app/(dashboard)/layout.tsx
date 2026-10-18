export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getEmpresasAccesoUsuario } from '@/lib/auth/empresas-acceso'
import { DashboardShell } from '@/components/layout/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.debe_cambiar_password) redirect('/cambiar-password')

  const empresas = session.tiene_multi_empresa
    ? await getEmpresasAccesoUsuario(session.id, session.empresa_id)
    : undefined

  return (
    <DashboardShell
      rol={session.rol}
      empresaNombre={session.empresa_nombre}
      userName={session.nombre}
      userEmail={session.email}
      tieneMultiEmpresa={session.tiene_multi_empresa}
      empresas={empresas}
    >
      {children}
    </DashboardShell>
  )
}
