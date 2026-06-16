import type { Tables } from './database'

export type Match = Tables<'matches'> & {
  home_team: Tables<'teams'>
  away_team: Tables<'teams'>
}

export type MatchWithDetails = Match & {
  events?: Tables<'match_events'>[]
  lineups?: (Tables<'lineups'> & { players: Tables<'player_lineups'>[] })[]
}

export type MatchStatus = Tables<'matches'>['status']
export type MatchSource = Tables<'matches'>['source']
export type EventType = Tables<'match_events'>['event_type']
