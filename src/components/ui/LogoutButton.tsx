'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-[#ef4444]/30 text-[#ef4444] font-semibold text-sm hover:bg-[#ef4444]/10 active:scale-95 transition-all disabled:opacity-50"
    >
      <LogOut size={18} />
      {loading ? 'Saindo...' : 'Sair da conta'}
    </button>
  )
}
