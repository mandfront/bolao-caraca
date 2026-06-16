import { NextResponse, type NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { recalculateMatchScores } from '@/services/sync-service'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    const { id } = await params
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('matches')
      .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
      .eq('id', id)
      .single()
    if (error) return NextResponse.json({ error: 'Partida não encontrada' }, { status: 404 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    const { id } = await params
    const body = await request.json()
    const supabase = createAdminClient()
    const { data: existing } = await supabase.from('matches').select('source, status').eq('id', id).single()
    const updateData = {
      ...body,
      ...(existing?.source === 'api' ? { is_manual_override: true } : {}),
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase.from('matches').update(updateData).eq('id', id).select().single()
    if (error) throw error
    if (body.status === 'finished' || (data.status === 'finished' && body.home_score !== undefined)) {
      await recalculateMatchScores(id)
    }
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    const { id } = await params
    const supabase = createAdminClient()
    const { error } = await supabase.from('matches').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro' }, { status: 500 })
  }
}
