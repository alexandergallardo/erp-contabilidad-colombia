'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingCart, TrendingUp, Package, Menu } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useMobileLayout } from '@/components/layout/MobileLayoutProvider'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Inicio', href: '/dashboard' },
  { icon: ShoppingCart, label: 'POS', href: '/pos' },
  { icon: TrendingUp, label: 'Ventas', href: '/ventas/facturas' },
  { icon: Package, label: 'Productos', href: '/productos' },
] as const

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname.startsWith(href)
}

export function BottomNav() {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen } = useMobileLayout()

  return (
    <nav
      aria-label="Navegación móvil"
      className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-gray-200 bg-white/96 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-gray-800/90 dark:bg-gray-950/98 dark:shadow-[0_-10px_28px_rgba(0,0,0,0.34)]"
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors',
              active
                ? 'text-teal-600 dark:text-teal-400'
                : 'text-gray-500 dark:text-gray-400'
            )}
          >
            <item.icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
            <span>{item.label}</span>
          </Link>
        )
      })}

      {/* "Más" button opens sidebar drawer */}
      <button
        type="button"
        aria-label="Abrir menú"
        aria-expanded={sidebarOpen}
        onClick={() => setSidebarOpen(true)}
        className={cn(
          'flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors',
          sidebarOpen
            ? 'text-teal-600 dark:text-teal-400'
            : 'text-gray-500 dark:text-gray-400'
        )}
      >
        <Menu className={cn('h-5 w-5', sidebarOpen && 'stroke-[2.5]')} />
        <span>Más</span>
      </button>
    </nav>
  )
}
