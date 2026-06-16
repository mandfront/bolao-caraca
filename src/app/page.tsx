import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-dvh bg-[#0a0f1e] flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8 text-center relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#22c55e]/5 blur-[120px]" />
          <div className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-[#F5C518]/5 blur-[100px]" />
        </div>

        {/* Badge */}
        <div className="relative mb-6 inline-flex items-center gap-2 bg-[#22c55e]/10 border border-[#22c55e]/25 text-[#22c55e] text-xs font-bold px-3 py-1.5 rounded-full tracking-widest uppercase animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
          Copa do Mundo 2026
        </div>

        {/* Logo/Title */}
        <div className="relative mb-4 animate-slide-up">
          <h1 className="font-display text-7xl sm:text-8xl text-[#f9fafb] leading-none tracking-wider">
            BOLÃO
          </h1>
          <h1 className="font-display text-7xl sm:text-8xl leading-none tracking-wider" style={{
            background: 'linear-gradient(135deg, #F5C518 0%, #f0ba00 50%, #22c55e 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            CARAÇA
          </h1>
        </div>

        {/* Subtitle */}
        <p className="relative text-[#6b7280] text-base max-w-xs mx-auto mb-8 animate-slide-up delay-100">
          Bolão privado e familiar da Copa do Mundo. Palpites, ranking e emoção com quem você ama.
        </p>

        {/* Features */}
        <div className="relative grid grid-cols-3 gap-3 mb-10 w-full max-w-xs animate-slide-up delay-200">
          {[
            { icon: '🎯', label: 'Palpites' },
            { icon: '📊', label: 'Ranking' },
            { icon: '⚡', label: 'Ao Vivo' },
          ].map(({ icon, label }) => (
            <div key={label} className="bg-[#111827] border border-[#1f2937] rounded-2xl p-3 flex flex-col items-center gap-1.5">
              <span className="text-2xl">{icon}</span>
              <span className="text-[#9ca3af] text-xs font-semibold">{label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="relative flex flex-col gap-3 w-full max-w-xs animate-slide-up delay-300">
          <Link
            href="/login"
            className="w-full bg-[#F5C518] text-[#0a0f1e] font-bold py-4 rounded-2xl text-base text-center hover:bg-[#f0ba00] transition-colors active:scale-95 shadow-lg shadow-[#F5C518]/20"
          >
            Entrar no Bolão
          </Link>
          <Link
            href="/login?tab=signup"
            className="w-full bg-[#111827] border border-[#1f2937] text-[#f9fafb] font-semibold py-4 rounded-2xl text-base text-center hover:bg-[#1a2232] transition-colors active:scale-95"
          >
            Criar conta grátis
          </Link>
        </div>

        {/* Disclaimer */}
        <p className="relative mt-8 text-[#4b5563] text-xs text-center max-w-xs animate-fade-in delay-400">
          Sem apostas, sem dinheiro, sem cadastro de cartão. Só diversão em família 🏆
        </p>
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-[#374151] text-xs">
        Bolão Caraça © 2026
      </footer>
    </main>
  )
}
