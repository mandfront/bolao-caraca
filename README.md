# Bolão Caraça ⚽

Bolão privado e familiar da Copa do Mundo 2026. Palpites, ranking e acompanhamento ao vivo — sem apostas, sem dinheiro.

## Stack

- **Next.js 16** App Router + TypeScript
- **Tailwind CSS v4**
- **Supabase** (Auth, Database, RLS, Storage)
- **Vercel** (deploy + cron)
- **football-data.org** (dados dos jogos — gratuito)

## Funcionalidades

- 🔐 Autenticação com Supabase Auth (email/senha)
- 👥 Grupos familiares com código de convite
- 🎯 Palpites com bloqueio automático no início do jogo
- 📊 Pontuação: 5pts (exato) / 3pts (vencedor) / 2pts (saldo) / 1pt (gols)
- 🏆 Ranking por grupo com pódio Top 3
- 📋 Classificação da Copa com critérios oficiais (confronto direto)
- ⚡ Jogos ao vivo com atualização automática a cada 60s
- 🔧 Painel admin com sincronização e cadastro manual
- 📱 PWA — instalável no iPhone e Android

## Regras de pontuação

| Critério | Pontos |
|---|---|
| Placar exato | **5 pts** |
| Acertou vencedor/empate | **3 pts** |
| Acertou saldo de gols | **2 pts** |
| Acertou gols de um time | **1 pt** |
| Errou tudo | **0 pts** |

Pontos não se acumulam — aplica-se apenas o maior critério atingido.

## Setup local

```bash
yarn install
cp .env.example .env.local
yarn dev
```

Execute `supabase/schema.sql` e `supabase/auto-ranking.sql` no Supabase SQL Editor antes de rodar.
