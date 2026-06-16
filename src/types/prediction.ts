import type { Tables } from './database'

export type Prediction = Tables<'predictions'>
export type PredictedWinner = Tables<'predictions'>['predicted_winner']

export interface ScoreResult {
  points: number
  exact_score: boolean
  correct_winner: boolean
  correct_goal_difference: boolean
  correct_team_goals: boolean
  reason: string
}

export interface RankingEntry {
  position: number
  user_id: string
  user_name: string
  avatar_url: string | null
  total_points: number
  predictions_count: number
  exact_scores: number
  correct_winners: number
  last_points: number | null
}
