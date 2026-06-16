import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient, getCurrentProfile, createAdminClient } from '@/lib/supabase/server'
import { AppShell, TopBar } from '@/components/Navigation'
import { GroupInviteCard } from '@/components/groups/GroupInviteCard'
import { LeaveGroupButton } from '@/components/groups/LeaveGroupButton'
import { RankingTable } from '@/components/ranking/RankingTable'
import { MatchCard } from '@/components/matches/MatchCard'
import { EmptyState } from '@/components/ui/LoadingState'
import type { RankingEntry } from '@/types/prediction'

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile(user.id)
  const isAdmin = profile?.role === 'admin'

  // Usa admin client para bypassar RLS nas queries do grupo
  const admin = createAdminClient()

  // Verifica membro via admin (RLS da anon key causa 404 indevido)
  const { data: membership } = await admin
    .from('group_members')
    .select('id')
    .eq('group_id', id)
    .eq('user_id', user.id)
    .single()

  if (!membership) notFound()

  const [groupResult, membersResult, rankingResult, upcomingResult] = await Promise.all([
    admin.from('groups').select('*').eq('id', id).single(),
    admin
      .from('group_members')
      .select('id, user_id, profile:profiles(name, avatar_url)')
      .eq('group_id', id),
    admin.rpc('calculate_group_ranking', { p_group_id: id }),
    admin
      .from('matches')
      .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
      .in('status', ['scheduled', 'live', 'halftime'])
      .gte('starts_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
      .order('starts_at')
      .limit(5),
  ])

  if (!groupResult.data) notFound()

  const group = groupResult.data
  const members = membersResult.data ?? []
  const rawRanking = (rankingResult.data ?? []) as Array<{
    user_id: string; user_name: string; avatar_url: string | null
    total_points: number; predictions_count: number
    exact_scores: number; correct_winners: number; last_points: number | null
  }>
  const ranking: RankingEntry[] = rawRanking.map((r, i) => ({ ...r, position: i + 1 }))
  const upcomingMatches = (upcomingResult.data ?? []) as Parameters<typeof MatchCard>[0]['match'][]

  // Palpites do usuário nos próximos jogos
  let userPredictions: Record<string, { home_score: number; away_score: number; points: number }> = {}
  if (upcomingMatches.length > 0) {
    const { data: preds } = await admin
      .from('predictions')
      .select('match_id, home_score, away_score, points')
      .eq('user_id', user.id)
      .eq('group_id', id)
      .in('match_id', upcomingMatches.map(m => m.id))

    if (preds) userPredictions = Object.fromEntries(preds.map(p => [p.match_id, p]))
  }

  const userRank = ranking.find(r => r.user_id === user.id)
  const pendingPredictions = upcomingMatches.filter(m =>
    m.status === 'scheduled' && !userPredictions[m.id]
  ).length

  return (
    <AppShell isAdmin={isAdmin}>
      <TopBar title={group.name} showBack />

      <div className="px-4 pt-4 pb-6 max-w-2xl mx-auto space-y-6">
        {/* Invite card */}
        <GroupInviteCard group={group} memberCount={members.length} />

        {/* CTA palpites pendentes */}
        {pendingPredictions > 0 && (
          <Link href="/jogos" className="block">
            <div className="bg-[#F5C518]/10 border border-[#F5C518]/40 rounded-2xl p-4 flex items-center gap-3 hover:bg-[#F5C518]/15 transition-colors">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="text-[#F5C518] font-bold text-sm">
                  {pendingPredictions} jogo{pendingPredictions > 1 ? 's' : ''} sem palpite!
                </p>
                <p className="text-[#9ca3af] text-xs">Toque para palpitar antes do apito</p>
              </div>
              <span className="ml-auto text-[#F5C518]">→</span>
            </div>
          </Link>
        )}

        {/* User rank */}
        {userRank && (
          <div className="bg-[#F5C518]/8 border border-[#F5C518]/25 rounded-2xl p-4 flex items-center gap-4 animate-slide-up">
            <div className="text-center shrink-0">
              <p className="font-display text-4xl text-[#F5C518]">#{userRank.position}</p>
              <p className="text-[#6b7280] text-xs">posição</p>
            </div>
            <div className="flex-1">
              <p className="text-[#f9fafb] font-semibold text-sm">{userRank.user_name}</p>
              <div className="flex flex-wrap gap-3 mt-1">
                <span className="text-[#F5C518] text-xs font-bold">{userRank.total_points} pts</span>
                <span className="text-[#9ca3af] text-xs">{userRank.predictions_count} palpites</span>
                {userRank.exact_scores > 0 && (
                  <span className="text-[#22c55e] text-xs">⚡ {userRank.exact_scores} exatos</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Próximos jogos com palpites */}
        {upcomingMatches.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[#f9fafb] font-bold text-sm">Próximos jogos</h3>
              <Link href="/jogos" className="text-[#F5C518] text-xs font-semibold">Ver todos →</Link>
            </div>
            <div className="space-y-3">
              {upcomingMatches.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  showPrediction
                  userPrediction={userPredictions[match.id] ?? null}
                />
              ))}
            </div>
          </div>
        )}

        {/* Ranking */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[#f9fafb] font-bold text-sm">Ranking do Grupo</h3>
            <Link href={`/ranking?group=${id}`} className="text-[#F5C518] text-xs font-semibold">Completo →</Link>
          </div>
          {ranking.length > 0 ? (
            <RankingTable ranking={ranking.slice(0, 5)} currentUserId={user.id} />
          ) : (
            <EmptyState
              icon={<span className="text-2xl">🏆</span>}
              title="Ranking vazio"
              description="Os pontos aparecem conforme os jogos encerram"
            />
          )}
        </div>

        {/* Membros */}
        <div>
          <h3 className="text-[#f9fafb] font-bold text-sm mb-3">
            Família ({members.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => {
              const p = m.profile as { name: string; avatar_url: string | null } | null
              return (
                <div key={m.id} className="flex items-center gap-2 bg-[#111827] border border-[#1f2937] rounded-xl px-3 py-2">
                  <div className="w-7 h-7 rounded-full bg-[#1f2937] flex items-center justify-center text-sm font-bold text-[#F5C518]">
                    {p?.avatar_url ? (
                      <img src={p.avatar_url} alt={p.name ?? ''} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span>{p?.name?.[0]?.toUpperCase() ?? '?'}</span>
                    )}
                  </div>
                  <span className="text-[#f9fafb] text-xs font-medium">{p?.name}</span>
                  {m.user_id === user.id && (
                    <span className="text-[10px] text-[#F5C518] font-bold bg-[#F5C518]/10 px-1.5 rounded">Você</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Sair do grupo */}
        <div className="pt-4 border-t border-[#1f2937]">
          <LeaveGroupButton
            groupId={group.id}
            groupName={group.name}
            isCreator={group.created_by === user.id}
            memberCount={members.length}
          />
        </div>
      </div>
    </AppShell>
  )
}
