import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { group_id } = await request.json()
    if (!group_id) return NextResponse.json({ error: 'group_id obrigatório' }, { status: 400 })

    const admin = createAdminClient()

    // Verifica se o usuário é o criador do grupo
    const { data: group } = await admin
      .from('groups')
      .select('created_by')
      .eq('id', group_id)
      .single()

    if (!group) return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 })

    // Se for o criador, exige que o grupo seja deletado em vez de sair
    if (group.created_by === user.id) {
      // Conta quantos outros membros existem
      const { count } = await admin
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group_id)
        .neq('user_id', user.id)

      if (count && count > 0) {
        return NextResponse.json({
          error: 'Você é o criador do grupo. Para sair, primeiro transfira a administração ou exclua o grupo.',
        }, { status: 400 })
      }

      // Único membro = pode excluir o grupo todo
      await admin.from('groups').delete().eq('id', group_id)
      return NextResponse.json({ success: true, deleted: true })
    }

    // Remove o membro
    const { error } = await admin
      .from('group_members')
      .delete()
      .eq('group_id', group_id)
      .eq('user_id', user.id)

    if (error) throw error

    // Remove palpites do usuário neste grupo (opcional, mas mais limpo)
    await admin
      .from('predictions')
      .delete()
      .eq('group_id', group_id)
      .eq('user_id', user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro' }, { status: 500 })
  }
}
