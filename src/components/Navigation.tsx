'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, Calendar, BarChart2, Trophy, UserCircle } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, label: 'Início' },
  { href: '/jogos', icon: Calendar, label: 'Jogos' },
  { href: '/classificacao', icon: BarChart2, label: 'Tabela' },
  { href: '/ranking', icon: Trophy, label: 'Ranking' },
  { href: '/perfil', icon: UserCircle, label: 'Perfil' },
]

export function BottomNav({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d1117] border-t border-[#1f2937] px-2 pb-safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          const isPerfilActive = href === '/perfil' && (isActive || pathname.startsWith('/admin'))
          const active = href === '/perfil' ? isPerfilActive : isActive

          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-3 rounded-xl transition-all ${
                active ? 'text-[#F5C518]' : 'text-[#6b7280] hover:text-[#9ca3af]'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-semibold tracking-wide">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export function AppShell({ children, isAdmin }: { children: React.ReactNode; isAdmin?: boolean }) {
  return (
    <div className="min-h-dvh pb-24">
      {children}
      <BottomNav isAdmin={isAdmin} />
    </div>
  )
}

export function TopBar({
  title,
  showBack = false,
  action,
}: {
  title: string
  showBack?: boolean
  action?: React.ReactNode
}) {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-40 bg-[#0a0f1e]/95 backdrop-blur-sm border-b border-[#1f2937]">
      <div className="flex items-center gap-3 px-4 py-3 max-w-2xl mx-auto">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-xl hover:bg-[#1f2937] transition-colors text-[#9ca3af]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <h1 className="flex-1 text-lg font-bold text-[#f9fafb] tracking-tight">{title}</h1>
        {action && <div>{action}</div>}
      </div>
    </header>
  )
}
