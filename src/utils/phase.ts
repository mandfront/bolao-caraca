// Detecção e normalização de fases (grupos x mata-mata).
// `phase` é texto livre em `matches.phase`: vem da API em inglês (ex.: "Round of 32")
// ou é digitado pelo admin em português. Aqui reconhecemos as duas formas.

export interface KnockoutPhase {
  key: string
  label: string // rótulo exibido (pt-BR)
  order: number
  aliases: string[] // formas normalizadas reconhecidas
}

export const KNOCKOUT_PHASES: KnockoutPhase[] = [
  { key: 'r32', label: 'Fase de 32', order: 1, aliases: ['fase de 32', '16 avos de final', '16 avos', '16avos', 'round of 32', 'last 32', '1/16'] },
  { key: 'r16', label: 'Oitavas de final', order: 2, aliases: ['oitavas de final', 'oitavas', 'round of 16', 'last 16', '1/8'] },
  { key: 'qf', label: 'Quartas de final', order: 3, aliases: ['quartas de final', 'quartas', 'quarter finals', 'quarterfinals', 'last 8', '1/4'] },
  { key: 'sf', label: 'Semifinal', order: 4, aliases: ['semifinais', 'semifinal', 'semi finals', 'semifinals', 'last 4', '1/2'] },
  { key: '3rd', label: 'Disputa de 3º lugar', order: 5, aliases: ['disputa de 3 lugar', 'terceiro lugar', '3rd place', 'third place', '3 lugar', 'play off for third place'] },
  { key: 'final', label: 'Final', order: 6, aliases: ['final'] },
]

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[º°ª]/g, '') // remove º ° ª
    .replace(/[_-]+/g, ' ') // separadores viram espaco (LAST_32 -> 'last 32')
    .replace(/\s+/g, ' ') // colapsa espacos
    .trim()
}

export function isGroupPhase(phase: string | null | undefined): boolean {
  if (!phase) return false
  const n = normalize(phase)
  return n.startsWith('grupo') || n.startsWith('group')
}

export function getKnockoutPhase(phase: string | null | undefined): KnockoutPhase | null {
  if (!phase) return null
  const n = normalize(phase)
  for (const p of KNOCKOUT_PHASES) {
    if (p.aliases.some((a) => n === a || n.includes(a))) return p
  }
  return null
}

export function isKnockoutPhase(phase: string | null | undefined): boolean {
  return getKnockoutPhase(phase) !== null
}

// Time que avançou de fato, quando o jogo foi decidido nos pênaltis.
// Retorna null se não houve pênaltis (placares de pênalti ausentes ou empatados).
export function penaltyAdvancer(
  homePenalty: number | null | undefined,
  awayPenalty: number | null | undefined
): 'home' | 'away' | null {
  if (homePenalty == null || awayPenalty == null) return null
  if (homePenalty === awayPenalty) return null
  return homePenalty > awayPenalty ? 'home' : 'away'
}
