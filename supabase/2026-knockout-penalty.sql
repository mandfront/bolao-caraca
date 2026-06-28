-- =========================================
-- MATA-MATA: aposta de pênaltis
-- Adiciona a coluna que guarda o palpite de "quem passa nos pênaltis"
-- nos jogos de fase eliminatória. Nullable (só usada no mata-mata).
-- =========================================

alter table public.predictions
  add column if not exists penalty_advance text
  check (penalty_advance in ('home', 'away'));

comment on column public.predictions.penalty_advance is
  'Palpite de quem avança em caso de pênaltis (home/away). Bônus de +2 pts se o jogo for decidido nos pênaltis e acertar.';
