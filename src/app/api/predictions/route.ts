import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getPredictedWinner } from '@/utils/scoring'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get('match_id')
    const groupId = searchParams.get('group_id')

    const admin = createAdminClient()
    let query = admin.from('predictions').select('*, profile:profiles(name, avatar_url)')
    if (matchId) query = query.eq('match_id', matchId)
    if (groupId) query = query.eq('group_id', groupId)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const { match_id, group_id, home_score, away_score } = body

    if (!match_id || !group_id || home_score === undefined || away_score === undefined) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Verifica se o jogo ainda está aberto
    const { data: match } = await admin
      .from('matches')
      .select('starts_at, status')
      .eq('id', match_id)
      .single()

    if (!match) return NextResponse.json({ error: 'Partida não encontrada' }, { status: 404 })

    if (new Date(match.starts_at) <= new Date() || match.status !== 'scheduled') {
      return NextResponse.json({ error: 'Prazo para palpite encerrado' }, { status: 400 })
    }

    // Verifica se o usuário é membro do grupo
    const { data: membership } = await admin
      .from('group_members')
      .select('id')
      .eq('group_id', group_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Você não é membro deste grupo' }, { status: 403 })
    }

    const predictedWinner = getPredictedWinner(Number(home_score), Number(away_score))

    const { data, error } = await admin
      .from('predictions')
      .upsert(
        {
          match_id,
          group_id,
          user_id: user.id,
          home_score: Number(home_score),
          away_score: Number(away_score),
          predicted_winner: predictedWinner,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'group_id,match_id,user_id' }
      )
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro' }, { status: 500 })
  }
}
