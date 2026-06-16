import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, getCurrentProfile, createAdminClient } from '@/lib/supabase/server'
import { AppShell, TopBar } from '@/components/Navigation'
import { Badge } from '@/components/ui/Badge'
import { getStatusLabel } from '@/utils/match-status'
import { formatDateTime } from '@/utils/date'
import type { Match } from '@/types/match'

export default async function AdminPartidasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile(user.id)
  if (profile?.role !== 'admin') redirect('/dashboard')

  const admin = createAdminClient()
  const { data: matches } = await admin
    .from('matches')
    .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
    .order('starts_at', { ascending: false })
    .limit(100)

  const allMatches = (matches ?? []) as unknown as Match[]

  return (
    <AppShell isAdmin>
      <TopBar
        title="Partidas"
        showBack
        action={
          <Link
            href="/admin/partidas/nova"
            className="bg-[#F5C518] text-[#0a0f1e] text-xs font-bold px-3 py-2 rounded-xl hover:bg-[#f0ba00] transition-colors"
          >
            + Nova
          </Link>
        }
      />

      <div className="px-4 pt-4 pb-6 max-w-2xl mx-auto space-y-3">
        {allMatches.map((match) => (
          <Link key={match.id} href={`/admin/partidas/${match.id}`}>
            <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-4 hover:border-[#374151] transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={match.status === 'live' ? 'green' : match.status === 'finished' ? 'default' : 'blue'}
                  >
                    {getStatusLabel(match.status)}
                  </Badge>
                  {match.source === 'manual' && (
                    <Badge variant="yellow">Manual</Badge>
                  )}
                  {match.is_manual_override && (
                    <Badge variant="yellow">Override</Badge>
                  )}
                </div>
                <span className="text-[#4b5563] text-xs">{formatDateTime(match.starts_at)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[#f9fafb] font-semibold flex-1 text-right">
                  {match.home_team?.short_name || match.home_team?.name}
                </span>
                <span className="text-[#6b7280] text-xs">
                  {match.status === 'scheduled' ? 'vs' : `${match.home_score} : ${match.away_score}`}
                </span>
                <span className="text-[#f9fafb] font-semibold flex-1">
                  {match.away_team?.short_name || match.away_team?.name}
                </span>
              </div>
              {match.phase && (
                <p className="text-[#4b5563] text-xs mt-1">{match.phase}</p>
              )}
            </div>
          </Link>
        ))}

        {allMatches.length === 0 && (
          <div className="text-center py-12 text-[#4b5563]">
            <p className="text-3xl mb-2">⚽</p>
            <p className="text-sm">Nenhuma partida cadastrada</p>
            <Link href="/admin/partidas/nova" className="text-[#F5C518] text-xs mt-2 inline-block">
              Criar primeira partida →
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  )
}
