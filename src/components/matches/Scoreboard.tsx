import type { Match } from '@/types/match'
import { getStatusLabel } from '@/utils/match-status'
import { LiveBadge } from '@/components/ui/Badge'
import { formatMatchTime } from '@/utils/date'

interface ScoreboardProps {
  match: Match
  large?: boolean
}

export function Scoreboard({ match, large }: ScoreboardProps) {
  const isLive = match.status === 'live'
  const isHalftime = match.status === 'halftime'
  const isFinished = match.status === 'finished'
  const isLiveOrFinished = isLive || isHalftime || isFinished
  const hasScore = isLiveOrFinished

  return (
    <div className={`rounded-2xl border p-5 ${
      isLive ? 'bg-[#0d1f12] border-[#22c55e]/40 shadow-[0_0_28px_rgba(34,197,94,0.15)]' :
      isHalftime ? 'bg-[#1f1d0d] border-[#F5C518]/40' :
      'bg-[#0d1117] border-[#1f2937]'
    }`}>
      {/* Status */}
      <div className="flex items-center justify-center gap-3 mb-5">
        {isLive ? (
          <>
            <LiveBadge />
            {match.minute !== null && (
              <span className="font-display text-lg text-[#22c55e]">{match.minute}&apos;</span>
            )}
          </>
        ) : isHalftime ? (
          <span className="text-[#F5C518] text-sm font-bold tracking-wider animate-pulse">⏸ INTERVALO</span>
        ) : (
          <span className="text-[#6b7280] text-sm font-medium">{getStatusLabel(match.status)}</span>
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
              <span className={`font-display leading-none ${large ? 'text-7xl' : 'text-5xl'} ${
                match.home_score > match.away_score ? 'text-[#f9fafb]' : 'text-[#9ca3af]'
              }`}>
                {match.home_score}
              </span>
              <span className="text-[#374151] text-3xl">:</span>
              <span className={`font-display leading-none ${large ? 'text-7xl' : 'text-5xl'} ${
                match.away_score > match.home_score ? 'text-[#f9fafb]' : 'text-[#9ca3af]'
              }`}>
                {match.away_score}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <span className="text-[#F5C518] text-lg font-bold font-display">
                {formatMatchTime(match.starts_at)}
              </span>
              <span className="text-[#6b7280] text-xs">vs</span>
            </div>
          )}
          {match.home_penalty_score !== null && match.away_penalty_score !== null && (
            <p className="text-[#6b7280] text-sm mt-1">
              ({match.home_penalty_score} : {match.away_penalty_score} pen.)
            </p>
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
