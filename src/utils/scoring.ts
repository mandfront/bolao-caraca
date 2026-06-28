import type { ScoreResult } from '@/types/prediction'
import { penaltyAdvancer } from '@/utils/phase'

// Bônus somado por acertar quem passa quando o jogo é decidido nos pênaltis.
export const PENALTY_BONUS_POINTS = 2

type PredictionInput = {
  home_score: number
  away_score: number
}

type MatchResult = {
  home_score: number
  away_score: number
}

function getWinner(home: number, away: number): 'home' | 'away' | 'draw' {
  if (home > away) return 'home'
  if (away > home) return 'away'
  return 'draw'
}

export function calculatePredictionScore(
  prediction: PredictionInput,
  match: MatchResult
): ScoreResult {
  const predHome = prediction.home_score
  const predAway = prediction.away_score
  const matchHome = match.home_score
  const matchAway = match.away_score

  const exactScore = predHome === matchHome && predAway === matchAway
  if (exactScore) {
    return {
      points: 5,
      exact_score: true,
      correct_winner: true,
      correct_goal_difference: true,
      correct_team_goals: true,
      reason: 'Placar exato',
    }
  }

  const predWinner = getWinner(predHome, predAway)
  const matchWinner = getWinner(matchHome, matchAway)
  const correctWinner = predWinner === matchWinner

  if (correctWinner) {
    return {
      points: 3,
      exact_score: false,
      correct_winner: true,
      correct_goal_difference: false,
      correct_team_goals: false,
      reason: 'Acertou vencedor/empate',
    }
  }

  const predDiff = predHome - predAway
  const matchDiff = matchHome - matchAway
  const correctGoalDifference = predDiff === matchDiff

  if (correctGoalDifference) {
    return {
      points: 2,
      exact_score: false,
      correct_winner: false,
      correct_goal_difference: true,
      correct_team_goals: false,
      reason: 'Acertou saldo de gols',
    }
  }

  const correctTeamGoals = predHome === matchHome || predAway === matchAway

  if (correctTeamGoals) {
    return {
      points: 1,
      exact_score: false,
      correct_winner: false,
      correct_goal_difference: false,
      correct_team_goals: true,
      reason: 'Acertou gols de um time',
    }
  }

  return {
    points: 0,
    exact_score: false,
    correct_winner: false,
    correct_goal_difference: false,
    correct_team_goals: false,
    reason: 'Errou tudo',
  }
}

export function getPredictedWinner(
  home: number,
  away: number
): 'home' | 'away' | 'draw' {
  return getWinner(home, away)
}

type PenaltyPrediction = {
  penalty_advance?: 'home' | 'away' | null
}

type PenaltyMatch = {
  home_penalty_score?: number | null
  away_penalty_score?: number | null
}

// Bônus de pênaltis: só conta quando o jogo foi DE FATO decidido nos pênaltis
// (placares de pênalti preenchidos e diferentes) e o palpiteiro acertou quem passou.
export function calculatePenaltyBonus(
  prediction: PenaltyPrediction,
  match: PenaltyMatch
): { points: number; correct: boolean } {
  const actual = penaltyAdvancer(match.home_penalty_score, match.away_penalty_score)
  if (!actual || !prediction.penalty_advance) return { points: 0, correct: false }

  const correct = prediction.penalty_advance === actual
  return { points: correct ? PENALTY_BONUS_POINTS : 0, correct }
}
