// football-data.org v4 — gratuito, UTC real, Copa 2026
// Docs: https://www.football-data.org/documentation/quickstart

const BASE_URL = 'https://api.football-data.org/v4'
const API_KEY = process.env.FOOTBALL_DATA_KEY!
const TIMEOUT_MS = 10000

export interface FDMatch {
  id: number
  utcDate: string
  status: string
  stage: string
  group: string | null
  homeTeam: { id: number; name: string; shortName: string; tla: string; crest: string | null }
  awayTeam: { id: number; name: string; shortName: string; tla: string; crest: string | null }
  score: {
    winner: string | null
    fullTime: { home: number | null; away: number | null }
  }
}

export interface FDResponse<T> {
  data?: T
  error?: string
}

async function fdFetch<T>(path: string): Promise<FDResponse<T>> {
  if (!API_KEY) return { error: 'FOOTBALL_DATA_KEY não configurada' }

  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'X-Auth-Token': API_KEY },
      signal: controller.signal,
      next: { revalidate: 0 },
    })
    clearTimeout(id)

    if (res.status === 429) return { error: 'Limite de requisições atingido' }
    if (res.status === 403) return { error: 'Sem acesso a este recurso (plano insuficiente)' }
    if (!res.ok) return { error: `Erro ${res.status}` }

    const json = await res.json()
    return { data: json as T }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return { error: 'Timeout' }
    return { error: 'Erro de conexão' }
  }
}

function mapStatus(status: string): string {
  const map: Record<string, string> = {
    SCHEDULED: 'scheduled',
    TIMED: 'scheduled',
    IN_PLAY: 'live',
    PAUSED: 'halftime',
    FINISHED: 'finished',
    POSTPONED: 'postponed',
    CANCELLED: 'cancelled',
    SUSPENDED: 'cancelled',
  }
  return map[status] ?? 'scheduled'
}

function mapStage(stage: string, group: string | null): string {
  if (stage === 'GROUP_STAGE' && group) {
    return `Grupo ${group.replace('GROUP_', '')}`
  }
  const stages: Record<string, string> = {
    ROUND_OF_32: 'Oitavas de Final',
    ROUND_OF_16: 'Oitavas de Final',
    QUARTER_FINALS: 'Quartas de Final',
    SEMI_FINALS: 'Semifinal',
    THIRD_PLACE: 'Disputa 3º Lugar',
    FINAL: 'Final',
  }
  return stages[stage] ?? stage
}

export function mapFDMatch(m: FDMatch) {
  return {
    external_id: `fd_${m.id}`,
    home_team_name: m.homeTeam.name,
    home_team_short: m.homeTeam.tla,
    home_team_crest: m.homeTeam.crest,
    away_team_name: m.awayTeam.name,
    away_team_short: m.awayTeam.tla,
    away_team_crest: m.awayTeam.crest,
    starts_at: m.utcDate, // já é UTC
    status: mapStatus(m.status),
    phase: mapStage(m.stage, m.group),
    home_score: m.score.fullTime.home ?? 0,
    away_score: m.score.fullTime.away ?? 0,
  }
}

export async function fetchAllWCMatches(): Promise<FDResponse<FDMatch[]>> {
  const result = await fdFetch<{ matches: FDMatch[] }>('/competitions/WC/matches')
  if (result.error || !result.data) return { error: result.error }
  return { data: result.data.matches }
}

export async function fetchLiveWCMatches(): Promise<FDResponse<FDMatch[]>> {
  const result = await fdFetch<{ matches: FDMatch[] }>('/competitions/WC/matches?status=IN_PLAY,PAUSED')
  if (result.error || !result.data) return { error: result.error }
  return { data: result.data.matches }
}

export async function fetchFinishedWCMatches(): Promise<FDResponse<FDMatch[]>> {
  const result = await fdFetch<{ matches: FDMatch[] }>('/competitions/WC/matches?status=FINISHED')
  if (result.error || !result.data) return { error: result.error }
  return { data: result.data.matches }
}
