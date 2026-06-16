'use client'

import Link from 'next/link'
import type { Match } from '@/types/match'
import { LiveBadge } from '@/components/ui/Badge'

interface LiveMatchCardProps {
  match: Match
}

export function LiveMatchCard({ match }: LiveMatchCardProps) {
  const isHalftime = match.status === 'halftime'

  return (
    <Link href={`/jogos/${match.id}`} className="block">
      <div className={`rounded-2xl border p-4 animate-slide-up transition-all ${
        isHalftime
          ? 'bg-[#1f1d0d] border-[#F5C518]/40'
          : 'bg-[#0d1f12] border-[#22c55e]/40 shadow-[0_0_28px_rgba(34,197,94,0.15)]'
      }`}>
        <div className="flex items-center justify-between mb-3">
          {isHalftime ? (
            <span className="text-[#F5C518] text-xs font-bold tracking-widest animate-pulse">⏸ INTERVALO</span>
          ) : (
            <LiveBadge />
          )}
          {!isHalftime && (
            <span className="text-[#22c55e] text-sm font-bold font-display tracking-wider">
              {match.minute || 0}&apos;
            </span>
          )}
          {match.phase && (
            <span className="text-[#4b5563] text-xs">{match.phase}</span>
          )}
        </div>

        {/* Teams + Score com bandeiras */}
        <div className="flex items-center gap-2">
          {/* Home */}
          <div className="flex-1 flex items-center gap-2 justify-end">
            <p className="text-[#f9fafb] font-bold text-sm text-right truncate">
              {match.home_team.short_name || match.home_team.name}
            </p>
            {match.home_team.flag_url ? (
              <img
                src={match.home_team.flag_url}
                alt={match.home_team.name}
                className="w-10 h-7 rounded object-cover shrink-0"
              />
            ) : (
              <span className="text-xl shrink-0">🏳️</span>
            )}
          </div>

          {/* Score */}
          <div className="flex items-center gap-2 px-3">
            <span className={`font-display text-4xl leading-none ${
              match.home_score > match.away_score ? 'text-[#f9fafb]' : 'text-[#9ca3af]'
            }`}>{match.home_score}</span>
            <span className="text-[#374151] text-xl">:</span>
            <span className={`font-display text-4xl leading-none ${
              match.away_score > match.home_score ? 'text-[#f9fafb]' : 'text-[#9ca3af]'
            }`}>{match.away_score}</span>
          </div>

          {/* Away */}
          <div className="flex-1 flex items-center gap-2">
            {match.away_team.flag_url ? (
              <img
                src={match.away_team.flag_url}
                alt={match.away_team.name}
                className="w-10 h-7 rounded object-cover shrink-0"
              />
            ) : (
              <span className="text-xl shrink-0">🏳️</span>
            )}
            <p className="text-[#f9fafb] font-bold text-sm truncate">
              {match.away_team.short_name || match.away_team.name}
            </p>
          </div>
        </div>

        <div className="mt-3 text-center">
          <span className={`text-xs font-semibold ${isHalftime ? 'text-[#F5C518]' : 'text-[#22c55e]'}`}>
            Ver detalhes →
          </span>
        </div>
      </div>
    </Link>
  )
}
