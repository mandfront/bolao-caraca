import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Bolão Caraça',
    template: '%s | Bolão Caraça',
  },
  description: 'Bolão familiar privado da Copa do Mundo. Palpites, ranking e acompanhamento ao vivo.',
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/icon.png', type: 'image/png', sizes: '512x512' }],
    apple: [{ url: '/icon.png', sizes: '512x512' }],
    shortcut: '/icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'Bolão Caraça',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    title: 'Bolão Caraça',
    description: 'Bolão familiar privado da Copa do Mundo',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0f1e',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-stadium min-h-dvh">{children}</body>
    </html>
  )
}
