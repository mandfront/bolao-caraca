import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, getCurrentProfile, createAdminClient } from '@/lib/supabase/server'
import { AppShell, TopBar } from '@/components/Navigation'
import { MatchCard } from '@/components/matches/MatchCard'
import { LiveBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/LoadingState'
import { groupByDate, formatMatchDate } from '@/utils/date'
import type { Match } from '@/types/match'

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

function isTomorrow(dateStr: string): boolean {
  const d = new Date(dateStr)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return d.getFullYear() === tomorrow.getFullYear() && d.getMonth() === tomorrow.getMonth() && d.getDate() === tomorrow.getDate()
}

export default async function JogosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile(user.id)
  const isAdmin = profile?.role === 'admin'
  const admin = createAdminClient()

  const { data: memberOf } = await admin
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  const groupId = memberOf?.group_id

  const { data: matches } = await admin
    .from('matches')
    .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
    .not('status', 'eq', 'cancelled')
    .order('starts_at')

  let userPredictions: Record<string, { home_score: number; away_score: number; points: number }> = {}
  if (groupId && matches?.length) {
    const { data: preds } = await admin
      .from('predictions')
      .select('match_id, home_score, away_score, points')
      .eq('user_id', user.id)
      .eq('group_id', groupId)
      .in('match_id', matches.map(m => m.id))

    if (preds) userPredictions = Object.fromEntries(preds.map(p => [p.match_id, p]))
  }

  const allMatches = (matches ?? []) as unknown as Match[]
  const liveMatches = allMatches.filter(m => m.status === 'live' || m.status === 'halftime')
  const todayMatches = allMatches.filter(m => isToday(m.starts_at) && m.status !== 'live' && m.status !== 'halftime')
  const tomorrowMatches = allMatches.filter(m => isTomorrow(m.starts_at))
  const finishedMatches = allMatches.filter(m => m.status === 'finished')
  const otherScheduled = allMatches.filter(m =>
    m.status === 'scheduled' && !isToday(m.starts_at) && !isTomorrow(m.starts_at)
  )

  const futureGrouped = groupByDate(otherScheduled)

  return (
    <AppShell isAdmin={isAdmin}>
      <TopBar
        title="Jogos"
        action={
          <Link href="/classificacao" className="text-xs font-semibold text-[#F5C518] bg-[#F5C518]/10 px-3 py-1.5 rounded-xl border border-[#F5C518]/25 hover:bg-[#F5C518]/20 transition-colors">
            Classificação →
          </Link>
        }
      />

      <div className="px-4 pt-4 pb-6 max-w-2xl mx-auto space-y-6">

        {/* Ao vivo */}
        {liveMatches.length > 0 && (
          <div className="animate-slide-up">
            <div className="flex items-center gap-2 mb-3">
              <LiveBadge />
            </div>
            <div className="space-y-3">
              {liveMatches.map(match => (
                <MatchCard key={match.id} match={match} showPrediction={!!groupId} userPrediction={userPredictions[match.id] ?? null} />
              ))}
            </div>
          </div>
        )}

        {/* Hoje */}
        {todayMatches.length > 0 && (
          <div className="animate-slide-up delay-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#F5C518] font-bold text-sm">📅 Hoje</span>
              <span className="text-[#4b5563] text-xs">— aposte antes do apito!</span>
            </div>
            <div className="space-y-3">
              {todayMatches.map(match => (
                <MatchCard key={match.id} match={match} showPrediction={!!groupId} userPrediction={userPredictions[match.id] ?? null} />
              ))}
            </div>
          </div>
        )}

        {/* Amanhã */}
        {tomorrowMatches.length > 0 && (
          <div className="animate-slide-up delay-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#9ca3af] font-bold text-sm">📅 Amanhã</span>
            </div>
            <div className="space-y-3">
              {tomorrowMatches.map(match => (
                <MatchCard key={match.id} match={match} showPrediction={!!groupId} userPrediction={userPredictions[match.id] ?? null} />
              ))}
            </div>
          </div>
        )}

        {/* Próximos jogos */}
        {Object.keys(futureGrouped).length > 0 && (
          <div>
            <p className="text-[#4b5563] text-xs font-semibold uppercase tracking-wider mb-3">Próximos jogos</p>
            {Object.entries(futureGrouped).map(([date, dateMatches], i) => (
              <div key={date} className="mb-4 animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                <p className="text-[#6b7280] text-xs font-semibold mb-2">{date}</p>
                <div className="space-y-3">
                  {dateMatches.map(match => (
                    <MatchCard key={match.id} match={match} showPrediction={!!groupId} userPrediction={userPredictions[match.id] ?? null} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Encerrados */}
        {finishedMatches.length > 0 && (
          <div className="animate-slide-up">
            <p className="text-[#4b5563] text-xs font-semibold uppercase tracking-wider mb-3">Encerrados</p>
            <div className="space-y-3">
              {finishedMatches.slice().reverse().map(match => (
                <MatchCard key={match.id} match={match} showPrediction={!!groupId} userPrediction={userPredictions[match.id] ?? null} />
              ))}
            </div>
          </div>
        )}

        {allMatches.length === 0 && (
          <EmptyState
            icon={<span className="text-3xl">📅</span>}
            title="Nenhum jogo cadastrado"
            description="O admin precisa sincronizar ou cadastrar partidas"
          />
        )}
      </div>
    </AppShell>
  )
}
