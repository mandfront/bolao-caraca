import { redirect } from 'next/navigation'
import { createClient, getCurrentProfile, createAdminClient } from '@/lib/supabase/server'
import { AppShell, TopBar } from '@/components/Navigation'
import { RankingTable } from '@/components/ranking/RankingTable'
import { EmptyState } from '@/components/ui/LoadingState'
import Link from 'next/link'
import type { RankingEntry } from '@/types/prediction'

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>
}) {
  const { group: groupIdParam } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile(user.id)
  const isAdmin = profile?.role === 'admin'
  const admin = createAdminClient()

  const { data: memberOf } = await admin
    .from('group_members')
    .select('group_id, group:groups(id, name)')
    .eq('user_id', user.id)

  const userGroups = (memberOf ?? [])
    .map(m => m.group as { id: string; name: string } | null)
    .filter(Boolean) as { id: string; name: string }[]

  const activeGroupId = groupIdParam || userGroups[0]?.id
  const activeGroup = userGroups.find(g => g.id === activeGroupId)

  let ranking: RankingEntry[] = []
  if (activeGroupId) {
    const { data: rankingData } = await admin.rpc('calculate_group_ranking', { p_group_id: activeGroupId })
    ranking = ((rankingData ?? []) as Array<{
      user_id: string; user_name: string; avatar_url: string | null
      total_points: number; predictions_count: number
      exact_scores: number; correct_winners: number; last_points: number | null
    }>).map((r, i) => ({ ...r, position: i + 1 }))
  }

  const top3 = ranking.slice(0, 3)
  const rest = ranking.slice(3)
  const userEntry = ranking.find(r => r.user_id === user.id)

  return (
    <AppShell isAdmin={isAdmin}>
      <TopBar title="Ranking" />

      <div className="px-4 pt-4 pb-6 max-w-2xl mx-auto space-y-4">

        {/* Selector de grupos */}
        {userGroups.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {userGroups.map(group => (
              <a
                key={group.id}
                href={`/ranking?group=${group.id}`}
                className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  group.id === activeGroupId
                    ? 'bg-[#F5C518] text-[#0a0f1e]'
                    : 'bg-[#111827] border border-[#1f2937] text-[#9ca3af] hover:text-[#f9fafb]'
                }`}
              >
                {group.name}
              </a>
            ))}
          </div>
        )}

        {/* Sem grupo */}
        {!activeGroupId && (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">👥</p>
            <p className="text-[#f9fafb] font-bold text-lg mb-2">Você não está em um grupo</p>
            <p className="text-[#6b7280] text-sm mb-6">Crie ou entre em um grupo para ver o ranking</p>
            <Link href="/grupos" className="bg-[#F5C518] text-[#0a0f1e] font-bold px-6 py-3 rounded-2xl text-sm">
              Ir para Grupos →
            </Link>
          </div>
        )}

        {activeGroupId && ranking.length === 0 && (
          <EmptyState
            icon={<span className="text-4xl">🏆</span>}
            title="Ranking ainda vazio"
            description="Os pontos aparecem após os primeiros jogos terminarem"
          />
        )}

        {/* Pódio top 3 */}
        {top3.length >= 2 && (
          <div className="flex items-end justify-center gap-3 py-6 animate-slide-up">
            {/* 2º */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-14 h-14 rounded-full bg-[#1f2937] border-2 border-[#6b7280] flex items-center justify-center text-xl font-bold text-[#9ca3af]">
                {top3[1]?.user_name?.[0]?.toUpperCase()}
              </div>
              <span className="text-2xl">🥈</span>
              <p className="text-[#9ca3af] text-xs font-bold text-center w-16 truncate">{top3[1]?.user_name}</p>
              <p className="font-display text-xl text-[#9ca3af]">{top3[1]?.total_points}pts</p>
              <div className="w-16 h-10 bg-[#1f2937] rounded-t-xl border border-[#374151]" />
            </div>

            {/* 1º */}
            <div className="flex flex-col items-center gap-1.5 -mb-2">
              <div className="w-16 h-16 rounded-full bg-[#F5C518]/15 border-2 border-[#F5C518] flex items-center justify-center text-2xl font-bold text-[#F5C518]">
                {top3[0]?.user_name?.[0]?.toUpperCase()}
              </div>
              <span className="text-3xl">🥇</span>
              <p className="text-[#F5C518] text-xs font-bold text-center w-20 truncate">{top3[0]?.user_name}</p>
              <p className="font-display text-2xl text-[#F5C518]">{top3[0]?.total_points}pts</p>
              <div className="w-20 h-16 bg-[#F5C518]/10 border border-[#F5C518]/25 rounded-t-xl" />
            </div>

            {/* 3º */}
            {top3[2] && (
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-14 h-14 rounded-full bg-[#1f2937] border-2 border-[#d97706] flex items-center justify-center text-xl font-bold text-[#d97706]">
                  {top3[2]?.user_name?.[0]?.toUpperCase()}
                </div>
                <span className="text-2xl">🥉</span>
                <p className="text-[#9ca3af] text-xs font-bold text-center w-16 truncate">{top3[2]?.user_name}</p>
                <p className="font-display text-xl text-[#d97706]">{top3[2]?.total_points}pts</p>
                <div className="w-16 h-6 bg-[#1f2937] rounded-t-xl border border-[#374151]" />
              </div>
            )}
          </div>
        )}

        {/* Sua posição (se não for top 3) */}
        {userEntry && userEntry.position > 3 && (
          <div className="bg-[#F5C518]/8 border border-[#F5C518]/25 rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="font-display text-3xl text-[#F5C518]">#{userEntry.position}</span>
            <div>
              <p className="text-[#f9fafb] text-sm font-bold">{userEntry.user_name} (você)</p>
              <p className="text-[#9ca3af] text-xs">{userEntry.total_points} pts · {userEntry.exact_scores} exatos</p>
            </div>
          </div>
        )}

        {/* Tabela completa */}
        {ranking.length > 0 && (
          <>
            {activeGroup && (
              <p className="text-[#4b5563] text-xs font-bold uppercase tracking-wider">
                {activeGroup.name}
              </p>
            )}
            <RankingTable ranking={ranking} currentUserId={user.id} />
          </>
        )}

        {/* Resto da lista (se tiver mais de 3) */}
        {rest.length > 0 && (
          <div className="text-center">
            <Link href={`/grupo/${activeGroupId}`} className="text-[#F5C518] text-xs font-semibold">
              Ver página do grupo →
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  )
}
