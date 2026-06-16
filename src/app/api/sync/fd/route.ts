import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { fetchAllWCMatches, mapFDMatch } from '@/services/football-data'
import type { TablesInsert } from '@/types/database'

export async function GET() {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    const { data: matches, error } = await fetchAllWCMatches()
    if (error || !matches) return NextResponse.json({ error }, { status: 500 })

    const supabase = createAdminClient()
    let synced = 0, skipped = 0
    const errors: string[] = []

    for (const raw of matches) {
      if (!raw.homeTeam?.name || !raw.awayTeam?.name) { skipped++; continue }

      try {
        const m = mapFDMatch(raw)
        const homeId = await upsertTeam(supabase, m.home_team_name, m.home_team_short, m.home_team_crest)
        const awayId = await upsertTeam(supabase, m.away_team_name, m.away_team_short, m.away_team_crest)

        const { data: existing } = await supabase
          .from('matches')
          .select('id, status, is_manual_override')
          .eq('api_match_id', m.external_id)
          .single()

        if (existing?.is_manual_override) { skipped++; continue }

        const matchData: TablesInsert<'matches'> = {
          api_match_id: m.external_id,
          source: 'api',
          home_team_id: homeId,
          away_team_id: awayId,
          starts_at: m.starts_at,
          phase: m.phase,
          status: m.status as 'scheduled' | 'live' | 'halftime' | 'finished' | 'postponed' | 'cancelled',
          home_score: m.home_score,
          away_score: m.away_score,
          is_manual_override: false,
        }

        if (existing) {
          const wasFinished = existing.status === 'finished'
          const nowFinished = m.status === 'finished'
          const { id: _id, created_at: _ca, ...updateData } = matchData
          await supabase.from('matches').update(updateData).eq('id', existing.id)

          if (!wasFinished && nowFinished) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase.rpc as any)('recalculate_predictions_for_match', { p_match_id: existing.id })
          }
        } else {
          await supabase.from('matches').insert(matchData)
        }

        synced++
      } catch (err) {
        errors.push(err instanceof Error ? err.message : 'Erro')
      }
    }

    await supabase.from('sync_logs').insert({
      type: 'matches',
      status: errors.length > 0 ? 'partial' : 'success',
      message: `football-data.org: ${synced} sincronizadas, ${skipped} ignoradas`,
    })

    return NextResponse.json({ synced, skipped, errors, total: matches.length })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro' }, { status: 500 })
  }
}

// Nomes em inglês (football-data.org) → português + código de bandeira
const FD_TEAM_MAP: Record<string, { name: string; flag: string }> = {
  'Mexico': { name: 'México', flag: 'https://flagcdn.com/w80/mx.png' },
  'South Africa': { name: 'África do Sul', flag: 'https://flagcdn.com/w80/za.png' },
  'South Korea': { name: 'Coreia do Sul', flag: 'https://flagcdn.com/w80/kr.png' },
  'Korea Republic': { name: 'Coreia do Sul', flag: 'https://flagcdn.com/w80/kr.png' },
  'Czechia': { name: 'Tchéquia', flag: 'https://flagcdn.com/w80/cz.png' },
  'Canada': { name: 'Canadá', flag: 'https://flagcdn.com/w80/ca.png' },
  'Bosnia and Herzegovina': { name: 'Bósnia e Herzegovina', flag: 'https://flagcdn.com/w80/ba.png' },
  'Brazil': { name: 'Brasil', flag: 'https://flagcdn.com/w80/br.png' },
  'Morocco': { name: 'Marrocos', flag: 'https://flagcdn.com/w80/ma.png' },
  'Haiti': { name: 'Haiti', flag: 'https://flagcdn.com/w80/ht.png' },
  'Scotland': { name: 'Escócia', flag: 'https://flagcdn.com/w80/gb-sct.png' },
  'United States': { name: 'Estados Unidos', flag: 'https://flagcdn.com/w80/us.png' },
  'Paraguay': { name: 'Paraguai', flag: 'https://flagcdn.com/w80/py.png' },
  'Australia': { name: 'Austrália', flag: 'https://flagcdn.com/w80/au.png' },
  'Türkiye': { name: 'Turquia', flag: 'https://flagcdn.com/w80/tr.png' },
  'Turkey': { name: 'Turquia', flag: 'https://flagcdn.com/w80/tr.png' },
  'Qatar': { name: 'Catar', flag: 'https://flagcdn.com/w80/qa.png' },
  'Switzerland': { name: 'Suíça', flag: 'https://flagcdn.com/w80/ch.png' },
  'Germany': { name: 'Alemanha', flag: 'https://flagcdn.com/w80/de.png' },
  'Curaçao': { name: 'Curaçau', flag: 'https://flagcdn.com/w80/cw.png' },
  "Côte d'Ivoire": { name: 'Costa do Marfim', flag: 'https://flagcdn.com/w80/ci.png' },
  'Ecuador': { name: 'Equador', flag: 'https://flagcdn.com/w80/ec.png' },
  'Sweden': { name: 'Suécia', flag: 'https://flagcdn.com/w80/se.png' },
  'Tunisia': { name: 'Tunísia', flag: 'https://flagcdn.com/w80/tn.png' },
  'Netherlands': { name: 'Países Baixos', flag: 'https://flagcdn.com/w80/nl.png' },
  'Japan': { name: 'Japão', flag: 'https://flagcdn.com/w80/jp.png' },
  'Spain': { name: 'Espanha', flag: 'https://flagcdn.com/w80/es.png' },
  'Cabo Verde': { name: 'Cabo Verde', flag: 'https://flagcdn.com/w80/cv.png' },
  'Cape Verde': { name: 'Cabo Verde', flag: 'https://flagcdn.com/w80/cv.png' },
  'Belgium': { name: 'Bélgica', flag: 'https://flagcdn.com/w80/be.png' },
  'Egypt': { name: 'Egito', flag: 'https://flagcdn.com/w80/eg.png' },
  'Saudi Arabia': { name: 'Arábia Saudita', flag: 'https://flagcdn.com/w80/sa.png' },
  'Uruguay': { name: 'Uruguai', flag: 'https://flagcdn.com/w80/uy.png' },
  'Iran': { name: 'Irã', flag: 'https://flagcdn.com/w80/ir.png' },
  'New Zealand': { name: 'Nova Zelândia', flag: 'https://flagcdn.com/w80/nz.png' },
  'France': { name: 'França', flag: 'https://flagcdn.com/w80/fr.png' },
  'Argentina': { name: 'Argentina', flag: 'https://flagcdn.com/w80/ar.png' },
  'England': { name: 'Inglaterra', flag: 'https://flagcdn.com/w80/gb-eng.png' },
  'Portugal': { name: 'Portugal', flag: 'https://flagcdn.com/w80/pt.png' },
  'Croatia': { name: 'Croácia', flag: 'https://flagcdn.com/w80/hr.png' },
  'Poland': { name: 'Polônia', flag: 'https://flagcdn.com/w80/pl.png' },
  'Serbia': { name: 'Sérvia', flag: 'https://flagcdn.com/w80/rs.png' },
  'Denmark': { name: 'Dinamarca', flag: 'https://flagcdn.com/w80/dk.png' },
  'Austria': { name: 'Áustria', flag: 'https://flagcdn.com/w80/at.png' },
  'Colombia': { name: 'Colômbia', flag: 'https://flagcdn.com/w80/co.png' },
  'Norway': { name: 'Noruega', flag: 'https://flagcdn.com/w80/no.png' },
  'Jordan': { name: 'Jordânia', flag: 'https://flagcdn.com/w80/jo.png' },
  'DR Congo': { name: 'RD Congo', flag: 'https://flagcdn.com/w80/cd.png' },
  'Nigeria': { name: 'Nigéria', flag: 'https://flagcdn.com/w80/ng.png' },
  'Senegal': { name: 'Senegal', flag: 'https://flagcdn.com/w80/sn.png' },
  'Ghana': { name: 'Gana', flag: 'https://flagcdn.com/w80/gh.png' },
  'Cameroon': { name: 'Camarões', flag: 'https://flagcdn.com/w80/cm.png' },
  'Indonesia': { name: 'Indonésia', flag: 'https://flagcdn.com/w80/id.png' },
  'Chile': { name: 'Chile', flag: 'https://flagcdn.com/w80/cl.png' },
  'Peru': { name: 'Peru', flag: 'https://flagcdn.com/w80/pe.png' },
  'Venezuela': { name: 'Venezuela', flag: 'https://flagcdn.com/w80/ve.png' },
  'Costa Rica': { name: 'Costa Rica', flag: 'https://flagcdn.com/w80/cr.png' },
  'Honduras': { name: 'Honduras', flag: 'https://flagcdn.com/w80/hn.png' },
  'Panama': { name: 'Panamá', flag: 'https://flagcdn.com/w80/pa.png' },
  'Jamaica': { name: 'Jamaica', flag: 'https://flagcdn.com/w80/jm.png' },
  'Romania': { name: 'Romênia', flag: 'https://flagcdn.com/w80/ro.png' },
  'Greece': { name: 'Grécia', flag: 'https://flagcdn.com/w80/gr.png' },
  'Slovakia': { name: 'Eslováquia', flag: 'https://flagcdn.com/w80/sk.png' },
  'Slovenia': { name: 'Eslovênia', flag: 'https://flagcdn.com/w80/si.png' },
  'Georgia': { name: 'Geórgia', flag: 'https://flagcdn.com/w80/ge.png' },
  'Ukraine': { name: 'Ucrânia', flag: 'https://flagcdn.com/w80/ua.png' },
  'China PR': { name: 'China', flag: 'https://flagcdn.com/w80/cn.png' },
}

async function upsertTeam(
  supabase: ReturnType<typeof createAdminClient>,
  nameEn: string,
  tla: string,
  crestUrl: string | null
): Promise<string> {
  const mapped = FD_TEAM_MAP[nameEn.trim()]
  const namePt = mapped?.name ?? nameEn.trim()
  const flagUrl = mapped?.flag ?? crestUrl

  // Procura pelo nome PT primeiro
  const { data: byPt } = await supabase
    .from('teams')
    .select('id, flag_url')
    .ilike('name', namePt)
    .single()

  if (byPt) {
    if (flagUrl && !byPt.flag_url) {
      await supabase.from('teams').update({ flag_url: flagUrl, short_name: tla }).eq('id', byPt.id)
    }
    return byPt.id
  }

  // Fallback: procura pelo nome EN original
  const { data: byEn } = await supabase
    .from('teams')
    .select('id, flag_url')
    .ilike('name', nameEn.trim())
    .single()

  if (byEn) {
    // Atualiza para nome PT
    await supabase.from('teams').update({ name: namePt, flag_url: flagUrl, short_name: tla }).eq('id', byEn.id)
    return byEn.id
  }

  const { data: inserted, error } = await supabase
    .from('teams')
    .insert({ name: namePt, short_name: tla, flag_url: flagUrl })
    .select('id')
    .single()

  if (error || !inserted) throw new Error(`Falha ao criar time ${namePt}: ${error?.message}`)
  return inserted.id
}
