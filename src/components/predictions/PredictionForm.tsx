'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { Match } from '@/types/match'
import type { Tables } from '@/types/database'
import { getPredictedWinner } from '@/utils/scoring'

interface PredictionFormProps {
  match: Match
  groupId: string
  existingPrediction?: Tables<'predictions'> | null
  onSave: (prediction: { home_score: number; away_score: number; predicted_winner: string }) => Promise<void>
  locked?: boolean
}

export function PredictionForm({ match, groupId, existingPrediction, onSave, locked }: PredictionFormProps) {
  const [homeScore, setHomeScore] = useState(existingPrediction?.home_score ?? 0)
  const [awayScore, setAwayScore] = useState(existingPrediction?.away_score ?? 0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const predictedWinner = getPredictedWinner(homeScore, awayScore)

  const winnerLabel = {
    home: match.home_team.short_name || match.home_team.name,
    away: match.away_team.short_name || match.away_team.name,
    draw: 'Empate',
  }[predictedWinner]

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ home_score: homeScore, away_score: awayScore, predicted_winner: predictedWinner })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  if (locked) {
    return (
      <div className="bg-[#111827] rounded-2xl border border-[#1f2937] p-4">
        <h3 className="text-[#f9fafb] font-bold text-sm mb-3">Seu Palpite</h3>
        {existingPrediction ? (
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="font-display text-4xl text-[#f9fafb]">{existingPrediction.home_score}</span>
              <span className="text-[#374151] text-xl">:</span>
              <span className="font-display text-4xl text-[#f9fafb]">{existingPrediction.away_score}</span>
            </div>
            {existingPrediction.points > 0 && (
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl ${
                existingPrediction.points >= 5 ? 'bg-[#F5C518]/15 text-[#F5C518]' :
                existingPrediction.points >= 3 ? 'bg-[#22c55e]/15 text-[#22c55e]' :
                'bg-[#3b82f6]/15 text-[#3b82f6]'
              }`}>
                <span className="font-display text-2xl">{existingPrediction.points}</span>
                <span className="text-sm font-semibold">pontos</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-[#4b5563] text-sm text-center italic">Você não fez palpite para este jogo</p>
        )}
      </div>
    )
  }

  return (
    <div className="bg-[#111827] rounded-2xl border border-[#1f2937] p-4">
      <h3 className="text-[#f9fafb] font-bold text-sm mb-4">Fazer Palpite</h3>

      <div className="flex items-center gap-4 mb-4">
        {/* Home score */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <p className="text-[#9ca3af] text-xs font-medium text-center">
            {match.home_team.short_name || match.home_team.name}
          </p>
          <div className="flex flex-col items-center">
            <button
              onClick={() => setHomeScore((v) => Math.min(v + 1, 20))}
              className="w-10 h-10 rounded-xl bg-[#1f2937] text-[#f9fafb] text-xl font-bold hover:bg-[#374151] transition-colors active:scale-95"
            >
              +
            </button>
            <span className="font-display text-5xl text-[#f9fafb] leading-tight my-1">{homeScore}</span>
            <button
              onClick={() => setHomeScore((v) => Math.max(v - 1, 0))}
              className="w-10 h-10 rounded-xl bg-[#1f2937] text-[#9ca3af] text-xl font-bold hover:bg-[#374151] transition-colors active:scale-95"
            >
              −
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-[#374151] text-3xl font-light">:</span>
          <p className={`text-xs font-bold mt-2 px-2 py-1 rounded-lg ${
            predictedWinner === 'draw' ? 'text-[#F5C518] bg-[#F5C518]/10' :
            'text-[#22c55e] bg-[#22c55e]/10'
          }`}>
            {winnerLabel}
          </p>
        </div>

        {/* Away score */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <p className="text-[#9ca3af] text-xs font-medium text-center">
            {match.away_team.short_name || match.away_team.name}
          </p>
          <div className="flex flex-col items-center">
            <button
              onClick={() => setAwayScore((v) => Math.min(v + 1, 20))}
              className="w-10 h-10 rounded-xl bg-[#1f2937] text-[#f9fafb] text-xl font-bold hover:bg-[#374151] transition-colors active:scale-95"
            >
              +
            </button>
            <span className="font-display text-5xl text-[#f9fafb] leading-tight my-1">{awayScore}</span>
            <button
              onClick={() => setAwayScore((v) => Math.max(v - 1, 0))}
              className="w-10 h-10 rounded-xl bg-[#1f2937] text-[#9ca3af] text-xl font-bold hover:bg-[#374151] transition-colors active:scale-95"
            >
              −
            </button>
          </div>
        </div>
      </div>

      <Button
        fullWidth
        onClick={handleSave}
        loading={saving}
        variant={saved ? 'success' : 'primary'}
        size="lg"
      >
        {saved ? '✓ Palpite salvo!' : existingPrediction ? 'Atualizar palpite' : 'Confirmar palpite'}
      </Button>

      <p className="text-[#4b5563] text-xs text-center mt-2">
        Bloqueado em {new Date(match.starts_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
      </p>
    </div>
  )
}
