import type { Match } from '@/types/match'
import { getStatusLabel } from '@/utils/match-status'
import { LiveBadge } from '@/components/ui/Badge'

interface ScoreboardProps {
  match: Match
  large?: boolean
}

export function Scoreboard({ match, large }: ScoreboardProps) {
  const isLive = match.status === 'live' || match.status === 'halftime'
  const isFinished = match.status === 'finished'
  const hasScore = isLive || isFinished

  return (
    <div className="bg-[#0d1117] rounded-2xl border border-[#1f2937] p-5">
      {/* Status */}
      <div className="flex items-center justify-center gap-3 mb-5">
        {isLive ? (
          <LiveBadge />
        ) : (
          <span className="text-[#6b7280] text-sm font-medium">{getStatusLabel(match.status)}</span>
        )}
        {isLive && match.minute && (
          <span className="font-display text-lg text-[#22c55e]">{match.minute}'</span>
        )}
      </div>

      {/* Main score */}
      <div className="flex items-center justify-between gap-4">
        {/* Home */}
        <div className="flex-1 flex flex-col items-center gap-2">
          {match.home_team.flag_url ? (
            <img
              src={match.home_team.flag_url}
              alt={match.home_team.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-[#1f2937]"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#1f2937] flex items-center justify-center text-2xl">⚽</div>
          )}
          <p className="text-[#f9fafb] font-bold text-sm text-center">{match.home_team.name}</p>
          {match.home_team.short_name && (
            <span className="text-[#6b7280] text-xs">{match.home_team.short_name}</span>
          )}
        </div>

        {/* Score */}
        <div className="flex flex-col items-center">
          {hasScore ? (
            <div className="flex items-center gap-3">
              <span className={`font-display leading-none ${large ? 'text-7xl' : 'text-5xl'} text-[#f9fafb]`}>
                {match.home_score}
              </span>
              <span className="text-[#374151] text-3xl">:</span>
              <span className={`font-display leading-none ${large ? 'text-7xl' : 'text-5xl'} text-[#f9fafb]`}>
                {match.away_score}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-[#374151]">
              <span className={`font-display leading-none ${large ? 'text-7xl' : 'text-5xl'}`}>-</span>
              <span className="text-3xl">:</span>
              <span className={`font-display leading-none ${large ? 'text-7xl' : 'text-5xl'}`}>-</span>
            </div>
          )}
          {match.home_penalty_score !== null && match.away_penalty_score !== null && (
            <p className="text-[#6b7280] text-sm mt-1">
              ({match.home_penalty_score} : {match.away_penalty_score} pen.)
            </p>
          )}
          {match.phase && (
            <p className="text-[#4b5563] text-xs mt-2 text-center">{match.phase}</p>
          )}
          {match.stadium && (
            <p className="text-[#4b5563] text-xs mt-0.5 text-center">📍 {match.stadium}</p>
          )}
        </div>

        {/* Away */}
        <div className="flex-1 flex flex-col items-center gap-2">
          {match.away_team.flag_url ? (
            <img
              src={match.away_team.flag_url}
              alt={match.away_team.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-[#1f2937]"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#1f2937] flex items-center justify-center text-2xl">⚽</div>
          )}
          <p className="text-[#f9fafb] font-bold text-sm text-center">{match.away_team.name}</p>
          {match.away_team.short_name && (
            <span className="text-[#6b7280] text-xs">{match.away_team.short_name}</span>
          )}
        </div>
      </div>
    </div>
  )
}
