// API-Football (api-sports.io) — plano gratuito: 100 req/dia
// Copa do Mundo 2026: league=1, season=2026
// Docs: https://api-sports.io/documentation/football/v3

import type {
  ApiFutebolMatch,
  ApiFutebolEvent,
  ApiFutebolLineup,
  ApiFutebolResponse,
} from '@/types/api-futebol'

const BASE_URL = 'https://v3.football.api-sports.io'
const API_KEY = process.env.API_FUTEBOL_KEY!
const LEAGUE_ID = process.env.API_FUTEBOL_CAMPEONATO_ID || '1'
const SEASON = '2026'
const TIMEOUT_MS = 12000

async function apiFetch<T>(path: string): Promise<ApiFutebolResponse<T>> {
  if (!API_KEY || API_KEY.includes('sem-chave') || API_KEY.includes('sua-api')) {
    return { error: 'API Key não configurada. Adicione API_FUTEBOL_KEY no .env.local' }
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        'x-apisports-key': API_KEY,
      },
      signal: controller.signal,
      next: { revalidate: 0 },
    })

    clearTimeout(timeoutId)

    if (res.status === 429) {
      return { error: 'Limite de 100 requisições/dia atingido. Tente amanhã.' }
    }
    if (!res.ok) {
      return { error: `Erro ${res.status}: ${res.statusText}` }
    }

    const json = await res.json()

    if (json.errors && Object.keys(json.errors).length > 0) {
      return { error: Object.values(json.errors).join(', ') }
    }

    return { data: json.response as T }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { error: 'Timeout: API-Football não respondeu a tempo.' }
    }
    return { error: 'Erro de conexão com a API-Football.' }
  }
}

// Tipos da API-Football v3
interface ApiFootballFixture {
  fixture: {
    id: number
    date: string
    status: { short: string; elapsed: number | null }
    venue: { name: string | null }
  }
  league: { round: string }
  teams: {
    home: { id: number; name: string; logo: string }
    away: { id: number; name: string; logo: string }
  }
  goals: { home: number | null; away: number | null }
  score: { penalty: { home: number | null; away: number | null } }
}

interface ApiFootballEvent {
  time: { elapsed: number }
  team: { id: number }
  player: { name: string }
  assist: { name: string | null }
  type: string
  detail: string
}

interface ApiFootballLineupPlayer {
  player: { id: number; name: string; number: number; pos: string }
}

interface ApiFootballLineup {
  team: { id: number }
  coach: { name: string }
  formation: string
  startXI: ApiFootballLineupPlayer[]
  substitutes: ApiFootballLineupPlayer[]
}

function mapFixture(f: ApiFootballFixture): ApiFutebolMatch {
  return {
    partida_id: f.fixture.id,
    status: mapStatus(f.fixture.status.short),
    placar: f.goals.home !== null ? `${f.goals.home}:${f.goals.away}` : null,
    placar_mandante: f.goals.home,
    placar_visitante: f.goals.away,
    placar_penalti_mandante: f.score.penalty.home,
    placar_penalti_visitante: f.score.penalty.away,
    placar_oficial_mandante: f.goals.home,
    placar_oficial_visitante: f.goals.away,
    fase: f.league.round,
    estadio: f.fixture.venue.name,
    data_realizacao_iso: f.fixture.date,
    data_realizacao: null,
    hora_realizacao: null,
    minuto: f.fixture.status.elapsed?.toString() ?? null,
    time_mandante: {
      time_id: f.teams.home.id,
      nome_popular: f.teams.home.name,
      nome: f.teams.home.name,
      sigla: f.teams.home.name.substring(0, 3).toUpperCase(),
      escudo: f.teams.home.logo,
    },
    time_visitante: {
      time_id: f.teams.away.id,
      nome_popular: f.teams.away.name,
      nome: f.teams.away.name,
      sigla: f.teams.away.name.substring(0, 3).toUpperCase(),
      escudo: f.teams.away.logo,
    },
  }
}

function mapStatus(short: string): string {
  const map: Record<string, string> = {
    NS: 'nao_iniciada', TBD: 'nao_iniciada',
    '1H': 'em_andamento', '2H': 'em_andamento',
    ET: 'em_andamento', P: 'em_andamento',
    HT: 'intervalo',
    FT: 'finalizada', AET: 'finalizada', PEN: 'finalizada',
    AWD: 'finalizada', WO: 'finalizada',
    PST: 'adiada', CANC: 'cancelada', SUSP: 'cancelada', ABD: 'cancelada',
  }
  return map[short] ?? 'nao_iniciada'
}

export async function fetchMatches(): Promise<ApiFutebolResponse<ApiFutebolMatch[]>> {
  const result = await apiFetch<ApiFootballFixture[]>(
    `/fixtures?league=${LEAGUE_ID}&season=${SEASON}`
  )
  if (result.error || !result.data) return { error: result.error }
  return { data: result.data.map(mapFixture) }
}

export async function fetchLiveMatches(): Promise<ApiFutebolResponse<ApiFutebolMatch[]>> {
  const result = await apiFetch<ApiFootballFixture[]>(
    `/fixtures?live=all&league=${LEAGUE_ID}`
  )
  if (result.error || !result.data) return { error: result.error }
  return { data: result.data.map(mapFixture) }
}

export async function fetchMatchById(matchId: string): Promise<ApiFutebolResponse<ApiFutebolMatch>> {
  const result = await apiFetch<ApiFootballFixture[]>(`/fixtures?id=${matchId}`)
  if (result.error || !result.data) return { error: result.error }
  if (!result.data.length) return { error: 'Partida não encontrada' }
  return { data: mapFixture(result.data[0]) }
}

export async function fetchMatchEvents(matchId: string): Promise<ApiFutebolResponse<ApiFutebolEvent[]>> {
  const result = await apiFetch<ApiFootballEvent[]>(`/fixtures/events?fixture=${matchId}`)
  if (result.error || !result.data) return { error: result.error }

  const events: ApiFutebolEvent[] = result.data.map(e => ({
    evento_id: undefined,
    minuto: e.time.elapsed,
    tipo: mapEventType(e.type, e.detail),
    atleta: e.player.name,
    atleta_associado: e.assist.name,
    descricao: e.detail,
    time_id: e.team.id,
  }))

  return { data: events }
}

export async function fetchMatchLineups(matchId: string): Promise<ApiFutebolResponse<ApiFutebolLineup[]>> {
  const result = await apiFetch<ApiFootballLineup[]>(`/fixtures/lineups?fixture=${matchId}`)
  if (result.error || !result.data) return { error: result.error }

  const lineups: ApiFutebolLineup[] = result.data.map(l => ({
    time_id: l.team.id,
    escalacao: l.formation,
    tecnico: l.coach.name,
    atletas: [
      ...l.startXI.map(p => ({
        atleta_id: p.player.id,
        nome_popular: p.player.name,
        camisa: p.player.number,
        posicao: p.player.pos,
        titular: true,
      })),
      ...l.substitutes.map(p => ({
        atleta_id: p.player.id,
        nome_popular: p.player.name,
        camisa: p.player.number,
        posicao: p.player.pos,
        titular: false,
      })),
    ],
  }))

  return { data: lineups }
}

function mapEventType(type: string, detail: string): string {
  if (type === 'Goal') {
    if (detail === 'Own Goal') return 'gol_contra'
    if (detail === 'Penalty') return 'penalti'
    return 'gol'
  }
  if (type === 'Card') {
    if (detail === 'Yellow Card') return 'cartao_amarelo'
    return 'cartao_vermelho'
  }
  if (type === 'subst') return 'substituicao'
  if (type === 'Var') return 'var'
  return 'other'
}

// Verifica quantas requisições já foram usadas hoje
export async function checkApiUsage(): Promise<{ used: number; limit: number } | null> {
  if (!API_KEY) return null
  try {
    const res = await fetch(`${BASE_URL}/status`, {
      headers: { 'x-apisports-key': API_KEY },
    })
    const json = await res.json()
    return {
      used: json.response?.requests?.current ?? 0,
      limit: json.response?.requests?.limit_day ?? 100,
    }
  } catch {
    return null
  }
}
