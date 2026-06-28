import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, getCurrentProfile } from '@/lib/supabase/server'
import { AppShell, TopBar } from '@/components/Navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { StandingsTabs } from '@/components/classificacao/StandingsTabs'
import { getKnockoutPhase, isKnockoutPhase, KNOCKOUT_PHASES, penaltyAdvancer } from '@/utils/phase'

interface TeamStanding {
  team_id: string
  team_name: string
  short_name: string | null
  flag_url: string | null
  played: number
  wins: number
  draws: number
  losses: number
  goals_for: number
  goals_against: number
  goal_diff: number
  points: number
}

type MatchRow = {
  id: string
  phase: string | null
  status: string
  home_score: number | null
  away_score: number | null
  home_team: { id: string; name: string; short_name: string | null; flag_url: string | null }
  away_team: { id: string; name: string; short_name: string | null; flag_url: string | null }
}

function normalizeTeamKey(name: string): string {
  // Normaliza para deduplicar times com nome em inglês e português
  return name.toLowerCase()
    .replace(/ã/g, 'a').replace(/á/g, 'a').replace(/â/g, 'a').replace(/à/g, 'a')
    .replace(/é/g, 'e').replace(/ê/g, 'e')
    .replace(/í/g, 'i')
    .replace(/ó/g, 'o').replace(/ô/g, 'o')
    .replace(/ú/g, 'u').replace(/ü/g, 'u')
    .replace(/ç/g, 'c')
    .trim()
}

function computeH2H(
  teamA: string, teamB: string,
  matches: MatchRow[]
): { pointsA: number; pointsB: number; gdA: number; gdB: number; gfA: number; gfB: number } {
  let pA = 0, pB = 0, gdA = 0, gdB = 0, gfA = 0, gfB = 0

  for (const m of matches) {
    const hKey = normalizeTeamKey(m.home_team.name)
    const aKey = normalizeTeamKey(m.away_team.name)
    const hs = m.home_score ?? 0
    const as_ = m.away_score ?? 0

    if ((hKey === teamA && aKey === teamB) || (hKey === teamB && aKey === teamA)) {
      const isAHome = hKey === teamA
      const aGoals = isAHome ? hs : as_
      const bGoals = isAHome ? as_ : hs

      gfA += aGoals; gfB += bGoals
      gdA += aGoals - bGoals; gdB += bGoals - aGoals

      if (aGoals > bGoals) pA += 3
      else if (aGoals === bGoals) { pA += 1; pB += 1 }
      else pB += 3
    }
  }

  return { pointsA: pA, pointsB: pB, gdA, gdB, gfA, gfB }
}

async function getGroupStandings(): Promise<Record<string, TeamStanding[]>> {
  const supabase = createAdminClient()

  // Busca TODOS os jogos da fase de grupos (inclusive agendados)
  // para montar a estrutura completa, mas só conta pts dos finalizados
  const { data: rawMatches } = await supabase
    .from('matches')
    .select(`
      id, phase, home_score, away_score, status,
      home_team:teams!matches_home_team_id_fkey(id, name, short_name, flag_url),
      away_team:teams!matches_away_team_id_fkey(id, name, short_name, flag_url)
    `)
    .not('status', 'in', '("cancelled","postponed")')
    .like('phase', 'Grupo%')

  if (!rawMatches?.length) return {}

  const matches = rawMatches as unknown as MatchRow[]

  // Agrupa por nome normalizado para evitar duplicatas de times
  const standings: Record<string, Record<string, TeamStanding>> = {}

  for (const match of matches) {
    const group = match.phase ?? 'Grupo ?'
    const home = match.home_team
    const away = match.away_team
    const hs = match.home_score ?? 0
    const as_ = match.away_score ?? 0

    if (!standings[group]) standings[group] = {}

    const hKey = normalizeTeamKey(home.name)
    const aKey = normalizeTeamKey(away.name)

    if (!standings[group][hKey]) {
      standings[group][hKey] = { team_id: home.id, team_name: home.name, short_name: home.short_name, flag_url: home.flag_url, played: 0, wins: 0, draws: 0, losses: 0, goals_for: 0, goals_against: 0, goal_diff: 0, points: 0 }
    }
    if (!standings[group][aKey]) {
      standings[group][aKey] = { team_id: away.id, team_name: away.name, short_name: away.short_name, flag_url: away.flag_url, played: 0, wins: 0, draws: 0, losses: 0, goals_for: 0, goals_against: 0, goal_diff: 0, points: 0 }
    }

    // Prefere o time com bandeira se houver duplicata
    if (home.flag_url && !standings[group][hKey].flag_url) {
      standings[group][hKey].flag_url = home.flag_url
      standings[group][hKey].team_name = home.name
      standings[group][hKey].short_name = home.short_name
    }
    if (away.flag_url && !standings[group][aKey].flag_url) {
      standings[group][aKey].flag_url = away.flag_url
      standings[group][aKey].team_name = away.name
      standings[group][aKey].short_name = away.short_name
    }

    const h = standings[group][hKey]
    const a = standings[group][aKey]

    // Só conta estatísticas de jogos finalizados
    if (match.status === 'finished') {
      h.played++; a.played++
      h.goals_for += hs; h.goals_against += as_
      a.goals_for += as_; a.goals_against += hs

      if (hs > as_) { h.wins++; h.points += 3; a.losses++ }
      else if (hs === as_) { h.draws++; h.points++; a.draws++; a.points++ }
      else { a.wins++; a.points += 3; h.losses++ }

      h.goal_diff = h.goals_for - h.goals_against
      a.goal_diff = a.goals_for - a.goals_against
    }
  }

  // Ordena com critérios oficiais da Copa 2026:
  // pts → saldo → gols → confronto direto (pts, saldo, gols) → alfabético pt-BR
  const result: Record<string, TeamStanding[]> = {}
  for (const [group, teamsMap] of Object.entries(standings)) {
    const groupMatches = matches.filter(m => m.phase === group && m.status === 'finished')
    const teamList = Object.values(teamsMap)

    teamList.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.goal_diff !== a.goal_diff) return b.goal_diff - a.goal_diff
      if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for

      // Confronto direto entre os dois times empatados
      const aKey = normalizeTeamKey(a.team_name)
      const bKey = normalizeTeamKey(b.team_name)
      const h2h = computeH2H(aKey, bKey, groupMatches)

      if (h2h.pointsA !== h2h.pointsB) return h2h.pointsB - h2h.pointsA
      if (h2h.gdA !== h2h.gdB) return h2h.gdB - h2h.gdA
      if (h2h.gfA !== h2h.gfB) return h2h.gfB - h2h.gfA

      return a.team_name.localeCompare(b.team_name, 'pt-BR')
    })

    result[group] = teamList
  }

  return Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b, 'pt-BR')))
}

type KnockoutMatch = {
  id: string
  phase: string | null
  status: string
  starts_at: string
  home_score: number | null
  away_score: number | null
  home_penalty_score: number | null
  away_penalty_score: number | null
  home_team: { id: string; name: string; short_name: string | null; flag_url: string | null }
  away_team: { id: string; name: string; short_name: string | null; flag_url: string | null }
}

async function getKnockoutMatches(): Promise<{ label: string; key: string; matches: KnockoutMatch[] }[]> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('matches')
    .select(`
      id, phase, status, starts_at, home_score, away_score, home_penalty_score, away_penalty_score,
      home_team:teams!matches_home_team_id_fkey(id, name, short_name, flag_url),
      away_team:teams!matches_away_team_id_fkey(id, name, short_name, flag_url)
    `)
    .not('status', 'in', '("cancelled")')
    .order('starts_at')

  const all = (data ?? []) as unknown as KnockoutMatch[]
  const knockout = all.filter((m) => isKnockoutPhase(m.phase))

  // Agrupa por fase canônica, na ordem oficial (Fase de 32 → Final)
  return KNOCKOUT_PHASES.map((phase) => ({
    label: phase.label,
    key: phase.key,
    matches: knockout.filter((m) => getKnockoutPhase(m.phase)?.key === phase.key),
  })).filter((group) => group.matches.length > 0)
}

export default async function ClassificacaoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile(user.id)
  const isAdmin = profile?.role === 'admin'

  const standings = await getGroupStandings()
  const groups = Object.entries(standings)
  const knockoutGroups = await getKnockoutMatches()

  return (
    <AppShell isAdmin={isAdmin}>
      <TopBar title="Classificação" />

      <div className="px-4 pt-4 pb-6 max-w-2xl mx-auto">
        <StandingsTabs
          hasKnockout={knockoutGroups.length > 0}
          knockoutView={<KnockoutBracket groups={knockoutGroups} />}
          groupsView={
            <div className="space-y-6">
              {groups.length === 0 ? (
          <div className="text-center py-16 text-[#4b5563]">
            <p className="text-4xl mb-3">📊</p>
            <p className="font-semibold text-[#6b7280]">Nenhuma partida finalizada ainda</p>
            <p className="text-sm mt-1">A tabela aparece conforme os jogos são concluídos</p>
          </div>
        ) : (
          groups.map(([groupName, teams], gi) => (
            <div key={groupName} className="animate-slide-up" style={{ animationDelay: `${gi * 60}ms` }}>
              <h2 className="text-[#F5C518] font-display text-xl tracking-wider mb-2">{groupName.toUpperCase()}</h2>

              <div className="bg-[#111827] border border-[#1f2937] rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center px-3 py-2 border-b border-[#1f2937] text-[#4b5563] text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-6 text-center">#</span>
                  <span className="flex-1 ml-2">Seleção</span>
                  <span className="w-6 text-center">J</span>
                  <span className="w-6 text-center">V</span>
                  <span className="w-6 text-center">E</span>
                  <span className="w-6 text-center">D</span>
                  <span className="w-8 text-center">GP</span>
                  <span className="w-8 text-center">GC</span>
                  <span className="w-8 text-center">SG</span>
                  <span className="w-8 text-center font-bold text-[#F5C518]">P</span>
                </div>

                {teams.map((team, idx) => {
                  const isQualified = idx < 2
                  const isEliminated = team.played >= 2 && !isQualified && teams[1]?.points !== undefined &&
                    (teams.length - 1 - idx) < 2

                  return (
                    <div
                      key={team.team_id}
                      className={`flex items-center px-3 py-2.5 border-b border-[#0d1117] last:border-0 ${
                        isQualified ? 'bg-[#22c55e]/5' : ''
                      }`}
                    >
                      <span className={`w-6 text-center text-xs font-bold ${
                        idx === 0 ? 'text-[#F5C518]' : idx === 1 ? 'text-[#9ca3af]' : 'text-[#4b5563]'
                      }`}>{idx + 1}</span>

                      <div className="flex-1 flex items-center gap-2 ml-2 min-w-0">
                        {team.flag_url ? (
                          <img src={team.flag_url} alt={team.team_name} className="w-6 h-4 object-cover rounded-sm shrink-0" />
                        ) : (
                          <span className="text-sm">🏳️</span>
                        )}
                        <span className={`text-xs font-semibold truncate ${isQualified ? 'text-[#f9fafb]' : 'text-[#9ca3af]'}`}>
                          {team.short_name || team.team_name}
                        </span>
                        {isQualified && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] shrink-0" title="Classificado" />
                        )}
                      </div>

                      <span className="w-6 text-center text-xs text-[#6b7280]">{team.played}</span>
                      <span className="w-6 text-center text-xs text-[#6b7280]">{team.wins}</span>
                      <span className="w-6 text-center text-xs text-[#6b7280]">{team.draws}</span>
                      <span className="w-6 text-center text-xs text-[#6b7280]">{team.losses}</span>
                      <span className="w-8 text-center text-xs text-[#6b7280]">{team.goals_for}</span>
                      <span className="w-8 text-center text-xs text-[#6b7280]">{team.goals_against}</span>
                      <span className={`w-8 text-center text-xs font-medium ${
                        team.goal_diff > 0 ? 'text-[#22c55e]' : team.goal_diff < 0 ? 'text-[#ef4444]' : 'text-[#6b7280]'
                      }`}>
                        {team.goal_diff > 0 ? `+${team.goal_diff}` : team.goal_diff}
                      </span>
                      <span className="w-8 text-center text-sm font-bold text-[#F5C518]">{team.points}</span>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center gap-3 mt-1.5 px-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
                  <span className="text-[#4b5563] text-[10px]">Classificado</span>
                </div>
              </div>
            </div>
          ))
              )}
            </div>
          }
        />
      </div>
    </AppShell>
  )
}

function KnockoutBracket({
  groups,
}: {
  groups: { label: string; key: string; matches: KnockoutMatch[] }[]
}) {
  if (groups.length === 0) {
    return (
      <div className="text-center py-16 text-[#4b5563]">
        <p className="text-4xl mb-3">🏆</p>
        <p className="font-semibold text-[#6b7280]">Mata-mata ainda não começou</p>
        <p className="text-sm mt-1">Os jogos eliminatórios aparecem aqui quando forem cadastrados</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {groups.map((group, gi) => (
        <div key={group.key} className="animate-slide-up" style={{ animationDelay: `${gi * 60}ms` }}>
          <h2 className="text-[#F5C518] font-display text-xl tracking-wider mb-2">
            {group.label.toUpperCase()}
          </h2>
          <div className="space-y-2">
            {group.matches.map((m) => (
              <KnockoutMatchCard key={m.id} match={m} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function KnockoutTeamRow({
  team,
  score,
  pen,
  isWinner,
  hasPens,
  showScore,
}: {
  team: { name: string; short_name: string | null; flag_url: string | null }
  score: number | null
  pen: number | null
  isWinner: boolean
  hasPens: boolean
  showScore: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      {team.flag_url ? (
        <img src={team.flag_url} alt="" className="w-6 h-4 object-cover rounded-sm shrink-0" />
      ) : (
        <span className="text-sm">🏳️</span>
      )}
      <span className={`flex-1 text-sm font-semibold truncate ${isWinner ? 'text-[#f9fafb]' : 'text-[#9ca3af]'}`}>
        {team.short_name || team.name}
      </span>
      {hasPens && pen !== null && (
        <span className="text-[10px] text-[#6b7280]">({pen})</span>
      )}
      <span className={`w-5 text-right font-display text-lg ${isWinner ? 'text-[#F5C518]' : 'text-[#6b7280]'}`}>
        {showScore ? score ?? 0 : '–'}
      </span>
    </div>
  )
}

function KnockoutMatchCard({ match: m }: { match: KnockoutMatch }) {
  const finished = m.status === 'finished'
  const live = m.status === 'live' || m.status === 'halftime'
  const advancer = penaltyAdvancer(m.home_penalty_score, m.away_penalty_score)
  const hasPens = advancer !== null
  const showScore = finished || live

  // Quem avançou: pênaltis decidem; senão maior placar no tempo (se finalizado)
  let winnerSide: 'home' | 'away' | null = null
  if (hasPens) winnerSide = advancer
  else if (finished && (m.home_score ?? 0) !== (m.away_score ?? 0)) {
    winnerSide = (m.home_score ?? 0) > (m.away_score ?? 0) ? 'home' : 'away'
  }

  const dateLabel = new Date(m.starts_at).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })

  return (
    <Link
      href={`/jogos/${m.id}`}
      className="block bg-[#111827] border border-[#1f2937] rounded-2xl px-3 py-2.5 hover:border-[#374151] transition-colors"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-[#4b5563]">{dateLabel}</span>
        {live ? (
          <span className="text-[10px] font-bold text-[#ef4444]">● AO VIVO</span>
        ) : finished ? (
          <span className="text-[10px] font-semibold text-[#6b7280]">
            {hasPens ? 'Pênaltis' : 'Encerrado'}
          </span>
        ) : (
          <span className="text-[10px] text-[#4b5563]">Agendado</span>
        )}
      </div>
      <div className="space-y-1">
        <KnockoutTeamRow
          team={m.home_team}
          score={m.home_score}
          pen={m.home_penalty_score}
          isWinner={winnerSide === 'home'}
          hasPens={hasPens}
          showScore={showScore}
        />
        <KnockoutTeamRow
          team={m.away_team}
          score={m.away_score}
          pen={m.away_penalty_score}
          isWinner={winnerSide === 'away'}
          hasPens={hasPens}
          showScore={showScore}
        />
      </div>
    </Link>
  )
}
