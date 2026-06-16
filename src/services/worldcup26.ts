// worldcup26.ir — API gratuita, sem chave, Copa do Mundo 2026
// Cobre: jogos, placares, grupos, status
// Não cobre: escalações, eventos detalhados

const BASE_URL = 'https://worldcup26.ir'
const TIMEOUT_MS = 22000

interface WC26Match {
  id: string
  home_team_name_en: string
  home_team_name_pt?: string
  away_team_name_en: string
  away_team_name_pt?: string
  home_score: string | null
  away_score: string | null
  local_date: string       // formato: MM/DD/YYYY HH:MM (hora local EUA)
  finished: string         // "TRUE" | "FALSE"
  time_elapsed: string     // "notstarted" | "HT" | "90" | etc
  stadium_id: string
  type: string             // "group" | "r32" | "r16" | "qf" | "sf" | "final" | "third"
  group?: string
  home_team_flag?: string
  away_team_flag?: string
}

export interface WC26MappedMatch {
  external_id: string
  home_team_name: string
  away_team_name: string
  starts_at: string        // ISO 8601
  home_score: number
  away_score: number
  status: 'scheduled' | 'live' | 'halftime' | 'finished' | 'postponed' | 'cancelled'
  minute: number | null
  phase: string
  home_flag: string | null
  away_flag: string | null
}

function parseWC26Date(localDate: string): string {
  // worldcup26.ir retorna hora LOCAL do estádio (maioria EDT = UTC-4)
  // Salvamos como UTC convertendo de EDT para UTC (adicionando 4h)
  const [datePart, timePart] = localDate.split(' ')
  const [month, day, year] = datePart.split('/')
  const [hour, minute] = (timePart ?? '00:00').split(':')

  // Constrói data em EDT (UTC-4) e converte para UTC
  const edtDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00-04:00`)
  return edtDate.toISOString()
}

function mapStatus(match: WC26Match): WC26MappedMatch['status'] {
  if (match.finished === 'TRUE') return 'finished'
  const elapsed = match.time_elapsed?.toLowerCase()
  if (!elapsed || elapsed === 'notstarted') return 'scheduled'
  if (elapsed === 'ht') return 'halftime'
  return 'live'
}

function mapPhase(type: string, group?: string): string {
  const phases: Record<string, string> = {
    group: group ? `Grupo ${group}` : 'Fase de Grupos',
    r32: 'Oitavas de Final',
    r16: 'Oitavas de Final',
    qf: 'Quartas de Final',
    sf: 'Semifinal',
    third: 'Disputa de 3º lugar',
    final: 'Final',
  }
  return phases[type] ?? type
}

function mapMatch(m: WC26Match): WC26MappedMatch {
  return {
    external_id: `wc26_${m.id}`,
    home_team_name: m.home_team_name_en,
    away_team_name: m.away_team_name_en,
    starts_at: parseWC26Date(m.local_date),
    home_score: parseInt(m.home_score ?? '0') || 0,
    away_score: parseInt(m.away_score ?? '0') || 0,
    status: mapStatus(m),
    minute: m.time_elapsed && m.time_elapsed !== 'notstarted' && m.time_elapsed !== 'HT'
      ? parseInt(m.time_elapsed) || null
      : null,
    phase: mapPhase(m.type, m.group),
    home_flag: m.home_team_flag ?? null,
    away_flag: m.away_team_flag ?? null,
  }
}

async function fetchWC26<T>(path: string): Promise<{ data?: T; error?: string }> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const res = await fetch(`${BASE_URL}${path}`, {
      signal: controller.signal,
      next: { revalidate: 0 },
    })
    clearTimeout(timeoutId)
    if (!res.ok) return { error: `Erro ${res.status}` }
    const json = await res.json()
    // API retorna { games: [...] } ou array direto
    const data = Array.isArray(json) ? json : (json.games ?? json.data ?? json)
    return { data }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return { error: 'Timeout' }
    return { error: 'Erro de conexão' }
  }
}

export async function fetchAllMatches(): Promise<{ data?: WC26MappedMatch[]; error?: string }> {
  const result = await fetchWC26<WC26Match[]>('/get/games')
  if (result.error || !result.data) return { error: result.error }
  return { data: result.data.map(mapMatch) }
}

export async function fetchLiveMatches(): Promise<{ data?: WC26MappedMatch[]; error?: string }> {
  const result = await fetchWC26<WC26Match[]>('/get/games/live')
  if (result.error || !result.data) return { error: result.error }
  return { data: result.data.map(mapMatch) }
}
