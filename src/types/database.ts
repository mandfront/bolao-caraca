export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          avatar_url: string | null
          role: 'user' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          avatar_url?: string | null
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          avatar_url?: string | null
          role?: 'user' | 'admin'
          updated_at?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          id: string
          name: string
          invite_code: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          invite_code: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          invite_code?: string
        }
        Relationships: [
          {
            foreignKeyName: 'groups_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'group_members_group_id_fkey'
            columns: ['group_id']
            isOneToOne: false
            referencedRelation: 'groups'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'group_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      teams: {
        Row: {
          id: string
          api_team_id: string | null
          name: string
          short_name: string | null
          flag_url: string | null
          country_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          api_team_id?: string | null
          name: string
          short_name?: string | null
          flag_url?: string | null
          country_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          api_team_id?: string | null
          name?: string
          short_name?: string | null
          flag_url?: string | null
          country_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          id: string
          api_match_id: string | null
          source: 'api' | 'manual'
          home_team_id: string
          away_team_id: string
          starts_at: string
          phase: string | null
          stadium: string | null
          status: 'scheduled' | 'live' | 'halftime' | 'finished' | 'postponed' | 'cancelled'
          minute: number | null
          home_score: number
          away_score: number
          home_penalty_score: number | null
          away_penalty_score: number | null
          is_manual_override: boolean
          raw_api_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          api_match_id?: string | null
          source?: 'api' | 'manual'
          home_team_id: string
          away_team_id: string
          starts_at: string
          phase?: string | null
          stadium?: string | null
          status?: 'scheduled' | 'live' | 'halftime' | 'finished' | 'postponed' | 'cancelled'
          minute?: number | null
          home_score?: number
          away_score?: number
          home_penalty_score?: number | null
          away_penalty_score?: number | null
          is_manual_override?: boolean
          raw_api_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          api_match_id?: string | null
          source?: 'api' | 'manual'
          home_team_id?: string
          away_team_id?: string
          starts_at?: string
          phase?: string | null
          stadium?: string | null
          status?: 'scheduled' | 'live' | 'halftime' | 'finished' | 'postponed' | 'cancelled'
          minute?: number | null
          home_score?: number
          away_score?: number
          home_penalty_score?: number | null
          away_penalty_score?: number | null
          is_manual_override?: boolean
          raw_api_data?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'matches_home_team_id_fkey'
            columns: ['home_team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'matches_away_team_id_fkey'
            columns: ['away_team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          }
        ]
      }
      predictions: {
        Row: {
          id: string
          group_id: string
          match_id: string
          user_id: string
          home_score: number
          away_score: number
          predicted_winner: 'home' | 'away' | 'draw'
          penalty_advance: 'home' | 'away' | null
          points: number
          exact_score: boolean
          correct_winner: boolean
          correct_goal_difference: boolean
          correct_team_goals: boolean
          locked_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          match_id: string
          user_id: string
          home_score: number
          away_score: number
          predicted_winner: 'home' | 'away' | 'draw'
          penalty_advance?: 'home' | 'away' | null
          points?: number
          exact_score?: boolean
          correct_winner?: boolean
          correct_goal_difference?: boolean
          correct_team_goals?: boolean
          locked_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          home_score?: number
          away_score?: number
          predicted_winner?: 'home' | 'away' | 'draw'
          penalty_advance?: 'home' | 'away' | null
          points?: number
          exact_score?: boolean
          correct_winner?: boolean
          correct_goal_difference?: boolean
          correct_team_goals?: boolean
          locked_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'predictions_group_id_fkey'
            columns: ['group_id']
            isOneToOne: false
            referencedRelation: 'groups'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'predictions_match_id_fkey'
            columns: ['match_id']
            isOneToOne: false
            referencedRelation: 'matches'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'predictions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      lineups: {
        Row: {
          id: string
          match_id: string
          team_id: string
          formation: string | null
          coach_name: string | null
          raw_api_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          match_id: string
          team_id: string
          formation?: string | null
          coach_name?: string | null
          raw_api_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          formation?: string | null
          coach_name?: string | null
          raw_api_data?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lineups_match_id_fkey'
            columns: ['match_id']
            isOneToOne: false
            referencedRelation: 'matches'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lineups_team_id_fkey'
            columns: ['team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          }
        ]
      }
      player_lineups: {
        Row: {
          id: string
          lineup_id: string
          player_name: string
          shirt_number: number | null
          position: string | null
          is_starter: boolean
          created_at: string
        }
        Insert: {
          id?: string
          lineup_id: string
          player_name: string
          shirt_number?: number | null
          position?: string | null
          is_starter?: boolean
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: [
          {
            foreignKeyName: 'player_lineups_lineup_id_fkey'
            columns: ['lineup_id']
            isOneToOne: false
            referencedRelation: 'lineups'
            referencedColumns: ['id']
          }
        ]
      }
      match_events: {
        Row: {
          id: string
          api_event_id: string | null
          match_id: string
          team_id: string | null
          minute: number | null
          event_type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'penalty' | 'own_goal' | 'var' | 'other'
          player_name: string | null
          assist_player_name: string | null
          description: string | null
          raw_api_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          api_event_id?: string | null
          match_id: string
          team_id?: string | null
          minute?: number | null
          event_type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'penalty' | 'own_goal' | 'var' | 'other'
          player_name?: string | null
          assist_player_name?: string | null
          description?: string | null
          raw_api_data?: Json | null
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: [
          {
            foreignKeyName: 'match_events_match_id_fkey'
            columns: ['match_id']
            isOneToOne: false
            referencedRelation: 'matches'
            referencedColumns: ['id']
          }
        ]
      }
      sync_logs: {
        Row: {
          id: string
          type: 'matches' | 'live' | 'lineups' | 'events' | 'scores'
          status: 'success' | 'error' | 'partial'
          message: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          type: 'matches' | 'live' | 'lineups' | 'events' | 'scores'
          status: 'success' | 'error' | 'partial'
          message?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      score_logs: {
        Row: {
          id: string
          prediction_id: string
          match_id: string
          user_id: string
          group_id: string
          points: number
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          prediction_id: string
          match_id: string
          user_id: string
          group_id: string
          points: number
          reason?: string | null
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: [
          {
            foreignKeyName: 'score_logs_prediction_id_fkey'
            columns: ['prediction_id']
            isOneToOne: false
            referencedRelation: 'predictions'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_group_ranking: {
        Args: { p_group_id: string }
        Returns: {
          user_id: string
          user_name: string
          avatar_url: string | null
          total_points: number
          predictions_count: number
          exact_scores: number
          correct_winners: number
          last_points: number | null
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
