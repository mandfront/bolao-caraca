import { createAdminClient } from '@/lib/supabase/server'
import {
  fetchMatches,
  fetchLiveMatches,
  fetchMatchEvents,
  fetchMatchLineups,
} from './api-futebol'
import { mapApiStatusToLocal } from '@/utils/match-status'
import { calculatePredictionScore, getPredictedWinner } from '@/utils/scoring'
import type { Json, Tables, TablesInsert, TablesUpdate } from '@/types/database'
import type { ApiFutebolMatch } from '@/types/api-futebol'

async function logSync(
  type: Tables<'sync_logs'>['type'],
  status: Tables<'sync_logs'>['status'],
  message?: string,
  metadata?: Record<string, unknown>
) {
  try {
    const supabase = createAdminClient()
    await supabase.from('sync_logs').insert({
      type,
      status,
      message: message ?? null,
      metadata: (metadata ?? null) as Json | null,
    })
  } catch {}
}

async function upsertTeam(supabase: Awaited<ReturnType<typeof createAdminClient>>, apiTeam: ApiFutebolMatch['time_mandante']) {
  const apiTeamId = String(apiTeam.time_id)

  const { data: existing } = await supabase
    .from('teams')
    .select('id')
    .eq('api_team_id', apiTeamId)
    .single()

  if (existing) return existing.id

  const { data: inserted, error } = await supabase
    .from('teams')
    .insert({
      api_team_id: apiTeamId,
      name: apiTeam.nome_popular || apiTeam.nome,
      short_name: apiTeam.sigla,
      flag_url: apiTeam.escudo || null,
    })
    .select('id')
    .single()

  if (error || !inserted) throw new Error(`Falha ao criar time: ${error?.message}`)
  return inserted.id
}

export async function syncMatches(): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = []
  let synced = 0

  const { data: apiMatches, error } = await fetchMatches()

  if (error || !apiMatches) {
    await logSync('matches', 'error', error ?? 'Sem dados da API')
    return { synced: 0, errors: [error ?? 'Sem dados da API'] }
  }

  const supabase = createAdminClient()

  for (const apiMatch of apiMatches) {
    try {
      const apiMatchId = String(apiMatch.partida_id)

      const { data: existingMatch } = await supabase
        .from('matches')
        .select('id, source, is_manual_override')
        .eq('api_match_id', apiMatchId)
        .single()

      if (existingMatch?.source === 'manual' || existingMatch?.is_manual_override) {
        continue
      }

      const homeTeamId = await upsertTeam(supabase, apiMatch.time_mandante)
      const awayTeamId = await upsertTeam(supabase, apiMatch.time_visitante)

      const startsAt = apiMatch.data_realizacao_iso ||
        (apiMatch.data_realizacao && apiMatch.hora_realizacao
          ? `${apiMatch.data_realizacao}T${apiMatch.hora_realizacao}:00-03:00`
          : new Date().toISOString())

      const matchData: TablesInsert<'matches'> = {
        api_match_id: apiMatchId,
        source: 'api',
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        starts_at: startsAt,
        phase: apiMatch.fase ?? null,
        stadium: apiMatch.estadio ?? null,
        status: mapApiStatusToLocal(apiMatch.status),
        minute: apiMatch.minuto ? parseInt(apiMatch.minuto) : null,
        home_score: apiMatch.placar_mandante ?? 0,
        away_score: apiMatch.placar_visitante ?? 0,
        home_penalty_score: apiMatch.placar_penalti_mandante ?? null,
        away_penalty_score: apiMatch.placar_penalti_visitante ?? null,
        raw_api_data: apiMatch as unknown as Json,
        is_manual_override: false,
      }

      if (existingMatch) {
        const { id: _id, created_at: _ca, ...updateData } = matchData
        await supabase.from('matches').update(updateData as TablesUpdate<'matches'>).eq('id', existingMatch.id)
      } else {
        await supabase.from('matches').insert(matchData)
      }

      synced++
    } catch (err) {
      errors.push(err instanceof Error ? err.message : 'Erro desconhecido')
    }
  }

  await logSync('matches', errors.length > 0 ? 'partial' : 'success', `${synced} partidas sincronizadas`, { errors })
  return { synced, errors }
}

export async function syncLiveMatches(): Promise<{ updated: number; errors: string[] }> {
  const errors: string[] = []
  let updated = 0

  const { data: liveMatches, error } = await fetchLiveMatches()

  if (error || !liveMatches) {
    await logSync('live', 'error', error ?? 'Sem dados ao vivo')
    return { updated: 0, errors: [error ?? 'Sem dados ao vivo'] }
  }

  const supabase = createAdminClient()
  const finishedMatchIds: string[] = []

  for (const apiMatch of liveMatches) {
    try {
      const apiMatchId = String(apiMatch.partida_id)

      const { data: existingMatch } = await supabase
        .from('matches')
        .select('id, source, is_manual_override, status')
        .eq('api_match_id', apiMatchId)
        .single()

      if (!existingMatch || existingMatch.source === 'manual' || existingMatch.is_manual_override) continue

      const newStatus = mapApiStatusToLocal(apiMatch.status)

      await supabase.from('matches').update({
        status: newStatus,
        minute: apiMatch.minuto ? parseInt(apiMatch.minuto) : null,
        home_score: apiMatch.placar_mandante ?? 0,
        away_score: apiMatch.placar_visitante ?? 0,
        updated_at: new Date().toISOString(),
      }).eq('id', existingMatch.id)

      if (newStatus === 'finished' && existingMatch.status !== 'finished') {
        finishedMatchIds.push(existingMatch.id)
      }

      updated++
    } catch (err) {
      errors.push(err instanceof Error ? err.message : 'Erro ao atualizar partida ao vivo')
    }
  }

  for (const matchId of finishedMatchIds) {
    await recalculateMatchScores(matchId)
  }

  await logSync('live', errors.length > 0 ? 'partial' : 'success', `${updated} partidas ao vivo atualizadas`)
  return { updated, errors }
}

export async function syncMatchEvents(matchId: string): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = []
  let synced = 0
  const supabase = createAdminClient()

  const { data: match } = await supabase
    .from('matches')
    .select('id, api_match_id')
    .eq('id', matchId)
    .single()

  if (!match?.api_match_id) return { synced: 0, errors: ['Partida sem api_match_id'] }

  const { data: events, error } = await fetchMatchEvents(match.api_match_id)
  if (error || !events) return { synced: 0, errors: [error ?? 'Sem eventos'] }

  for (const event of events) {
    try {
      const apiEventId = event.evento_id ? String(event.evento_id) : null
      const eventType = mapApiEventType(event.tipo)

      if (apiEventId) {
        const { data: existing } = await supabase
          .from('match_events')
          .select('id')
          .eq('api_event_id', apiEventId)
          .single()
        if (existing) continue
      } else {
        const { data: existing } = await supabase
          .from('match_events')
          .select('id')
          .eq('match_id', matchId)
          .eq('minute', event.minuto ?? 0)
          .eq('event_type', eventType)
          .eq('player_name', event.atleta ?? '')
          .single()
        if (existing) continue
      }

      await supabase.from('match_events').insert({
        api_event_id: apiEventId,
        match_id: matchId,
        minute: event.minuto,
        event_type: eventType,
        player_name: event.atleta ?? null,
        assist_player_name: event.atleta_associado ?? null,
        description: event.descricao ?? null,
        raw_api_data: event as unknown as Json,
      })

      synced++
    } catch (err) {
      errors.push(err instanceof Error ? err.message : 'Erro ao salvar evento')
    }
  }

  await logSync('events', errors.length > 0 ? 'partial' : 'success', `${synced} eventos sincronizados`, { matchId })
  return { synced, errors }
}

export async function syncMatchLineups(matchId: string): Promise<{ synced: boolean; error?: string }> {
  const supabase = createAdminClient()

  const { data: match } = await supabase
    .from('matches')
    .select('id, api_match_id')
    .eq('id', matchId)
    .single()

  if (!match?.api_match_id) return { synced: false, error: 'Partida sem api_match_id' }

  const { data: lineups, error } = await fetchMatchLineups(match.api_match_id)
  if (error || !lineups) return { synced: false, error: error ?? 'Sem escalação' }

  for (const lineup of lineups) {
    try {
      const teamId = String(lineup.time_id)
      const { data: team } = await supabase
        .from('teams')
        .select('id')
        .eq('api_team_id', teamId)
        .single()

      if (!team) continue

      const { data: existingLineup, error: lineupError } = await supabase
        .from('lineups')
        .upsert({
          match_id: matchId,
          team_id: team.id,
          formation: lineup.escalacao ?? null,
          coach_name: lineup.tecnico ?? null,
          raw_api_data: lineup as unknown as Json,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'match_id,team_id' })
        .select('id')
        .single()

      if (lineupError || !existingLineup) continue

      await supabase.from('player_lineups').delete().eq('lineup_id', existingLineup.id)

      for (const player of lineup.atletas) {
        await supabase.from('player_lineups').insert({
          lineup_id: existingLineup.id,
          player_name: player.nome_popular,
          shirt_number: player.camisa ?? null,
          position: player.posicao ?? null,
          is_starter: player.titular,
        })
      }
    } catch {}
  }

  await logSync('lineups', 'success', 'Escalações sincronizadas', { matchId })
  return { synced: true }
}

export async function recalculateMatchScores(matchId: string): Promise<{ updated: number }> {
  const supabase = createAdminClient()

  const { data: match } = await supabase
    .from('matches')
    .select('id, home_score, away_score, status')
    .eq('id', matchId)
    .single()

  if (!match || match.status !== 'finished') return { updated: 0 }

  const { data: predictions } = await supabase
    .from('predictions')
    .select('*')
    .eq('match_id', matchId)

  if (!predictions?.length) return { updated: 0 }

  let updated = 0

  for (const prediction of predictions) {
    const result = calculatePredictionScore(prediction, match)

    await supabase.from('predictions').update({
      points: result.points,
      exact_score: result.exact_score,
      correct_winner: result.correct_winner,
      correct_goal_difference: result.correct_goal_difference,
      correct_team_goals: result.correct_team_goals,
      updated_at: new Date().toISOString(),
    }).eq('id', prediction.id)

    await supabase.from('score_logs').insert({
      prediction_id: prediction.id,
      match_id: matchId,
      user_id: prediction.user_id,
      group_id: prediction.group_id,
      points: result.points,
      reason: result.reason,
    })

    updated++
  }

  await logSync('scores', 'success', `${updated} palpites recalculados`, { matchId })
  return { updated }
}

function mapApiEventType(tipo: string): Tables<'match_events'>['event_type'] {
  const map: Record<string, Tables<'match_events'>['event_type']> = {
    'gol': 'goal',
    'cartao_amarelo': 'yellow_card',
    'cartao_vermelho': 'red_card',
    'substituicao': 'substitution',
    'penalti': 'penalty',
    'gol_contra': 'own_goal',
    'var': 'var',
  }
  return map[tipo.toLowerCase()] ?? 'other'
}
