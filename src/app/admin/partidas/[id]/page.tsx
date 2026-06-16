import { redirect, notFound } from 'next/navigation'
import { createClient, getCurrentProfile, createAdminClient } from '@/lib/supabase/server'
import { AppShell, TopBar } from '@/components/Navigation'
import { AdminMatchFormClient } from '@/components/admin/AdminMatchFormClient'
import type { Tables } from '@/types/database'
import type { Match } from '@/types/match'

export default async function EditarPartidaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile(user.id)
  if (profile?.role !== 'admin') redirect('/dashboard')

  const admin = createAdminClient()
  const [matchResult, teamsResult] = await Promise.all([
    admin
      .from('matches')
      .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
      .eq('id', id)
      .single(),
    admin.from('teams').select('*').order('name'),
  ])

  if (!matchResult.data) notFound()

  return (
    <AppShell isAdmin>
      <TopBar title="Editar Partida" showBack />
      <div className="px-4 pt-4 pb-6 max-w-2xl mx-auto">
        <AdminMatchFormClient
          teams={(teamsResult.data ?? []) as Tables<'teams'>[]}
          match={matchResult.data as unknown as Match}
          mode="edit"
        />
      </div>
    </AppShell>
  )
}
