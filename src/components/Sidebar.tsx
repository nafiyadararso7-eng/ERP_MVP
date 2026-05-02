import { Link, useMatches } from '@tanstack/react-router'
import { useT } from '#/lib/i18n'
import { useAuth } from '#/lib/auth'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  DollarSign,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { key: 'nav.dashboard' as const, path: '/dashboard', icon: LayoutDashboard, ownerOnly: false },
  { key: 'nav.inventory' as const, path: '/inventory', icon: Package, ownerOnly: true },
  { key: 'nav.pos' as const, path: '/pos', icon: ShoppingCart, ownerOnly: false },
  { key: 'nav.sales' as const, path: '/sales', icon: Receipt, ownerOnly: false },
  { key: 'nav.finance' as const, path: '/finance', icon: DollarSign, ownerOnly: true },
  { key: 'nav.credits' as const, path: '/credits', icon: CreditCard, ownerOnly: true },
  { key: 'nav.settings' as const, path: '/settings', icon: Settings, ownerOnly: true },
]

export function Sidebar() {
  const { t } = useT()
  const { isOwner } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const matches = useMatches()
  const currentPath = matches[matches.length - 1]?.pathname || ''

  const visibleItems = navItems.filter(item => !item.ownerOnly || isOwner)

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen border-r border-border bg-sidebar transition-all duration-300 flex flex-col ${
        collapsed ? 'w-[68px]' : 'w-[240px]'
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-sm">
            ET
          </div>
          {!collapsed && (
            <span className="font-bold text-sidebar-foreground text-sm whitespace-nowrap">
              Ethiopia ERP
            </span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {visibleItems.map(item => {
          const Icon = item.icon
          const isActive = currentPath.startsWith(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{t(item.key)}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  )
}
