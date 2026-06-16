import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    const apiKey = process.env.API_FUTEBOL_KEY
    if (!apiKey || apiKey.includes('sem-chave') || apiKey.includes('sua-api')) {
      return NextResponse.json({ configured: false, error: 'API Key não configurada no .env.local' })
    }

    const res = await fetch('https://v3.football.api-sports.io/status', {
      headers: { 'x-apisports-key': apiKey },
    })

    if (!res.ok) {
      return NextResponse.json({ configured: true, error: `API retornou ${res.status}` })
    }

    const json = await res.json()

    if (json.errors && Object.keys(json.errors).length > 0) {
      return NextResponse.json({ configured: true, error: Object.values(json.errors).join(', ') })
    }

    return NextResponse.json({
      configured: true,
      account: json.response?.account?.firstname ?? null,
      plan: json.response?.subscription?.name ?? null,
      requests_used: json.response?.requests?.current ?? 0,
      requests_limit: json.response?.requests?.limit_day ?? 100,
      requests_remaining: (json.response?.requests?.limit_day ?? 100) - (json.response?.requests?.current ?? 0),
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro' }, { status: 500 })
  }
}
