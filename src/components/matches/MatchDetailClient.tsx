'use client'

import { PredictionForm } from '@/components/predictions/PredictionForm'
import type { Match } from '@/types/match'
import type { Tables } from '@/types/database'

interface MatchDetailClientProps {
  match: Match
  groupId: string | null
  userPrediction: Tables<'predictions'> | null
  groupPredictions: (Tables<'predictions'> & { profile?: { name: string; avatar_url: string | null } })[]
  currentUserId: string
  matchLocked: boolean
}

export function MatchDetailClient({
  match,
  groupId,
  userPrediction,
  groupPredictions,
  currentUserId,
  matchLocked,
}: MatchDetailClientProps) {
  const handleSavePrediction = async (prediction: {
    home_score: number
    away_score: number
    predicted_winner: string
  }) => {
    if (!groupId) return
    const res = await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        match_id: match.id,
        group_id: groupId,
        ...prediction,
      }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error)
    }
  }

  return (
    <>
      {/* Prediction form */}
      {groupId ? (
        <div className="animate-slide-up delay-100">
          <PredictionForm
            match={match}
            groupId={groupId}
            existingPrediction={userPrediction}
            onSave={handleSavePrediction}
            locked={matchLocked}
          />
        </div>
      ) : (
        <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-4 text-center animate-slide-up delay-100">
          <p className="text-[#6b7280] text-sm">Entre em um grupo para fazer palpites</p>
        </div>
      )}

      {/* Group predictions after match starts */}
      {matchLocked && groupPredictions.length > 0 && (
        <div className="animate-slide-up delay-200">
          <h3 className="text-[#f9fafb] font-bold text-sm mb-3">Palpites da Família</h3>
          <div className="space-y-2">
            {groupPredictions.map((pred) => (
              <div
                key={pred.id}
                className={`flex items-center gap-3 p-3 rounded-xl border ${
                  pred.user_id === currentUserId
                    ? 'bg-[#F5C518]/8 border-[#F5C518]/25'
                    : 'bg-[#111827] border-[#1f2937]'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-[#1f2937] flex items-center justify-center text-sm shrink-0">
                  {pred.profile?.avatar_url ? (
                    <img src={pred.profile.avatar_url} alt={pred.profile.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span>{pred.profile?.name?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-[#f9fafb] text-sm font-medium">{pred.profile?.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display text-xl text-[#f9fafb]">
                    {pred.home_score} : {pred.away_score}
                  </span>
                  {match.status === 'finished' && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                      pred.points >= 5 ? 'bg-[#F5C518]/15 text-[#F5C518]' :
                      pred.points >= 3 ? 'bg-[#22c55e]/15 text-[#22c55e]' :
                      pred.points >= 1 ? 'bg-[#3b82f6]/15 text-[#3b82f6]' :
                      'bg-[#1f2937] text-[#6b7280]'
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
    </>
  )
}
