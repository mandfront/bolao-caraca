'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AvatarUploadProps {
  userId: string
  currentUrl: string | null
  name: string
}

export function AvatarUpload({ userId, currentUrl, name }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setError('Imagem muito grande. Máximo 2MB.')
      return
    }

    setError(null)
    setUploading(true)

    try {
      // Preview imediato
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)

      const supabase = createClient()
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const path = `${userId}/avatar.${ext}`

      // Upload para Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      // Pega URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path)

      // Atualiza perfil
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: publicUrl }),
      })

      if (!res.ok) throw new Error('Falha ao salvar foto')

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar foto')
      setPreview(currentUrl)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#F5C518]/40 hover:border-[#F5C518] transition-all group"
      >
        {preview ? (
          <img
            src={preview}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[#F5C518]/15 flex items-center justify-center">
            <span className="font-display text-3xl text-[#F5C518]">
              {name?.[0]?.toUpperCase() ?? 'A'}
            </span>
          </div>
        )}

        {/* Overlay de câmera */}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {uploading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          )}
        </div>
      </button>

      {/* Badge câmera pequeno */}
      <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#F5C518] border-2 border-[#0a0f1e] flex items-center justify-center pointer-events-none">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#0a0f1e" strokeWidth="3">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
      />

      {error && (
        <p className="absolute top-full left-1/2 -translate-x-1/2 mt-2 text-[#ef4444] text-[10px] whitespace-nowrap bg-[#0a0f1e] px-2 py-1 rounded-lg border border-[#ef4444]/30">
          {error}
        </p>
      )}
    </div>
  )
}
