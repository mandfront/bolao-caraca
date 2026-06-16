import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/server'

// Verifica se o usuário autenticado é admin usando service role (bypassa RLS)
// Retorna o user se for admin, null caso contrário
export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const profile = await getCurrentProfile(user.id)
  if (profile?.role !== 'admin') return null

  return user
}
