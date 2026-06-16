'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<'login' | 'signup'>(
    searchParams.get('tab') === 'signup' ? 'signup' : 'login'
  )
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    const supabase = createClient()
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (tab === 'signup') {
        if (!name.trim()) {
          setError('Nome obrigatório')
          return
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name: name.trim() },
          },
        })
        if (error) throw error
        setMessage('Verifique seu email para confirmar o cadastro!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao autenticar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-dvh bg-[#0a0f1e] flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="font-display text-5xl text-[#f9fafb] leading-none">BOLÃO</h1>
        <h1 className="font-display text-5xl leading-none" style={{
          background: 'linear-gradient(135deg, #F5C518, #22c55e)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          CARAÇA
        </h1>
      </div>

      <div className="w-full max-w-sm">
        {/* Tabs */}
        <div className="flex bg-[#111827] border border-[#1f2937] rounded-2xl p-1 mb-6">
          <button
            onClick={() => { setTab('login'); setError(''); setMessage('') }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === 'login'
                ? 'bg-[#F5C518] text-[#0a0f1e]'
                : 'text-[#6b7280] hover:text-[#9ca3af]'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => { setTab('signup'); setError(''); setMessage('') }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === 'signup'
                ? 'bg-[#F5C518] text-[#0a0f1e]'
                : 'text-[#6b7280] hover:text-[#9ca3af]'
            }`}
          >
            Criar conta
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'signup' && (
            <Input
              label="Seu nome"
              placeholder="Como quer ser chamado(a)?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          )}
          <Input
            label="Email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Senha"
            type="password"
            placeholder={tab === 'signup' ? 'Mínimo 6 caracteres' : 'Sua senha'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
          />

          {error && (
            <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-sm px-4 py-3 rounded-xl">
              {message}
            </div>
          )}

          <Button type="submit" fullWidth size="lg" loading={loading}>
            {tab === 'signup' ? 'Criar conta' : 'Entrar'}
          </Button>
        </form>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-dvh bg-[#0a0f1e] flex items-center justify-center">
        <div className="text-[#F5C518] animate-pulse font-display text-2xl">Carregando...</div>
      </main>
    }>
      <LoginForm />
    </Suspense>
  )
}
