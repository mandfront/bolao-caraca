import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateInviteCode } from '@/utils/invite-code'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('group_members')
      .select(`group:groups(id, name, invite_code, created_by, created_at)`)
      .eq('user_id', user.id)

    if (error) throw error

    // Busca contagem de membros por grupo
    const groups = (data ?? []).map(d => d.group).filter(Boolean)
    const groupIds = groups.map(g => (g as { id: string }).id)

    let memberCounts: Record<string, number> = {}
    if (groupIds.length > 0) {
      const { data: counts } = await admin
        .from('group_members')
        .select('group_id')
        .in('group_id', groupIds)

      memberCounts = (counts ?? []).reduce((acc, m) => {
        acc[m.group_id] = (acc[m.group_id] ?? 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    const result = groups.map(g => ({
      ...(g as object),
      member_count: memberCounts[(g as { id: string }).id] ?? 1,
    }))

    return NextResponse.json(result)
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
    const { name, action, invite_code } = body
    const admin = createAdminClient()

    // Entrar em grupo por código
    if (action === 'join') {
      if (!invite_code) return NextResponse.json({ error: 'Código obrigatório' }, { status: 400 })

      const { data: group } = await admin
        .from('groups')
        .select('id')
        .eq('invite_code', invite_code.trim().toUpperCase())
        .single()

      if (!group) {
        // Tenta case-insensitive
        const { data: group2 } = await admin
          .from('groups')
          .select('id')
          .ilike('invite_code', invite_code.trim())
          .single()

        if (!group2) return NextResponse.json({ error: 'Grupo não encontrado. Verifique o código.' }, { status: 404 })

        const { error: memberError } = await admin
          .from('group_members')
          .insert({ group_id: group2.id, user_id: user.id })

        if (memberError?.code === '23505') {
          return NextResponse.json({ error: 'Você já está neste grupo' }, { status: 409 })
        }
        if (memberError) throw memberError
        return NextResponse.json({ group_id: group2.id })
      }

      const { error: memberError } = await admin
        .from('group_members')
        .insert({ group_id: group.id, user_id: user.id })

      if (memberError?.code === '23505') {
        return NextResponse.json({ error: 'Você já está neste grupo' }, { status: 409 })
      }
      if (memberError) throw memberError
      return NextResponse.json({ group_id: group.id })
    }

    // Criar grupo
    if (!name?.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

    // Gera código único
    let code = generateInviteCode()
    for (let i = 0; i < 5; i++) {
      const { data: existing } = await admin.from('groups').select('id').eq('invite_code', code).single()
      if (!existing) break
      code = generateInviteCode()
    }

    const { data: group, error: groupError } = await admin
      .from('groups')
      .insert({ name: name.trim(), invite_code: code, created_by: user.id })
      .select()
      .single()

    if (groupError) throw groupError

    await admin.from('group_members').insert({ group_id: group.id, user_id: user.id })

    return NextResponse.json(group, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro' }, { status: 500 })
  }
}
