'use client'

import Link from 'next/link'
import type { Match } from '@/types/match'
import { LiveBadge } from '@/components/ui/Badge'

interface LiveMatchCardProps {
  match: Match
  events?: Array<{ minute: number | null; event_type: string; player_name: string | null; team_id: string | null }>
}

const EVENT_ICONS: Record<string, string> = {
  goal: '⚽',
  own_goal: '⚽',
  penalty: '🎯',
  yellow_card: '🟨',
  red_card: '🟥',
  substitution: '🔄',
  var: '📺',
  other: '•',
}

export function LiveMatchCard({ match, events = [] }: LiveMatchCardProps) {
  const recentEvents = events.slice(-3).reverse()

  return (
    <Link href={`/jogos/${match.id}`}>
      <div className="bg-[#111827] rounded-2xl border border-[#22c55e]/40 shadow-[0_0_32px_rgba(34,197,94,0.12)] p-4 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <LiveBadge />
          <span className="text-[#22c55e] text-sm font-bold font-display tracking-wider">
            {match.status === 'halftime' ? 'INTERVALO' : `${match.minute || 0}'`}
          </span>
        </div>

        {/* Teams + Score */}
        <div className="flex items-center gap-2">
          <div className="flex-1 text-right">
            <p className="text-[#f9fafb] font-semibold text-sm leading-tight">
              {match.home_team.short_name || match.home_team.name}
            </p>
          </div>

          <div className="flex items-center gap-3 px-3">
            <span className="font-display text-5xl text-[#f9fafb] leading-none">{match.home_score}</span>
            <span className="text-[#374151] text-2xl font-light">:</span>
            <span className="font-display text-5xl text-[#f9fafb] leading-none">{match.away_score}</span>
          </div>

          <div className="flex-1">
            <p className="text-[#f9fafb] font-semibold text-sm leading-tight">
              {match.away_team.short_name || match.away_team.name}
            </p>
          </div>
        </div>

        {/* Recent events */}
        {recentEvents.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#1f2937] space-y-1.5">
            {recentEvents.map((event, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-[#9ca3af]">
                <span>{event.minute ? `${event.minute}'` : ''}</span>
                <span>{EVENT_ICONS[event.event_type] || '•'}</span>
                <span className="truncate">{event.player_name || event.event_type}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 text-center">
          <span className="text-[#22c55e] text-xs font-semibold">Ver detalhes →</span>
        </div>
      </div>
    </Link>
  )
}
