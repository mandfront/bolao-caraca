import { redirect, notFound } from 'next/navigation'
import { createClient, getCurrentProfile, createAdminClient } from '@/lib/supabase/server'
import { AppShell, TopBar } from '@/components/Navigation'
import { Scoreboard } from '@/components/matches/Scoreboard'
import { MatchTimeline } from '@/components/matches/MatchTimeline'
import { LineupSection } from '@/components/matches/LineupSection'
import { MatchDetailClient } from '@/components/matches/MatchDetailClient'
import { canPredict } from '@/utils/match-status'
import { formatDateTime } from '@/utils/date'
import { AutoRefresh } from '@/components/matches/AutoRefresh'
import type { Match } from '@/types/match'
import type { Tables } from '@/types/database'
import Link from 'next/link'

export default async function MatchDetailPage({
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
  const admin = createAdminClient()

  const [matchResult, eventsResult, lineupsResult, membershipsResult] = await Promise.all([
    admin
      .from('matches')
      .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
      .eq('id', id)
      .single(),
    admin
      .from('match_events')
      .select('*')
      .eq('match_id', id)
      .order('minute'),
    admin
      .from('lineups')
      .select('*, players:player_lineups(*)')
      .eq('match_id', id),
    admin
      .from('group_members')
      .select('group_id, group:groups(id, name)')
      .eq('user_id', user.id),
  ])

  if (!matchResult.data) notFound()

  const match = matchResult.data as unknown as Match
  const events = (eventsResult.data ?? []) as Tables<'match_events'>[]
  const lineups = (lineupsResult.data ?? []) as (Tables<'lineups'> & { players: Tables<'player_lineups'>[] })[]
  const groups = (membershipsResult.data ?? [])
    .map(m => m.group as { id: string; name: string } | null)
    .filter(Boolean) as { id: string; name: string }[]

  const matchLocked = !canPredict(match.status, match.starts_at)

  // Busca palpites do usuário em todos os grupos + palpites de outros membros
  type GroupData = {
    group: { id: string; name: string }
    userPrediction: Tables<'predictions'> | null
    allPredictions: (Tables<'predictions'> & { profile?: { name: string; avatar_url: string | null } })[]
  }

  const groupsData: GroupData[] = await Promise.all(
    groups.map(async (group) => {
      const [myPred, allPreds] = await Promise.all([
        admin
          .from('predictions')
          .select('*')
          .eq('match_id', id)
          .eq('user_id', user.id)
          .eq('group_id', group.id)
          .single(),
        matchLocked
          ? admin
              .from('predictions')
              .select('*, profile:profiles(name, avatar_url)')
              .eq('match_id', id)
              .eq('group_id', group.id)
          : Promise.resolve({ data: [] }),
      ])
      return {
        group,
        userPrediction: myPred.data ?? null,
        allPredictions: ((allPreds.data ?? []) as GroupData['allPredictions']),
      }
    })
  )

  const homeLineup = lineups.find(l => l.team_id === match.home_team_id)
  const awayLineup = lineups.find(l => l.team_id === match.away_team_id)
  const isScheduled = match.status === 'scheduled'
  const hasEvents = events.length > 0
  const hasLineups = !!(homeLineup || awayLineup)

  const homeGoals = events.filter(e =>
    (e.event_type === 'goal' || e.event_type === 'penalty') && e.team_id === match.home_team_id
  )
  const awayGoals = events.filter(e =>
    (e.event_type === 'goal' || e.event_type === 'penalty') && e.team_id === match.away_team_id
  )

  return (
    <AppShell isAdmin={isAdmin}>
      <TopBar
        title={`${match.home_team?.short_name || match.home_team?.name || 'Mandante'} × ${match.away_team?.short_name || match.away_team?.name || 'Visitante'}`}
        showBack
        action={isAdmin ? (
          <Link
            href={`/admin/partidas/${id}`}
            className="text-xs text-[#F5C518] bg-[#F5C518]/10 px-3 py-1.5 rounded-xl border border-[#F5C518]/25"
          >
            Editar
          </Link>
        ) : undefined}
      />

      {/* Auto-refresh quando jogo está ao vivo */}
      <AutoRefresh enabled={match.status === 'live' || match.status === 'halftime'} intervalMs={60000} />

      <div className="px-4 pt-4 pb-6 max-w-2xl mx-auto space-y-4">

        <div className="animate-slide-up">
          <Scoreboard match={match} large />
        </div>

        {isScheduled && (
          <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-4 animate-slide-up delay-100">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-[#4b5563] text-xs mb-1">Data e hora</p>
                <p className="text-[#f9fafb] text-sm font-semibold">{formatDateTime(match.starts_at)}</p>
              </div>
              <div>
                <p className="text-[#4b5563] text-xs mb-1">Fase</p>
                <p className="text-[#f9fafb] text-sm font-semibold">{match.phase ?? '—'}</p>
              </div>
              {match.stadium && (
                <div className="col-span-2">
                  <p className="text-[#4b5563] text-xs mb-1">Estádio</p>
                  <p className="text-[#f9fafb] text-sm font-semibold">📍 {match.stadium}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Palpites por grupo */}
        <div className="animate-slide-up delay-200">
          <MatchDetailClient
            match={match}
            groupsData={groupsData}
            currentUserId={user.id}
            matchLocked={matchLocked}
          />
        </div>

        {hasEvents && (homeGoals.length > 0 || awayGoals.length > 0) && (
          <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-4 animate-slide-up delay-300">
            <p className="text-[#6b7280] text-xs font-bold uppercase tracking-wider mb-3">Gols</p>
            <div className="flex gap-4">
              <div className="flex-1 space-y-1">
                {homeGoals.map((e, i) => (
                  <p key={i} className="text-[#f9fafb] text-xs">
                    ⚽ <span className="font-semibold">{e.player_name}</span>
                    <span className="text-[#4b5563] ml-1">{e.minute}'</span>
                  </p>
                ))}
              </div>
              <div className="flex-1 space-y-1 text-right">
                {awayGoals.map((e, i) => (
                  <p key={i} className="text-[#f9fafb] text-xs">
                    <span className="text-[#4b5563] mr-1">{e.minute}'</span>
                    <span className="font-semibold">{e.player_name}</span> ⚽
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {hasEvents && (
          <div className="animate-slide-up delay-300">
            <h3 className="text-[#f9fafb] font-bold text-sm mb-3">Eventos do Jogo</h3>
            <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-4">
              <MatchTimeline events={events} homeTeamId={match.home_team_id} awayTeamId={match.away_team_id} />
            </div>
          </div>
        )}

        {hasLineups ? (
          <div className="animate-slide-up delay-400">
            <h3 className="text-[#f9fafb] font-bold text-sm mb-3">Escalações</h3>
            <div className="space-y-3">
              {homeLineup && <LineupSection lineup={homeLineup} teamName={match.home_team.name} />}
              {awayLineup && <LineupSection lineup={awayLineup} teamName={match.away_team.name} />}
            </div>
          </div>
        ) : (
          <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-4 text-center animate-slide-up delay-400">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-[#6b7280] text-sm font-medium">Escalação ainda não divulgada</p>
            <p className="text-[#4b5563] text-xs mt-1">Geralmente disponível 1h antes do jogo</p>
          </div>
        )}

        {isScheduled && (
          <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-4 animate-slide-up delay-500">
            <p className="text-[#6b7280] text-xs font-bold uppercase tracking-wider mb-3">Como pontuar</p>
            <div className="space-y-2">
              {[
                { pts: 5, label: 'Placar exato', color: 'text-[#F5C518]', bg: 'bg-[#F5C518]/10' },
                { pts: 3, label: 'Vencedor ou empate', color: 'text-[#22c55e]', bg: 'bg-[#22c55e]/10' },
                { pts: 2, label: 'Saldo de gols certo', color: 'text-[#3b82f6]', bg: 'bg-[#3b82f6]/10' },
                { pts: 1, label: 'Gols de um time certos', color: 'text-[#9ca3af]', bg: 'bg-[#1f2937]' },
              ].map(({ pts, label, color, bg }) => (
                <div key={pts} className={`flex items-center gap-3 ${bg} rounded-xl px-3 py-2`}>
                  <span className={`font-display text-2xl ${color} w-8 text-center`}>{pts}</span>
                  <span className="text-[#9ca3af] text-xs">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
