import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, getCurrentProfile, createAdminClient } from '@/lib/supabase/server'
import { AppShell, TopBar } from '@/components/Navigation'
import { MatchCard } from '@/components/matches/MatchCard'
import { LiveMatchCard } from '@/components/matches/LiveMatchCard'
import { EmptyState } from '@/components/ui/LoadingState'
import { AutoRefresh } from '@/components/matches/AutoRefresh'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const [profileResult, groupsResult, liveMatchesResult, upcomingMatchesResult] = await Promise.all([
    getCurrentProfile(user.id),
    admin
      .from('group_members')
      .select('group:groups(id, name)')
      .eq('user_id', user.id)
      .limit(1),
    admin
      .from('matches')
      .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
      .in('status', ['live', 'halftime'])
      .order('starts_at'),
    admin
      .from('matches')
      .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
      .eq('status', 'scheduled')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at')
      .limit(5),
  ])

  const profile = profileResult
  const isAdmin = profile?.role === 'admin'
  const groups = groupsResult.data?.map(m => m.group) ?? []
  const liveMatches = (liveMatchesResult.data ?? []) as unknown as Parameters<typeof LiveMatchCard>[0]['match'][]
  const upcomingMatches = (upcomingMatchesResult.data ?? []) as unknown as Parameters<typeof MatchCard>[0]['match'][]

  const mainGroup = groups[0] as { id: string; name: string } | undefined

  let rankingPosition: number | null = null
  if (mainGroup) {
    const { data: rankingData } = await admin.rpc('calculate_group_ranking', { p_group_id: mainGroup.id })
    const idx = rankingData?.findIndex((r: { user_id: string }) => r.user_id === user.id)
    if (idx !== undefined && idx >= 0) rankingPosition = idx + 1
  }

  return (
    <AppShell isAdmin={isAdmin}>
      <TopBar title="Bolão Caraça" />

      {/* Auto-refresh quando houver jogos ao vivo */}
      <AutoRefresh enabled={liveMatches.length > 0} intervalMs={60000} />

      <div className="px-4 pt-4 pb-6 max-w-2xl mx-auto space-y-6">
        {/* Welcome */}
        <div className="animate-slide-up">
          <p className="text-[#6b7280] text-sm">Bem-vindo(a),</p>
          <h2 className="text-[#f9fafb] font-bold text-xl">{profile?.name ?? 'Jogador'} 👋</h2>
        </div>

        {/* Stats row */}
        {mainGroup && (
          <div className="grid grid-cols-3 gap-3 animate-slide-up delay-100">
            <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-3 text-center">
              <p className="font-display text-3xl text-[#F5C518]">
                {rankingPosition ? `#${rankingPosition}` : '-'}
              </p>
              <p className="text-[#6b7280] text-xs mt-0.5">Posição</p>
            </div>
            <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-3 text-center">
              <p className="font-display text-3xl text-[#22c55e]">{liveMatches.length}</p>
              <p className="text-[#6b7280] text-xs mt-0.5">Ao vivo</p>
            </div>
            <Link href={`/grupo/${mainGroup.id}`} className="bg-[#111827] border border-[#1f2937] rounded-2xl p-3 text-center hover:border-[#374151] transition-colors">
              <p className="text-[#9ca3af] text-xs font-bold truncate">{mainGroup.name}</p>
              <p className="text-[#4b5563] text-xs mt-0.5">Ver grupo →</p>
            </Link>
          </div>
        )}

        {/* No group */}
        {!mainGroup && (
          <div className="bg-[#111827] border border-[#F5C518]/30 rounded-2xl p-4 animate-slide-up delay-100">
            <p className="text-[#f9fafb] font-semibold text-sm mb-1">Entre em um grupo!</p>
            <p className="text-[#6b7280] text-xs mb-3">Participe com a família para palpitar e disputar o ranking.</p>
            <Link
              href="/grupos"
              className="inline-flex items-center gap-2 bg-[#F5C518] text-[#0a0f1e] text-sm font-bold px-4 py-2 rounded-xl hover:bg-[#f0ba00] transition-colors active:scale-95"
            >
              Entrar em grupo
            </Link>
          </div>
        )}

        {/* Live matches */}
        {liveMatches.length > 0 && (
          <div className="animate-slide-up delay-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[#f9fafb] font-bold text-sm">Ao Vivo Agora</h3>
              <Link href="/ao-vivo" className="text-[#22c55e] text-xs font-semibold">Ver todos →</Link>
            </div>
            <div className="space-y-3">
              {liveMatches.map(match => (
                <LiveMatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming matches */}
        <div className="animate-slide-up delay-300">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[#f9fafb] font-bold text-sm">Próximos Jogos</h3>
            <Link href="/jogos" className="text-[#F5C518] text-xs font-semibold">Ver todos →</Link>
          </div>
          {upcomingMatches.length > 0 ? (
            <div className="space-y-3">
              {upcomingMatches.map(match => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<span className="text-2xl">📅</span>}
              title="Nenhum jogo agendado"
              description="Os próximos jogos aparecerão aqui"
            />
          )}
        </div>
      </div>
    </AppShell>
  )
}
