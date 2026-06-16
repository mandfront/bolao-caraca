import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { fetchAllWCMatches, mapFDMatch } from '@/services/football-data'

// Chamado pelo Vercel Cron (vercel.json) a cada 10 minutos
// Autentica via CRON_SECRET para bloquear chamadas não autorizadas
export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { data: matches, error } = await fetchAllWCMatches()
    if (error || !matches) {
      // Não falha o cron — só não tem o que sincronizar agora
      return NextResponse.json({
        updated: 0,
        finished: 0,
        warning: error ?? 'Sem dados da API',
      }, { status: 200 })
    }

    const supabase = createAdminClient()
    let updated = 0
    let finished = 0
    const errors: string[] = []

    for (const raw of matches) {
      // Pula jogos sem times definidos (mata-mata futuro)
      if (!raw.homeTeam?.name || !raw.awayTeam?.name) continue

      try {
        const m = mapFDMatch(raw)
        if (!m.external_id) continue

        const { data: existing } = await supabase
          .from('matches')
          .select('id, status, is_manual_override')
          .eq('api_match_id', m.external_id)
          .single()

        // Respeita override manual — NUNCA sobrescreve
        if (!existing || existing.is_manual_override) continue

        const wasFinished = existing.status === 'finished'
        const nowFinished = m.status === 'finished'

        const { error: updErr } = await supabase.from('matches').update({
          status: m.status as 'scheduled' | 'live' | 'halftime' | 'finished' | 'postponed' | 'cancelled',
          home_score: m.home_score,
          away_score: m.away_score,
          starts_at: m.starts_at,
          updated_at: new Date().toISOString(),
        }).eq('id', existing.id)

        if (updErr) {
          errors.push(`Update ${m.external_id}: ${updErr.message}`)
          continue
        }

        updated++

        if (!wasFinished && nowFinished) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: rpcErr } = await (supabase.rpc as any)('recalculate_predictions_for_match', { p_match_id: existing.id })
          if (rpcErr) {
            errors.push(`Recalc ${m.external_id}: ${rpcErr.message}`)
          } else {
            finished++
          }
        }
      } catch (err) {
        errors.push(err instanceof Error ? err.message : 'Erro desconhecido')
      }
    }

    await supabase.from('sync_logs').insert({
      type: 'live',
      status: errors.length > 0 ? 'partial' : 'success',
      message: `Cron fd.org: ${updated} atualizadas, ${finished} finalizadas`,
    })

    return NextResponse.json({ updated, finished, errors })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro' }, { status: 500 })
  }
}
