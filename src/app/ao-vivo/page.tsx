import { redirect } from 'next/navigation'
import { createClient, getCurrentProfile, createAdminClient } from '@/lib/supabase/server'
import { AppShell, TopBar } from '@/components/Navigation'
import { EmptyState } from '@/components/ui/LoadingState'
import { LiveClock } from '@/components/matches/LiveClock'
import { AutoRefresh } from '@/components/matches/AutoRefresh'
import Link from 'next/link'
import type { Match } from '@/types/match'
import type { Tables } from '@/types/database'

function TeamFlag({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return (
      <div className="w-14 h-10 rounded-lg overflow-hidden border border-[#ffffff10] shadow-lg">
        <img src={url} alt={name} className="w-full h-full object-cover" loading="lazy" />
      </div>
    )
  }
  return (
    <div className="w-14 h-10 rounded-lg bg-[#1f2937] border border-[#374151] flex items-center justify-center">
      🏳️
    </div>
  )
}

const EVENT_ICONS: Record<string, string> = {
  goal: '⚽', own_goal: '⚽', penalty: '🎯',
  yellow_card: '🟨', red_card: '🟥',
  substitution: '🔄', var: '📺', other: '•',
}

export default async function AoVivoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile(user.id)
  const isAdmin = profile?.role === 'admin'
  const admin = createAdminClient()

  const { data: liveMatches } = await admin
    .from('matches')
    .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
    .in('status', ['live', 'halftime'])
    .order('starts_at')

  const matches = (liveMatches ?? []) as unknown as Match[]
  const matchIds = matches.map(m => m.id)
  const hasLive = matches.length > 0

  let eventsByMatch: Record<string, Tables<'match_events'>[]> = {}
  if (matchIds.length > 0) {
    const { data: events } = await admin
      .from('match_events')
      .select('*')
      .in('match_id', matchIds)
      .order('minute', { ascending: false })

    if (events) {
      eventsByMatch = events.reduce((acc, e) => {
        if (!acc[e.match_id]) acc[e.match_id] = []
        if (acc[e.match_id].length < 5) acc[e.match_id].push(e)
        return acc
      }, {} as typeof eventsByMatch)
    }
  }

  return (
    <AppShell isAdmin={isAdmin}>
      <TopBar title="Ao Vivo" />

      {/* Auto-refresh a cada 60s quando há jogos ao vivo */}
      <AutoRefresh enabled={hasLive} intervalMs={60000} />

      <div className="px-4 pt-4 pb-6 max-w-2xl mx-auto">
        {hasLive ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                <p className="text-[#22c55e] text-sm font-bold">
                  {matches.length} jogo{matches.length > 1 ? 's' : ''} ao vivo
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Botão admin: sync do worldcup26.ir */}
                {isAdmin && (
                  <AdminSyncButton />
                )}
                {/* Refresh manual simples */}
                <form action="/ao-vivo">
                  <button
                    type="submit"
                    className="text-[#4b5563] text-xs hover:text-[#9ca3af] transition-colors border border-[#1f2937] px-3 py-1.5 rounded-xl"
                  >
                    ↻
                  </button>
                </form>
              </div>
            </div>

            {matches.map(match => {
              const events = eventsByMatch[match.id] ?? []

              return (
                <div
                  key={match.id}
                  className="bg-[#0d1f12] border border-[#22c55e]/40 rounded-2xl overflow-hidden shadow-[0_0_32px_rgba(34,197,94,0.12)] animate-slide-up"
                >
                  <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-[#22c55e]/10">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                      <span className="text-[#22c55e] text-xs font-bold tracking-widest">AO VIVO</span>
                      {match.phase && (
                        <span className="text-[#374151] text-xs">· {match.phase}</span>
                      )}
                    </div>
                    <LiveClock
                      startsAt={match.starts_at}
                      lastMinute={match.minute}
                      status={match.status as 'live' | 'halftime'}
                    />
                  </div>

                  <div className="px-4 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 flex flex-col items-center gap-2">
                        <TeamFlag url={match.home_team.flag_url} name={match.home_team.name} />
                        <p className="text-[#f9fafb] text-sm font-bold text-center leading-tight">
                          {match.home_team.short_name || match.home_team.name}
                        </p>
                      </div>

                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-3">
                          <span className={`font-display text-6xl leading-none ${
                            match.home_score > match.away_score ? 'text-[#f9fafb]' : 'text-[#6b7280]'
                          }`}>{match.home_score}</span>
                          <span className="text-[#374151] text-3xl font-light">–</span>
                          <span className={`font-display text-6xl leading-none ${
                            match.away_score > match.home_score ? 'text-[#f9fafb]' : 'text-[#6b7280]'
                          }`}>{match.away_score}</span>
                        </div>
                        {match.stadium && (
                          <p className="text-[#374151] text-[10px] text-center mt-1">📍 {match.stadium}</p>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col items-center gap-2">
                        <TeamFlag url={match.away_team.flag_url} name={match.away_team.name} />
                        <p className="text-[#f9fafb] text-sm font-bold text-center leading-tight">
                          {match.away_team.short_name || match.away_team.name}
                        </p>
                      </div>
                    </div>
                  </div>

                  {events.length > 0 && (
                    <div className="px-4 pb-3 border-t border-[#22c55e]/10 pt-3">
                      <p className="text-[#374151] text-[10px] font-bold uppercase tracking-wider mb-2">Últimos eventos</p>
                      <div className="space-y-1.5">
                        {events.map((event, i) => {
                          const isHome = event.team_id === match.home_team_id
                          return (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <span className="text-[#4b5563] w-8 text-right shrink-0">
                                {event.minute !== null ? `${event.minute}'` : ''}
                              </span>
                              <span>{EVENT_ICONS[event.event_type] ?? '•'}</span>
                              <span className="text-[#9ca3af] flex-1 truncate">
                                {event.player_name ?? event.event_type}
                                <span className="text-[#4b5563]">
                                  {isHome
                                    ? ` (${match.home_team.short_name ?? match.home_team.name})`
                                    : ` (${match.away_team.short_name ?? match.away_team.name})`}
                                </span>
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <Link
                    href={`/jogos/${match.id}`}
                    className="flex items-center justify-center gap-2 py-3 border-t border-[#22c55e]/10 text-[#22c55e] text-sm font-semibold hover:bg-[#22c55e]/5 transition-colors"
                  >
                    Ver jogo completo →
                  </Link>
                </div>
              )
            })}

            <p className="text-center text-[#374151] text-xs">Atualiza automaticamente a cada 60s</p>
          </div>
        ) : (
          <EmptyState
            icon={<span className="text-5xl">📡</span>}
            title="Nenhum jogo ao vivo"
            description="Quando um jogo começar, ele aparece aqui automaticamente"
          />
        )}
      </div>
    </AppShell>
  )
}

function AdminSyncButton() {
  return (
    <a
      href="/api/sync/copa"
      className="text-[#22c55e] text-xs font-semibold border border-[#22c55e]/30 px-3 py-1.5 rounded-xl hover:bg-[#22c55e]/10 transition-colors"
    >
      ⚡ Sync
    </a>
  )
}
