-- =========================================
-- SEED: Copa do Mundo 2026 - Times e Partidas
-- Fonte: dados manuais + bandeiras flagcdn.com
-- Executar no Supabase SQL Editor
-- =========================================

-- =========================================
-- TIMES / SELEÇÕES
-- =========================================
INSERT INTO public.teams (name, short_name, flag_url, country_code) VALUES
  ('México',                'MEX', 'https://flagcdn.com/w80/mx.png', 'MX'),
  ('África do Sul',         'RSA', 'https://flagcdn.com/w80/za.png', 'ZA'),
  ('Coreia do Sul',         'KOR', 'https://flagcdn.com/w80/kr.png', 'KR'),
  ('Tchéquia',              'CZE', 'https://flagcdn.com/w80/cz.png', 'CZ'),
  ('Canadá',                'CAN', 'https://flagcdn.com/w80/ca.png', 'CA'),
  ('Bósnia e Herzegovina',  'BIH', 'https://flagcdn.com/w80/ba.png', 'BA'),
  ('Brasil',                'BRA', 'https://flagcdn.com/w80/br.png', 'BR'),
  ('Marrocos',              'MAR', 'https://flagcdn.com/w80/ma.png', 'MA'),
  ('Haiti',                 'HAI', 'https://flagcdn.com/w80/ht.png', 'HT'),
  ('Escócia',               'SCO', 'https://flagcdn.com/w80/gb-sct.png', 'GB-SCT'),
  ('Estados Unidos',        'USA', 'https://flagcdn.com/w80/us.png', 'US'),
  ('Paraguai',              'PAR', 'https://flagcdn.com/w80/py.png', 'PY'),
  ('Austrália',             'AUS', 'https://flagcdn.com/w80/au.png', 'AU'),
  ('Turquia',               'TUR', 'https://flagcdn.com/w80/tr.png', 'TR'),
  ('Catar',                 'QAT', 'https://flagcdn.com/w80/qa.png', 'QA'),
  ('Suíça',                 'SUI', 'https://flagcdn.com/w80/ch.png', 'CH'),
  ('Alemanha',              'GER', 'https://flagcdn.com/w80/de.png', 'DE'),
  ('Curaçau',               'CUW', 'https://flagcdn.com/w80/cw.png', 'CW'),
  ('Costa do Marfim',       'CIV', 'https://flagcdn.com/w80/ci.png', 'CI'),
  ('Equador',               'ECU', 'https://flagcdn.com/w80/ec.png', 'EC'),
  ('Suécia',                'SWE', 'https://flagcdn.com/w80/se.png', 'SE'),
  ('Tunísia',               'TUN', 'https://flagcdn.com/w80/tn.png', 'TN'),
  ('Países Baixos',         'NED', 'https://flagcdn.com/w80/nl.png', 'NL'),
  ('Japão',                 'JPN', 'https://flagcdn.com/w80/jp.png', 'JP'),
  ('Espanha',               'ESP', 'https://flagcdn.com/w80/es.png', 'ES'),
  ('Cabo Verde',            'CPV', 'https://flagcdn.com/w80/cv.png', 'CV'),
  ('Bélgica',               'BEL', 'https://flagcdn.com/w80/be.png', 'BE'),
  ('Egito',                 'EGY', 'https://flagcdn.com/w80/eg.png', 'EG'),
  ('Arábia Saudita',        'KSA', 'https://flagcdn.com/w80/sa.png', 'SA'),
  ('Uruguai',               'URU', 'https://flagcdn.com/w80/uy.png', 'UY'),
  ('Irã',                   'IRN', 'https://flagcdn.com/w80/ir.png', 'IR'),
  ('Nova Zelândia',         'NZL', 'https://flagcdn.com/w80/nz.png', 'NZ')
ON CONFLICT (lower(name)) WHERE api_team_id IS NULL DO NOTHING;

-- =========================================
-- PARTIDAS JOGADAS
-- =========================================

-- Helper: busca id do time pelo nome
-- Usamos subqueries inline

-- QUINTA, 11/06 — Abertura
INSERT INTO public.matches (source, home_team_id, away_team_id, starts_at, phase, status, home_score, away_score, stadium, is_manual_override)
SELECT 'manual',
  (SELECT id FROM public.teams WHERE name = 'México'),
  (SELECT id FROM public.teams WHERE name = 'África do Sul'),
  '2026-06-11T17:00:00-03:00', 'Grupo A', 'finished', 2, 0,
  'SoFi Stadium, Los Angeles', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.matches m
  JOIN public.teams ht ON ht.id = m.home_team_id AND ht.name = 'México'
  JOIN public.teams at ON at.id = m.away_team_id AND at.name = 'África do Sul'
);

INSERT INTO public.matches (source, home_team_id, away_team_id, starts_at, phase, status, home_score, away_score, is_manual_override)
SELECT 'manual',
  (SELECT id FROM public.teams WHERE name = 'Coreia do Sul'),
  (SELECT id FROM public.teams WHERE name = 'Tchéquia'),
  '2026-06-11T20:00:00-03:00', 'Grupo A', 'finished', 2, 1, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.matches m
  JOIN public.teams ht ON ht.id = m.home_team_id AND ht.name = 'Coreia do Sul'
  JOIN public.teams at ON at.id = m.away_team_id AND at.name = 'Tchéquia'
);

-- SEXTA, 12/06
INSERT INTO public.matches (source, home_team_id, away_team_id, starts_at, phase, status, home_score, away_score, is_manual_override)
SELECT 'manual',
  (SELECT id FROM public.teams WHERE name = 'Canadá'),
  (SELECT id FROM public.teams WHERE name = 'Bósnia e Herzegovina'),
  '2026-06-12T20:00:00-03:00', 'Grupo B', 'finished', 1, 1, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.matches m
  JOIN public.teams ht ON ht.id = m.home_team_id AND ht.name = 'Canadá'
  JOIN public.teams at ON at.id = m.away_team_id AND at.name = 'Bósnia e Herzegovina'
);

-- SÁBADO, 13/06
INSERT INTO public.matches (source, home_team_id, away_team_id, starts_at, phase, status, home_score, away_score, is_manual_override)
SELECT 'manual',
  (SELECT id FROM public.teams WHERE name = 'Brasil'),
  (SELECT id FROM public.teams WHERE name = 'Marrocos'),
  '2026-06-13T16:00:00-03:00', 'Grupo C', 'finished', 1, 1, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.matches m
  JOIN public.teams ht ON ht.id = m.home_team_id AND ht.name = 'Brasil'
  JOIN public.teams at ON at.id = m.away_team_id AND at.name = 'Marrocos'
);

INSERT INTO public.matches (source, home_team_id, away_team_id, starts_at, phase, status, home_score, away_score, is_manual_override)
SELECT 'manual',
  (SELECT id FROM public.teams WHERE name = 'Haiti'),
  (SELECT id FROM public.teams WHERE name = 'Escócia'),
  '2026-06-13T13:00:00-03:00', 'Grupo C', 'finished', 0, 1, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.matches m
  JOIN public.teams ht ON ht.id = m.home_team_id AND ht.name = 'Haiti'
  JOIN public.teams at ON at.id = m.away_team_id AND at.name = 'Escócia'
);

INSERT INTO public.matches (source, home_team_id, away_team_id, starts_at, phase, status, home_score, away_score, is_manual_override)
SELECT 'manual',
  (SELECT id FROM public.teams WHERE name = 'Estados Unidos'),
  (SELECT id FROM public.teams WHERE name = 'Paraguai'),
  '2026-06-13T19:00:00-03:00', 'Grupo D', 'finished', 4, 1, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.matches m
  JOIN public.teams ht ON ht.id = m.home_team_id AND ht.name = 'Estados Unidos'
  JOIN public.teams at ON at.id = m.away_team_id AND at.name = 'Paraguai'
);

INSERT INTO public.matches (source, home_team_id, away_team_id, starts_at, phase, status, home_score, away_score, is_manual_override)
SELECT 'manual',
  (SELECT id FROM public.teams WHERE name = 'Austrália'),
  (SELECT id FROM public.teams WHERE name = 'Turquia'),
  '2026-06-13T22:00:00-03:00', 'Grupo D', 'finished', 2, 0, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.matches m
  JOIN public.teams ht ON ht.id = m.home_team_id AND ht.name = 'Austrália'
  JOIN public.teams at ON at.id = m.away_team_id AND at.name = 'Turquia'
);

INSERT INTO public.matches (source, home_team_id, away_team_id, starts_at, phase, status, home_score, away_score, is_manual_override)
SELECT 'manual',
  (SELECT id FROM public.teams WHERE name = 'Catar'),
  (SELECT id FROM public.teams WHERE name = 'Suíça'),
  '2026-06-13T16:00:00-03:00', 'Grupo B', 'finished', 1, 1, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.matches m
  JOIN public.teams ht ON ht.id = m.home_team_id AND ht.name = 'Catar'
  JOIN public.teams at ON at.id = m.away_team_id AND at.name = 'Suíça'
);

-- DOMINGO, 14/06
INSERT INTO public.matches (source, home_team_id, away_team_id, starts_at, phase, status, home_score, away_score, is_manual_override)
SELECT 'manual',
  (SELECT id FROM public.teams WHERE name = 'Alemanha'),
  (SELECT id FROM public.teams WHERE name = 'Curaçau'),
  '2026-06-14T13:00:00-03:00', 'Grupo E', 'finished', 7, 1, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.matches m
  JOIN public.teams ht ON ht.id = m.home_team_id AND ht.name = 'Alemanha'
  JOIN public.teams at ON at.id = m.away_team_id AND at.name = 'Curaçau'
);

INSERT INTO public.matches (source, home_team_id, away_team_id, starts_at, phase, status, home_score, away_score, is_manual_override)
SELECT 'manual',
  (SELECT id FROM public.teams WHERE name = 'Costa do Marfim'),
  (SELECT id FROM public.teams WHERE name = 'Equador'),
  '2026-06-14T16:00:00-03:00', 'Grupo E', 'finished', 1, 0, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.matches m
  JOIN public.teams ht ON ht.id = m.home_team_id AND ht.name = 'Costa do Marfim'
  JOIN public.teams at ON at.id = m.away_team_id AND at.name = 'Equador'
);

INSERT INTO public.matches (source, home_team_id, away_team_id, starts_at, phase, status, home_score, away_score, is_manual_override)
SELECT 'manual',
  (SELECT id FROM public.teams WHERE name = 'Suécia'),
  (SELECT id FROM public.teams WHERE name = 'Tunísia'),
  '2026-06-14T19:00:00-03:00', 'Grupo F', 'finished', 5, 1, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.matches m
  JOIN public.teams ht ON ht.id = m.home_team_id AND ht.name = 'Suécia'
  JOIN public.teams at ON at.id = m.away_team_id AND at.name = 'Tunísia'
);

INSERT INTO public.matches (source, home_team_id, away_team_id, starts_at, phase, status, home_score, away_score, is_manual_override)
SELECT 'manual',
  (SELECT id FROM public.teams WHERE name = 'Países Baixos'),
  (SELECT id FROM public.teams WHERE name = 'Japão'),
  '2026-06-14T22:00:00-03:00', 'Grupo F', 'finished', 2, 2, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.matches m
  JOIN public.teams ht ON ht.id = m.home_team_id AND ht.name = 'Países Baixos'
  JOIN public.teams at ON at.id = m.away_team_id AND at.name = 'Japão'
);

-- SEGUNDA, 15/06 — Hoje
INSERT INTO public.matches (source, home_team_id, away_team_id, starts_at, phase, status, home_score, away_score, is_manual_override)
SELECT 'manual',
  (SELECT id FROM public.teams WHERE name = 'Espanha'),
  (SELECT id FROM public.teams WHERE name = 'Cabo Verde'),
  '2026-06-15T13:00:00-03:00', 'Grupo H', 'finished', 0, 0, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.matches m
  JOIN public.teams ht ON ht.id = m.home_team_id AND ht.name = 'Espanha'
  JOIN public.teams at ON at.id = m.away_team_id AND at.name = 'Cabo Verde'
);

INSERT INTO public.matches (source, home_team_id, away_team_id, starts_at, phase, status, home_score, away_score, is_manual_override)
SELECT 'manual',
  (SELECT id FROM public.teams WHERE name = 'Bélgica'),
  (SELECT id FROM public.teams WHERE name = 'Egito'),
  '2026-06-15T16:00:00-03:00', 'Grupo G', 'finished', 1, 1, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.matches m
  JOIN public.teams ht ON ht.id = m.home_team_id AND ht.name = 'Bélgica'
  JOIN public.teams at ON at.id = m.away_team_id AND at.name = 'Egito'
);

INSERT INTO public.matches (source, home_team_id, away_team_id, starts_at, phase, status, home_score, away_score, minute, is_manual_override)
SELECT 'manual',
  (SELECT id FROM public.teams WHERE name = 'Arábia Saudita'),
  (SELECT id FROM public.teams WHERE name = 'Uruguai'),
  '2026-06-15T19:00:00-03:00', 'Grupo H', 'halftime', 0, 0, 45, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.matches m
  JOIN public.teams ht ON ht.id = m.home_team_id AND ht.name = 'Arábia Saudita'
  JOIN public.teams at ON at.id = m.away_team_id AND at.name = 'Uruguai'
);

INSERT INTO public.matches (source, home_team_id, away_team_id, starts_at, phase, status, is_manual_override)
SELECT 'manual',
  (SELECT id FROM public.teams WHERE name = 'Irã'),
  (SELECT id FROM public.teams WHERE name = 'Nova Zelândia'),
  '2026-06-15T22:00:00-03:00', 'Grupo G', 'scheduled', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.matches m
  JOIN public.teams ht ON ht.id = m.home_team_id AND ht.name = 'Irã'
  JOIN public.teams at ON at.id = m.away_team_id AND at.name = 'Nova Zelândia'
);
