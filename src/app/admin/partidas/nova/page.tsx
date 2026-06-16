import { redirect } from 'next/navigation'
import { createClient, getCurrentProfile } from '@/lib/supabase/server'
import { AppShell, TopBar } from '@/components/Navigation'
import { AdminMatchFormClient } from '@/components/admin/AdminMatchFormClient'
import type { Tables } from '@/types/database'

export default async function NovaPartidaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile(user.id)
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: teams } = await supabase.from('teams').select('*').order('name')

  return (
    <AppShell isAdmin>
      <TopBar title="Nova Partida" showBack />
      <div className="px-4 pt-4 pb-6 max-w-2xl mx-auto">
        <AdminMatchFormClient teams={(teams ?? []) as Tables<'teams'>[]} mode="create" />
      </div>
    </AppShell>
  )
}
