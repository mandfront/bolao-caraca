import { NextResponse, type NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import type { TablesInsert } from '@/types/database'

export async function GET() {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*)
      `)
      .order('starts_at', { ascending: false })
      .limit(100)
    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro' }, { status: 500 })
  }
}
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    const body = await request.json()
    const supabase = createAdminClient()
    const matchData: TablesInsert<'matches'> = {
      source: 'manual',
      home_team_id: body.home_team_id,
      away_team_id: body.away_team_id,
      starts_at: body.starts_at,
      phase: body.phase ?? null,
      stadium: body.stadium ?? null,
      status: body.status ?? 'scheduled',
      minute: body.minute ?? null,
      home_score: body.home_score ?? 0,
      away_score: body.away_score ?? 0,
      home_penalty_score: body.home_penalty_score ?? null,
      away_penalty_score: body.away_penalty_score ?? null,
      is_manual_override: false,
    }
    const { data, error } = await supabase.from('matches').insert(matchData).select().single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro' }, { status: 500 })
  }
}
