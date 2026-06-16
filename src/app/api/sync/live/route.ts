import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { syncLiveMatches } from '@/services/sync-service'

export async function POST() {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    const result = await syncLiveMatches()
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 }
    )
  }
}
