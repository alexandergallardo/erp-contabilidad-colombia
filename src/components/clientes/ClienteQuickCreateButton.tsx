'use client'

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { FormCliente, type ClienteFormData } from '@/components/clientes/FormCliente'
import type { GrupoCliente } from '@/types'

export interface ClienteLookupOption {
  id: string
  razon_social: string
  numero_documento?: string | null
  email?: string | null
  telefono?: string | null
}

interface ClienteQuickCreateButtonProps {
  onCreated: (cliente: ClienteLookupOption) => void
  triggerLabel?: string
  title?: string
  description?: string
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
  className?: string
}

export function formatClienteLookupLabel(cliente: ClienteLookupOption) {
  if (!cliente.numero_documento) return cliente.razon_social
  return `${cliente.razon_social} (${cliente.numero_documento})`
}

export function ClienteQuickCreateButton({
  onCreated,
  triggerLabel = 'Nuevo cliente',
  title = 'Crear cliente rapido',
  description = 'Crea el cliente sin salir del documento y lo dejamos seleccionado de una vez.',
  variant = 'outline',
  size = 'sm',
  className,
}: ClienteQuickCreateButtonProps) {
  const [open, setOpen] = useState(false)
  const [grupos, setGrupos] = useState<GrupoCliente[]>([])
  const [loadingGrupos, setLoadingGrupos] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [formSeed, setFormSeed] = useState(0)

  useEffect(() => {
    if (!open || grupos.length > 0) return

    let cancelled = false

    async function cargarGrupos() {
      try {
        setLoadingGrupos(true)
        const res = await fetch('/api/clientes/grupos', { cache: 'no-store' })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'No fue posible cargar grupos')
        if (!cancelled) {
          setGrupos(Array.isArray(data?.grupos) ? data.grupos : [])
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Error al cargar grupos')
        }
      } finally {
        if (!cancelled) {
          setLoadingGrupos(false)
        }
      }
    }

    void cargarGrupos()

    return () => {
      cancelled = true
    }
  }, [grupos.length, open])

  function handleOpen() {
    setError('')
    setFormSeed((prev) => prev + 1)
    setOpen(true)
  }

  function handleClose() {
    if (guardando) return
    setError('')
    setOpen(false)
  }

  async function handleGuardar(datos: ClienteFormData) {
    setGuardando(true)
    setError('')

    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'No fue posible crear el cliente')

      const clienteCreado = {
        id: data.id,
        razon_social: data.razon_social,
        numero_documento: data.numero_documento ?? null,
        email: data.email ?? null,
        telefono: data.telefono ?? null,
      }

      onCreated(clienteCreado)
      setOpen(false)
      setFormSeed((prev) => prev + 1)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Error al crear cliente')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <Button type="button" variant={variant} size={size} className={className} onClick={handleOpen}>
        <Plus className="h-4 w-4" />
        {triggerLabel}
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        titulo={title}
        descripcion={description}
        size="lg"
      >
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}

        {loadingGrupos ? (
          <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Cargando datos del cliente...</div>
        ) : (
          <FormCliente
            key={formSeed}
            grupos={grupos}
            onGuardar={handleGuardar}
            onCancelar={handleClose}
            cargando={guardando}
          />
        )}
      </Modal>
    </>
  )
}
