import type { MatchStatus } from '@/types/match'

export function getStatusLabel(status: MatchStatus): string {
  const labels: Record<MatchStatus, string> = {
    scheduled: 'Agendado',
    live: 'Ao Vivo',
    halftime: 'Intervalo',
    finished: 'Encerrado',
    postponed: 'Adiado',
    cancelled: 'Cancelado',
  }
  return labels[status]
}

export function getStatusColor(status: MatchStatus): string {
  switch (status) {
    case 'live': return 'text-green-400'
    case 'halftime': return 'text-yellow-400'
    case 'finished': return 'text-slate-400'
    case 'postponed': return 'text-orange-400'
    case 'cancelled': return 'text-red-400'
    default: return 'text-blue-400'
  }
}

export function isMatchLocked(startsAt: string): boolean {
  return new Date(startsAt) <= new Date()
}

export function canPredict(status: MatchStatus, startsAt: string): boolean {
  if (['live', 'halftime', 'finished', 'postponed', 'cancelled'].includes(status)) return false
  return !isMatchLocked(startsAt)
}

export function mapApiStatusToLocal(apiStatus: string): MatchStatus {
  const map: Record<string, MatchStatus> = {
    'nao_iniciada': 'scheduled',
    'em_andamento': 'live',
    'intervalo': 'halftime',
    'encerrada': 'finished',
    'finalizada': 'finished',
    'adiada': 'postponed',
    'cancelada': 'cancelled',
  }
  return map[apiStatus.toLowerCase()] ?? 'scheduled'
}
