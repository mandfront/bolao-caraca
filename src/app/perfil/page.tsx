import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, getCurrentProfile, createAdminClient } from '@/lib/supabase/server'
import { AppShell, TopBar } from '@/components/Navigation'
import { LogoutButton } from '@/components/ui/LogoutButton'
import { AvatarUpload } from '@/components/ui/AvatarUpload'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile(user.id)

  const admin = createAdminClient()
  const { data: memberships } = await admin
    .from('group_members')
    .select('group:groups(id, name, invite_code)')
    .eq('user_id', user.id)

  const groups = (memberships ?? []).map(m => m.group as { id: string; name: string; invite_code: string } | null).filter(Boolean)
  const isAdmin = profile?.role === 'admin'

  return (
    <AppShell isAdmin={isAdmin}>
      <TopBar title="Meu Perfil" />

      <div className="px-4 pt-4 pb-6 max-w-2xl mx-auto space-y-4">

        {/* Avatar + nome */}
        <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-5 flex items-center gap-4 animate-slide-up">
          <AvatarUpload
            userId={user.id}
            currentUrl={profile?.avatar_url ?? null}
            name={profile?.name ?? user.email ?? 'A'}
          />
          <div className="flex-1 min-w-0">
            <p className="text-[#f9fafb] font-bold text-lg truncate">{profile?.name}</p>
            <p className="text-[#6b7280] text-sm truncate">{user.email}</p>
            {isAdmin && (
              <span className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-full bg-[#F5C518]/15 border border-[#F5C518]/30 text-[#F5C518] text-xs font-bold">
                ⚡ Administradora
              </span>
            )}
          </div>
        </div>

        {/* Admin panel */}
        {isAdmin && (
          <div className="animate-slide-up delay-100">
            <p className="text-[#6b7280] text-xs font-semibold uppercase tracking-wider mb-2">Administração</p>
            <Link href="/admin">
              <div className="bg-[#111827] border border-[#F5C518]/30 rounded-2xl p-4 flex items-center gap-3 hover:border-[#F5C518]/60 transition-colors active:scale-95">
                <div className="w-10 h-10 rounded-xl bg-[#F5C518]/15 flex items-center justify-center shrink-0">
                  <span className="text-xl">⚙️</span>
                </div>
                <div className="flex-1">
                  <p className="text-[#F5C518] font-bold text-sm">Painel Admin</p>
                  <p className="text-[#6b7280] text-xs">Partidas, sincronização e pontuação</p>
                </div>
                <span className="text-[#F5C518]/50 text-lg">→</span>
              </div>
            </Link>
          </div>
        )}

        {/* Meus grupos */}
        {groups.length > 0 && (
          <div className="animate-slide-up delay-200">
            <p className="text-[#6b7280] text-xs font-semibold uppercase tracking-wider mb-2">Meus Grupos</p>
            <div className="space-y-2">
              {groups.map(group => group && (
                <Link key={group.id} href={`/grupo/${group.id}`}>
                  <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-4 flex items-center gap-3 hover:border-[#374151] transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-[#22c55e]/10 flex items-center justify-center shrink-0">
                      <span className="text-xl">🏆</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#f9fafb] font-semibold text-sm truncate">{group.name}</p>
                      <p className="text-[#4b5563] text-xs font-mono">{group.invite_code}</p>
                    </div>
                    <span className="text-[#374151] text-lg">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Links rápidos */}
        <div className="animate-slide-up delay-300">
          <p className="text-[#6b7280] text-xs font-semibold uppercase tracking-wider mb-2">Navegação</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: '/grupos', icon: '👥', label: 'Entrar em grupo' },
              { href: '/ranking', icon: '🏆', label: 'Ver ranking' },
              { href: '/jogos', icon: '📅', label: 'Ver jogos' },
              { href: '/ao-vivo', icon: '⚡', label: 'Ao vivo' },
            ].map(item => (
              <Link key={item.href} href={item.href}>
                <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-3 flex items-center gap-2 hover:border-[#374151] transition-colors">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-[#9ca3af] text-xs font-medium">{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Logout */}
        <div className="animate-slide-up delay-400 pt-2">
          <LogoutButton />
        </div>

        <p className="text-center text-[#374151] text-xs animate-fade-in delay-500">
          Bolão Caraça © 2026 · Feito com ❤️ pela família
        </p>
      </div>
    </AppShell>
  )
}
