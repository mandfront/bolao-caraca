import type { Tables } from '@/types/database'

interface MatchTimelineProps {
  events: Tables<'match_events'>[]
  homeTeamId: string
  awayTeamId: string
}

const EVENT_CONFIG: Record<string, { icon: string; label: string }> = {
  goal: { icon: '⚽', label: 'Gol' },
  own_goal: { icon: '⚽', label: 'Gol contra' },
  penalty: { icon: '🎯', label: 'Pênalti' },
  yellow_card: { icon: '🟨', label: 'Cartão amarelo' },
  red_card: { icon: '🟥', label: 'Cartão vermelho' },
  substitution: { icon: '🔄', label: 'Substituição' },
  var: { icon: '📺', label: 'VAR' },
  other: { icon: '•', label: 'Evento' },
}

export function MatchTimeline({ events, homeTeamId }: MatchTimelineProps) {
  if (!events.length) {
    return (
      <div className="text-center py-8 text-[#4b5563] text-sm">
        Nenhum evento registrado ainda
      </div>
    )
  }

  const sorted = [...events].sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))

  return (
    <div className="space-y-1">
      {sorted.map((event) => {
        const config = EVENT_CONFIG[event.event_type] ?? EVENT_CONFIG.other
        const isHome = event.team_id === homeTeamId

        return (
          <div
            key={event.id}
            className={`flex items-center gap-3 py-2 px-3 rounded-xl ${
              event.event_type === 'goal' || event.event_type === 'penalty'
                ? 'bg-[#22c55e]/8 border border-[#22c55e]/20'
                : 'hover:bg-[#1f2937]/50'
            }`}
          >
            {/* Minute */}
            <span className="text-[#6b7280] text-xs font-bold w-8 text-right shrink-0">
              {event.minute !== null ? `${event.minute}'` : '-'}
            </span>

            {isHome ? (
              <>
                <span className="text-base">{config.icon}</span>
                <div className="flex-1">
                  <p className="text-[#f9fafb] text-sm font-medium">{event.player_name || config.label}</p>
                  {event.assist_player_name && (
                    <p className="text-[#6b7280] text-xs">Assistência: {event.assist_player_name}</p>
                  )}
                </div>
                <span className="text-[#4b5563] text-xs w-16 text-right" />
              </>
            ) : (
              <>
                <span className="text-[#4b5563] text-xs w-16 text-left" />
                <div className="flex-1 text-right">
                  <p className="text-[#f9fafb] text-sm font-medium">{event.player_name || config.label}</p>
                  {event.assist_player_name && (
                    <p className="text-[#6b7280] text-xs">Assistência: {event.assist_player_name}</p>
                  )}
                </div>
                <span className="text-base">{config.icon}</span>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
