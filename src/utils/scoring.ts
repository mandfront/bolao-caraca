import type { ScoreResult } from '@/types/prediction'
import type { Tables } from '@/types/database'

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
