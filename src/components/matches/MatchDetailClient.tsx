'use client'

import { useState } from 'react'
import { PredictionForm } from '@/components/predictions/PredictionForm'
import type { Match } from '@/types/match'
import type { Tables } from '@/types/database'

type GroupData = {
  group: { id: string; name: string }
  userPrediction: Tables<'predictions'> | null
  allPredictions: (Tables<'predictions'> & { profile?: { name: string; avatar_url: string | null } })[]
}

interface MatchDetailClientProps {
  match: Match
  groupsData: GroupData[]
  currentUserId: string
  matchLocked: boolean
}

export function MatchDetailClient({
  match,
  groupsData,
  currentUserId,
  matchLocked,
}: MatchDetailClientProps) {
  const [activeIdx, setActiveIdx] = useState(0)

  if (groupsData.length === 0) {
    return (
      <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-4 text-center">
        <p className="text-[#6b7280] text-sm">Entre em um grupo para fazer palpites</p>
      </div>
    )
  }

  const active = groupsData[activeIdx]

  const handleSave = async (prediction: { home_score: number; away_score: number; predicted_winner: string }) => {
    const res = await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        match_id: match.id,
        group_id: active.group.id,
        ...prediction,
      }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error)
    }
  }

  return (
    <div className="space-y-3">
      {/* Tabs de grupos — só aparece se tiver mais de 1 */}
      {groupsData.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {groupsData.map((gd, i) => (
            <button
              key={gd.group.id}
              onClick={() => setActiveIdx(i)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                i === activeIdx
                  ? 'bg-[#F5C518] text-[#0a0f1e]'
                  : 'bg-[#111827] border border-[#1f2937] text-[#6b7280] hover:text-[#9ca3af]'
              }`}
            >
              {gd.group.name}
              {gd.userPrediction && (
                <span className="ml-1.5 opacity-70">
                  {gd.userPrediction.home_score}–{gd.userPrediction.away_score}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Formulário do grupo ativo */}
      <PredictionForm
        match={match}
        groupId={active.group.id}
        existingPrediction={active.userPrediction}
        onSave={handleSave}
        locked={matchLocked}
      />

      {/* Palpites dos outros membros (após jogo começar) */}
      {matchLocked && active.allPredictions.length > 0 && (
        <div>
          <h3 className="text-[#f9fafb] font-bold text-sm mb-3">
            Palpites — {active.group.name}
          </h3>
          <div className="space-y-2">
            {active.allPredictions.map((pred) => (
              <div
                key={pred.id}
                className={`flex items-center gap-3 p-3 rounded-xl border ${
                  pred.user_id === currentUserId
                    ? 'bg-[#F5C518]/8 border-[#F5C518]/25'
                    : 'bg-[#111827] border-[#1f2937]'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-[#1f2937] flex items-center justify-center text-sm font-bold text-[#F5C518] shrink-0">
                  {pred.profile?.avatar_url ? (
                    <img src={pred.profile.avatar_url} alt={pred.profile.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span>{pred.profile?.name?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#f9fafb] text-sm font-medium truncate">
                    {pred.profile?.name}
                    {pred.user_id === currentUserId && (
                      <span className="text-[#F5C518] text-xs ml-1">(você)</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-display text-xl text-[#f9fafb]">
                    {pred.home_score}–{pred.away_score}
                  </span>
                  {match.status === 'finished' && pred.points !== undefined && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                      pred.points >= 5 ? 'bg-[#F5C518]/15 text-[#F5C518]' :
                      pred.points >= 3 ? 'bg-[#22c55e]/15 text-[#22c55e]' :
                      pred.points >= 1 ? 'bg-[#3b82f6]/15 text-[#3b82f6]' :
                      'bg-[#1f2937] text-[#4b5563]'
                    }`}>
                      {pred.points}pts
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
