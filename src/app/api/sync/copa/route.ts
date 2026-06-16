import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { fetchAllMatches } from '@/services/worldcup26'
import type { TablesInsert } from '@/types/database'

// Mapeamento: nome inglês (worldcup26.ir) → { nome PT, código país }
const TEAM_MAP: Record<string, { name: string; flag: string }> = {
  'Mexico': { name: 'México', flag: 'https://flagcdn.com/w80/mx.png' },
  'South Africa': { name: 'África do Sul', flag: 'https://flagcdn.com/w80/za.png' },
  'South Korea': { name: 'Coreia do Sul', flag: 'https://flagcdn.com/w80/kr.png' },
  'Korea Republic': { name: 'Coreia do Sul', flag: 'https://flagcdn.com/w80/kr.png' },
  'Czech Republic': { name: 'Tchéquia', flag: 'https://flagcdn.com/w80/cz.png' },
  'Czechia': { name: 'Tchéquia', flag: 'https://flagcdn.com/w80/cz.png' },
  'Canada': { name: 'Canadá', flag: 'https://flagcdn.com/w80/ca.png' },
  'Bosnia and Herzegovina': { name: 'Bósnia e Herzegovina', flag: 'https://flagcdn.com/w80/ba.png' },
  'Bosnia & Herzegovina': { name: 'Bósnia e Herzegovina', flag: 'https://flagcdn.com/w80/ba.png' },
  'Brazil': { name: 'Brasil', flag: 'https://flagcdn.com/w80/br.png' },
  'Morocco': { name: 'Marrocos', flag: 'https://flagcdn.com/w80/ma.png' },
  'Haiti': { name: 'Haiti', flag: 'https://flagcdn.com/w80/ht.png' },
  'Scotland': { name: 'Escócia', flag: 'https://flagcdn.com/w80/gb-sct.png' },
  'United States': { name: 'Estados Unidos', flag: 'https://flagcdn.com/w80/us.png' },
  'USA': { name: 'Estados Unidos', flag: 'https://flagcdn.com/w80/us.png' },
  'Paraguay': { name: 'Paraguai', flag: 'https://flagcdn.com/w80/py.png' },
  'Australia': { name: 'Austrália', flag: 'https://flagcdn.com/w80/au.png' },
  'Turkey': { name: 'Turquia', flag: 'https://flagcdn.com/w80/tr.png' },
  'Qatar': { name: 'Catar', flag: 'https://flagcdn.com/w80/qa.png' },
  'Switzerland': { name: 'Suíça', flag: 'https://flagcdn.com/w80/ch.png' },
  'Germany': { name: 'Alemanha', flag: 'https://flagcdn.com/w80/de.png' },
  'Curacao': { name: 'Curaçau', flag: 'https://flagcdn.com/w80/cw.png' },
  'Curaçao': { name: 'Curaçau', flag: 'https://flagcdn.com/w80/cw.png' },
  'Ivory Coast': { name: 'Costa do Marfim', flag: 'https://flagcdn.com/w80/ci.png' },
  "Côte d'Ivoire": { name: 'Costa do Marfim', flag: 'https://flagcdn.com/w80/ci.png' },
  'Ecuador': { name: 'Equador', flag: 'https://flagcdn.com/w80/ec.png' },
  'Sweden': { name: 'Suécia', flag: 'https://flagcdn.com/w80/se.png' },
  'Tunisia': { name: 'Tunísia', flag: 'https://flagcdn.com/w80/tn.png' },
  'Netherlands': { name: 'Países Baixos', flag: 'https://flagcdn.com/w80/nl.png' },
  'Japan': { name: 'Japão', flag: 'https://flagcdn.com/w80/jp.png' },
  'Spain': { name: 'Espanha', flag: 'https://flagcdn.com/w80/es.png' },
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
  'Ukraine': { name: 'Ucrânia', flag: 'https://flagcdn.com/w80/ua.png' },
  'Denmark': { name: 'Dinamarca', flag: 'https://flagcdn.com/w80/dk.png' },
  'Austria': { name: 'Áustria', flag: 'https://flagcdn.com/w80/at.png' },
  'Colombia': { name: 'Colômbia', flag: 'https://flagcdn.com/w80/co.png' },
  'Chile': { name: 'Chile', flag: 'https://flagcdn.com/w80/cl.png' },
  'Peru': { name: 'Peru', flag: 'https://flagcdn.com/w80/pe.png' },
  'Venezuela': { name: 'Venezuela', flag: 'https://flagcdn.com/w80/ve.png' },
  'Nigeria': { name: 'Nigéria', flag: 'https://flagcdn.com/w80/ng.png' },
  'Senegal': { name: 'Senegal', flag: 'https://flagcdn.com/w80/sn.png' },
  'Ghana': { name: 'Gana', flag: 'https://flagcdn.com/w80/gh.png' },
  'Cameroon': { name: 'Camarões', flag: 'https://flagcdn.com/w80/cm.png' },
  'Algeria': { name: 'Argélia', flag: 'https://flagcdn.com/w80/dz.png' },
  'Kenya': { name: 'Quênia', flag: 'https://flagcdn.com/w80/ke.png' },
  'Comoros': { name: 'Comores', flag: 'https://flagcdn.com/w80/km.png' },
  'Tanzania': { name: 'Tanzânia', flag: 'https://flagcdn.com/w80/tz.png' },
  'Honduras': { name: 'Honduras', flag: 'https://flagcdn.com/w80/hn.png' },
  'Panama': { name: 'Panamá', flag: 'https://flagcdn.com/w80/pa.png' },
  'Costa Rica': { name: 'Costa Rica', flag: 'https://flagcdn.com/w80/cr.png' },
  'Jamaica': { name: 'Jamaica', flag: 'https://flagcdn.com/w80/jm.png' },
  'Trinidad and Tobago': { name: 'Trinidad e Tobago', flag: 'https://flagcdn.com/w80/tt.png' },
  'El Salvador': { name: 'El Salvador', flag: 'https://flagcdn.com/w80/sv.png' },
  'Guatemala': { name: 'Guatemala', flag: 'https://flagcdn.com/w80/gt.png' },
  'Cuba': { name: 'Cuba', flag: 'https://flagcdn.com/w80/cu.png' },
  'Iraq': { name: 'Iraque', flag: 'https://flagcdn.com/w80/iq.png' },
  'Indonesia': { name: 'Indonésia', flag: 'https://flagcdn.com/w80/id.png' },
  'Uzbekistan': { name: 'Uzbequistão', flag: 'https://flagcdn.com/w80/uz.png' },
  'Thailand': { name: 'Tailândia', flag: 'https://flagcdn.com/w80/th.png' },
  'China PR': { name: 'China', flag: 'https://flagcdn.com/w80/cn.png' },
  'China': { name: 'China', flag: 'https://flagcdn.com/w80/cn.png' },
  'Slovakia': { name: 'Eslováquia', flag: 'https://flagcdn.com/w80/sk.png' },
  'Romania': { name: 'Romênia', flag: 'https://flagcdn.com/w80/ro.png' },
  'Greece': { name: 'Grécia', flag: 'https://flagcdn.com/w80/gr.png' },
  'Albania': { name: 'Albânia', flag: 'https://flagcdn.com/w80/al.png' },
  'Iceland': { name: 'Islândia', flag: 'https://flagcdn.com/w80/is.png' },
  'Wales': { name: 'País de Gales', flag: 'https://flagcdn.com/w80/gb-wls.png' },
  'Northern Ireland': { name: 'Irlanda do Norte', flag: 'https://flagcdn.com/w80/gb-nir.png' },
  'Ireland': { name: 'Irlanda', flag: 'https://flagcdn.com/w80/ie.png' },
  'North Macedonia': { name: 'Macedônia do Norte', flag: 'https://flagcdn.com/w80/mk.png' },
  'Kosovo': { name: 'Kosovo', flag: 'https://flagcdn.com/w80/xk.png' },
  'Georgia': { name: 'Geórgia', flag: 'https://flagcdn.com/w80/ge.png' },
  'Slovenia': { name: 'Eslovênia', flag: 'https://flagcdn.com/w80/si.png' },
  'Norway': { name: 'Noruega', flag: 'https://flagcdn.com/w80/no.png' },
  'Jordan': { name: 'Jordânia', flag: 'https://flagcdn.com/w80/jo.png' },
  'Democratic Republic of the Congo': { name: 'RD Congo', flag: 'https://flagcdn.com/w80/cd.png' },
  'Congo DR': { name: 'RD Congo', flag: 'https://flagcdn.com/w80/cd.png' },
  'DR Congo': { name: 'RD Congo', flag: 'https://flagcdn.com/w80/cd.png' },
  'Bahrain': { name: 'Barein', flag: 'https://flagcdn.com/w80/bh.png' },
  'Kuwait': { name: 'Kuwait', flag: 'https://flagcdn.com/w80/kw.png' },
  'United Arab Emirates': { name: 'Emirados Árabes', flag: 'https://flagcdn.com/w80/ae.png' },
  'UAE': { name: 'Emirados Árabes', flag: 'https://flagcdn.com/w80/ae.png' },
  'Oman': { name: 'Omã', flag: 'https://flagcdn.com/w80/om.png' },
  'Kyrgyzstan': { name: 'Quirguistão', flag: 'https://flagcdn.com/w80/kg.png' },
  'Tajikistan': { name: 'Tajiquistão', flag: 'https://flagcdn.com/w80/tj.png' },
  'Vietnam': { name: 'Vietnã', flag: 'https://flagcdn.com/w80/vn.png' },
  'Malaysia': { name: 'Malásia', flag: 'https://flagcdn.com/w80/my.png' },
  'Philippines': { name: 'Filipinas', flag: 'https://flagcdn.com/w80/ph.png' },
  'Finland': { name: 'Finlândia', flag: 'https://flagcdn.com/w80/fi.png' },
  'Bolivia': { name: 'Bolívia', flag: 'https://flagcdn.com/w80/bo.png' },
  'Zambia': { name: 'Zâmbia', flag: 'https://flagcdn.com/w80/zm.png' },
  'Mozambique': { name: 'Moçambique', flag: 'https://flagcdn.com/w80/mz.png' },
  'Angola': { name: 'Angola', flag: 'https://flagcdn.com/w80/ao.png' },
  'Libya': { name: 'Líbia', flag: 'https://flagcdn.com/w80/ly.png' },
}

export async function GET() {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    const { data: matches, error } = await fetchAllMatches()
    if (error || !matches) {
      return NextResponse.json({ error: error ?? 'Sem dados' }, { status: 500 })
    }

    const supabase = createAdminClient()
    let synced = 0
    let skipped = 0
    const errors: string[] = []

    for (const match of matches) {
      // Pula jogos do mata-mata onde os times ainda não estão definidos
      if (!match.home_team_name || !match.away_team_name) {
        skipped++
        continue
      }

      try {
        const homeTeamId = await upsertTeam(supabase, match.home_team_name, match.home_flag)
        const awayTeamId = await upsertTeam(supabase, match.away_team_name, match.away_flag)

        // 1. Procura por api_match_id (wc26_X)
        let { data: existing } = await supabase
          .from('matches')
          .select('id, source, is_manual_override, api_match_id')
          .eq('api_match_id', match.external_id)
          .single()

        // 2. Fallback: procura por times + fase (na fase de grupos cada par só joga 1 vez)
        if (!existing && match.phase?.startsWith('Grupo')) {
          const { data: byTeams } = await supabase
            .from('matches')
            .select('id, source, is_manual_override, api_match_id')
            .or(`and(home_team_id.eq.${homeTeamId},away_team_id.eq.${awayTeamId}),and(home_team_id.eq.${awayTeamId},away_team_id.eq.${homeTeamId})`)
            .eq('phase', match.phase)
            .limit(1)
            .single()

          if (byTeams) existing = byTeams
        }

        // 3. Fallback adicional: mesma data + mesmos times
        if (!existing) {
          const dateStart = match.starts_at.substring(0, 10)
          const { data: byDate } = await supabase
            .from('matches')
            .select('id, source, is_manual_override, api_match_id')
            .eq('home_team_id', homeTeamId)
            .eq('away_team_id', awayTeamId)
            .gte('starts_at', `${dateStart}T00:00:00Z`)
            .lte('starts_at', `${dateStart}T23:59:59Z`)
            .limit(1)
            .single()

          if (byDate) existing = byDate
        }

        // Não sobrescreve manuais
        if (existing?.source === 'manual' || existing?.is_manual_override) {
          skipped++
          continue
        }

        const matchData: TablesInsert<'matches'> = {
          api_match_id: match.external_id,
          source: 'api',
          home_team_id: homeTeamId,
          away_team_id: awayTeamId,
          starts_at: match.starts_at,
          phase: match.phase,
          status: match.status,
          minute: match.minute,
          home_score: match.home_score,
          away_score: match.away_score,
          is_manual_override: false,
        }

        if (existing) {
          const { id: _id, created_at: _ca, ...updateData } = matchData
          await supabase.from('matches').update(updateData).eq('id', existing.id)
        } else {
          await supabase.from('matches').insert(matchData)
        }

        synced++
      } catch (err) {
        errors.push(err instanceof Error ? err.message : 'Erro desconhecido')
      }
    }

    await supabase.from('sync_logs').insert({
      type: 'matches',
      status: errors.length > 0 ? 'partial' : 'success',
      message: `Copa 2026 (worldcup26.ir): ${synced} sincronizadas, ${skipped} ignoradas`,
    })

    return NextResponse.json({ synced, skipped, errors, total: matches.length })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro' }, { status: 500 })
  }
}

async function upsertTeam(
  supabase: ReturnType<typeof createAdminClient>,
  nameEn: string,
  flagFromApi: string | null
): Promise<string> {
  const mapped = TEAM_MAP[nameEn.trim()]
  const namePt = mapped?.name ?? nameEn.trim()
  const flagUrl = mapped?.flag ?? flagFromApi

  // 1. Procura por nome PT
  const { data: byPt } = await supabase
    .from('teams')
    .select('id, flag_url, short_name')
    .ilike('name', namePt)
    .limit(1)
    .single()

  if (byPt) {
    const updates: { flag_url?: string } = {}
    if (flagUrl && !byPt.flag_url) updates.flag_url = flagUrl
    if (Object.keys(updates).length > 0) {
      await supabase.from('teams').update(updates).eq('id', byPt.id)
    }
    return byPt.id
  }

  // 2. Procura por nome EN (caso o time tenha sido criado em inglês)
  const { data: byEn } = await supabase
    .from('teams')
    .select('id, flag_url, short_name')
    .ilike('name', nameEn.trim())
    .limit(1)
    .single()

  if (byEn) {
    // Atualiza pra nome PT preservando short_name
    await supabase.from('teams').update({
      name: namePt,
      ...(flagUrl && !byEn.flag_url ? { flag_url: flagUrl } : {}),
    }).eq('id', byEn.id)
    return byEn.id
  }

  // 3. Cria novo — gera short_name das 3 primeiras letras EM CAIXA ALTA
  const shortName = nameEn.trim().substring(0, 3).toUpperCase()
  const { data: inserted, error } = await supabase
    .from('teams')
    .insert({ name: namePt, flag_url: flagUrl, short_name: shortName })
    .select('id')
    .single()

  if (error || !inserted) throw new Error(`Falha ao criar time ${namePt}: ${error?.message}`)
  return inserted.id
}
