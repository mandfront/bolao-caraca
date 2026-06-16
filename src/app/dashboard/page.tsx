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
  const [profileResult, groupsResult, liveMatchesResult, upcomingMatchesResult, recentResultsResult] = await Promise.all([
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
    // Últimos 5 palpites do usuário em jogos finalizados (últimas 48h)
    admin
      .from('predictions')
      .select(`
        id, home_score, away_score, points, exact_score, correct_winner,
        match:matches!inner(
          id, home_score, away_score, status, starts_at, phase,
          home_team:teams!matches_home_team_id_fkey(name, short_name, flag_url),
          away_team:teams!matches_away_team_id_fkey(name, short_name, flag_url)
        )
      `)
      .eq('user_id', user.id)
      .eq('match.status', 'finished')
      .gte('match.starts_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
      .order('updated_at', { ascending: false })
      .limit(5),
  ])

  const profile = profileResult
  const isAdmin = profile?.role === 'admin'
  const groups = groupsResult.data?.map(m => m.group) ?? []
  const liveMatches = (liveMatchesResult.data ?? []) as unknown as Parameters<typeof LiveMatchCard>[0]['match'][]
  const upcomingMatches = (upcomingMatchesResult.data ?? []) as unknown as Parameters<typeof MatchCard>[0]['match'][]
  const recentResults = (recentResultsResult.data ?? []) as unknown as Array<{
    id: string
    home_score: number
    away_score: number
    points: number
    exact_score: boolean
    correct_winner: boolean
    match: {
      id: string
      home_score: number
      away_score: number
      starts_at: string
      phase: string | null
      home_team: { name: string; short_name: string | null; flag_url: string | null }
      away_team: { name: string; short_name: string | null; flag_url: string | null }
    }
  }>

  const mainGroup = groups[0] as { id: string; name: string } | undefined

  let rankingPosition: number | null = null
  let totalPoints = 0
  if (mainGroup) {
    const { data: rankingData } = await admin.rpc('calculate_group_ranking', { p_group_id: mainGroup.id })
    const idx = rankingData?.findIndex((r: { user_id: string }) => r.user_id === user.id)
    if (idx !== undefined && idx >= 0) {
      rankingPosition = idx + 1
      totalPoints = rankingData?.[idx]?.total_points ?? 0
    }
  }

  const recentPoints = recentResults.reduce((sum, r) => sum + (r.points ?? 0), 0)

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

        {/* Últimos resultados (palpites encerrados nas últimas 48h) */}
        {recentResults.length > 0 && (
          <div className="animate-slide-up delay-150">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-[#f9fafb] font-bold text-sm">Seus Últimos Resultados</h3>
                {recentPoints > 0 && (
                  <p className="text-[#F5C518] text-xs mt-0.5">
                    +{recentPoints} pts nas últimas 48h · Total: {totalPoints} pts
                  </p>
                )}
              </div>
              <Link href="/ranking" className="text-[#F5C518] text-xs font-semibold">Ranking →</Link>
            </div>
            <div className="space-y-2">
              {recentResults.map((r) => {
                const m = r.match
                const ptColor =
                  r.points >= 5 ? 'text-[#F5C518] bg-[#F5C518]/15 border-[#F5C518]/30' :
                  r.points >= 3 ? 'text-[#22c55e] bg-[#22c55e]/15 border-[#22c55e]/30' :
                  r.points >= 1 ? 'text-[#3b82f6] bg-[#3b82f6]/15 border-[#3b82f6]/30' :
                  'text-[#6b7280] bg-[#1f2937] border-[#374151]'
                const ptLabel =
                  r.points >= 5 ? '🎯 EXATO!' :
                  r.points >= 3 ? '✓ Acertou' :
                  r.points >= 1 ? '~ Parcial' :
                  '✗ Errou'

                return (
                  <Link key={r.id} href={`/jogos/${m.id}`} className="block">
                    <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-3 hover:border-[#374151] transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          {m.home_team.flag_url && (
                            <img src={m.home_team.flag_url} alt="" className="w-5 h-3 object-cover rounded-sm shrink-0" />
                          )}
                          <span className="text-[#f9fafb] text-xs font-semibold truncate">
                            {m.home_team.short_name || m.home_team.name}
                          </span>
                        </div>
                        <span className="font-display text-lg text-[#f9fafb] shrink-0">
                          {m.home_score}–{m.away_score}
                        </span>
                        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                          <span className="text-[#f9fafb] text-xs font-semibold truncate">
                            {m.away_team.short_name || m.away_team.name}
                          </span>
                          {m.away_team.flag_url && (
                            <img src={m.away_team.flag_url} alt="" className="w-5 h-3 object-cover rounded-sm shrink-0" />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#6b7280]">
                          Palpite: <span className="text-[#9ca3af] font-semibold">{r.home_score}–{r.away_score}</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg border font-bold ${ptColor}`}>
                          {ptLabel} · {r.points}pt{r.points !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
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
