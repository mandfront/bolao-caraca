'use client'

import Link from 'next/link'
import type { Match } from '@/types/match'
import { getStatusLabel, getStatusColor } from '@/utils/match-status'
import { formatMatchDate, formatMatchTime } from '@/utils/date'
import { LiveBadge } from '@/components/ui/Badge'

interface MatchCardProps {
  match: Match
  userPrediction?: { home_score: number; away_score: number; points?: number } | null
  showPrediction?: boolean
  compact?: boolean
}

function TeamFlag({ url, name, size = 'md' }: { url: string | null; name: string; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-8 h-8' : 'w-12 h-12'
  const text = size === 'sm' ? 'text-base' : 'text-xl'

  if (url) {
    return (
      <div className={`${dim} rounded-xl overflow-hidden border border-[#ffffff10] shadow-lg shrink-0`}>
        <img
          src={url}
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    )
  }

  return (
    <div className={`${dim} rounded-xl bg-[#1f2937] border border-[#374151] flex items-center justify-center ${text} shrink-0`}>
      🏳️
    </div>
  )
}

export function MatchCard({ match, userPrediction, showPrediction, compact }: MatchCardProps) {
  const isLive = match.status === 'live' || match.status === 'halftime'
  const isFinished = match.status === 'finished'
  const hasScore = isLive || isFinished

  return (
    <Link href={`/jogos/${match.id}`} className="block">
      <div className={`
        rounded-2xl border transition-all duration-200 overflow-hidden
        ${isLive
          ? 'bg-[#0d1f12] border-[#22c55e]/40 shadow-[0_0_28px_rgba(34,197,94,0.15)]'
          : 'bg-[#111827] border-[#1f2937] hover:border-[#2d3748] hover:bg-[#131e2e]'
        }
        ${compact ? 'p-3' : 'p-4'}
      `}>

        {/* Header: status + data */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isLive ? (
              <LiveBadge />
            ) : (
              <span className={`text-[11px] font-bold tracking-wide uppercase ${getStatusColor(match.status)}`}>
                {getStatusLabel(match.status)}
              </span>
            )}
            {isLive && match.minute && (
              <span className="text-[#22c55e] text-sm font-bold font-display">{match.minute}'</span>
            )}
            {match.phase && (
              <span className="text-[#374151] text-[10px] font-medium">· {match.phase}</span>
            )}
          </div>
          <div className="text-right">
            <p className="text-[#4b5563] text-[11px] font-medium">
              {formatMatchDate(match.starts_at)}
              {!isLive && <span className="ml-1 text-[#374151]">{formatMatchTime(match.starts_at)}</span>}
            </p>
          </div>
        </div>

        {/* Main content: time — placar — time */}
        <div className="flex items-center gap-2">

          {/* Time mandante */}
          <div className="flex-1 flex items-center gap-2.5 min-w-0">
            <TeamFlag url={match.home_team.flag_url} name={match.home_team.name} />
            <p className={`text-sm font-bold leading-tight truncate ${
              hasScore && match.home_score > match.away_score ? 'text-[#f9fafb]' :
              hasScore ? 'text-[#6b7280]' : 'text-[#f9fafb]'
            }`}>
              {match.home_team.short_name || match.home_team.name}
            </p>
          </div>

          {/* Placar central */}
          <div className="flex flex-col items-center shrink-0 px-2">
            {hasScore ? (
              <div className="flex items-center gap-1.5">
                <span className={`font-display text-3xl leading-none ${
                  match.home_score > match.away_score ? 'text-[#f9fafb]' : 'text-[#6b7280]'
                }`}>{match.home_score}</span>
                <span className="text-[#374151] text-lg font-light">–</span>
                <span className={`font-display text-3xl leading-none ${
                  match.away_score > match.home_score ? 'text-[#f9fafb]' : 'text-[#6b7280]'
                }`}>{match.away_score}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="font-display text-2xl text-[#2d3748] leading-none">–</span>
                <span className="text-[#1f2937] text-sm">vs</span>
                <span className="font-display text-2xl text-[#2d3748] leading-none">–</span>
              </div>
            )}
            {match.status === 'scheduled' && (
              <span className="text-[#F5C518] text-[11px] font-bold mt-0.5">
                {formatMatchTime(match.starts_at)}
              </span>
            )}
            {match.status === 'halftime' && (
              <span className="text-[#F5C518] text-[10px] font-bold mt-0.5 animate-pulse">HT</span>
            )}
          </div>

          {/* Time visitante */}
          <div className="flex-1 flex items-center gap-2.5 justify-end min-w-0">
            <p className={`text-sm font-bold leading-tight truncate text-right ${
              hasScore && match.away_score > match.home_score ? 'text-[#f9fafb]' :
              hasScore ? 'text-[#6b7280]' : 'text-[#f9fafb]'
            }`}>
              {match.away_team.short_name || match.away_team.name}
            </p>
            <TeamFlag url={match.away_team.flag_url} name={match.away_team.name} />
          </div>
        </div>

        {/* Palpite do usuário */}
        {showPrediction && (
          <div className="mt-3 pt-3 border-t border-[#1f2937] flex items-center justify-between">
            {userPrediction ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[#4b5563] text-xs">Palpite:</span>
                  <span className="text-[#9ca3af] text-sm font-bold font-display tracking-wider">
                    {userPrediction.home_score}–{userPrediction.away_score}
                  </span>
                </div>
                {isFinished && userPrediction.points !== undefined && (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                    userPrediction.points >= 5 ? 'bg-[#F5C518]/15 text-[#F5C518]' :
                    userPrediction.points >= 3 ? 'bg-[#22c55e]/15 text-[#22c55e]' :
                    userPrediction.points >= 1 ? 'bg-[#3b82f6]/15 text-[#3b82f6]' :
                    'bg-[#1f2937] text-[#4b5563]'
                  }`}>
                    {userPrediction.points}pts
                  </span>
                )}
              </>
            ) : (
              <span className="text-[#374151] text-xs italic">
                {isFinished ? 'Sem palpite' : '→ Palpitar'}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
