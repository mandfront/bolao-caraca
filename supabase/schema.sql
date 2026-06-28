-- =========================================
-- BOLÃO CARAÇA - Schema Supabase
-- =========================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =========================================
-- PROFILES
-- =========================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- trigger: create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Usuário'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- trigger: update updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- =========================================
-- GROUPS
-- =========================================
create table if not exists public.groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  invite_code text unique not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

alter table public.groups enable row level security;

-- =========================================
-- GROUP MEMBERS
-- =========================================
create table if not exists public.group_members (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(group_id, user_id)
);

alter table public.group_members enable row level security;

-- =========================================
-- TEAMS
-- =========================================
create table if not exists public.teams (
  id uuid primary key default uuid_generate_v4(),
  api_team_id text unique,
  name text not null,
  short_name text,
  flag_url text,
  country_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.teams enable row level security;

create unique index if not exists teams_name_no_api_idx
  on public.teams(lower(name))
  where api_team_id is null;

create trigger teams_updated_at
  before update on public.teams
  for each row execute procedure public.set_updated_at();

-- =========================================
-- MATCHES
-- =========================================
create table if not exists public.matches (
  id uuid primary key default uuid_generate_v4(),
  api_match_id text unique,
  source text not null default 'api' check (source in ('api', 'manual')),
  home_team_id uuid not null references public.teams(id),
  away_team_id uuid not null references public.teams(id),
  starts_at timestamptz not null,
  phase text,
  stadium text,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'live', 'halftime', 'finished', 'postponed', 'cancelled')),
  minute integer,
  home_score integer not null default 0,
  away_score integer not null default 0,
  home_penalty_score integer,
  away_penalty_score integer,
  is_manual_override boolean not null default false,
  raw_api_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.matches enable row level security;

create index if not exists matches_starts_at_idx on public.matches(starts_at);
create index if not exists matches_status_idx on public.matches(status);

create trigger matches_updated_at
  before update on public.matches
  for each row execute procedure public.set_updated_at();

-- =========================================
-- PREDICTIONS
-- =========================================
create table if not exists public.predictions (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  home_score integer not null,
  away_score integer not null,
  predicted_winner text not null check (predicted_winner in ('home', 'away', 'draw')),
  penalty_advance text check (penalty_advance in ('home', 'away')),
  points integer not null default 0,
  exact_score boolean not null default false,
  correct_winner boolean not null default false,
  correct_goal_difference boolean not null default false,
  correct_team_goals boolean not null default false,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(group_id, match_id, user_id)
);

alter table public.predictions enable row level security;

create index if not exists predictions_user_idx on public.predictions(user_id);
create index if not exists predictions_match_idx on public.predictions(match_id);
create index if not exists predictions_group_idx on public.predictions(group_id);

create trigger predictions_updated_at
  before update on public.predictions
  for each row execute procedure public.set_updated_at();

-- =========================================
-- SCORE LOGS
-- =========================================
create table if not exists public.score_logs (
  id uuid primary key default uuid_generate_v4(),
  prediction_id uuid not null references public.predictions(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  points integer not null,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.score_logs enable row level security;

-- =========================================
-- LINEUPS
-- =========================================
create table if not exists public.lineups (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid not null references public.matches(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  formation text,
  coach_name text,
  raw_api_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(match_id, team_id)
);

alter table public.lineups enable row level security;

create trigger lineups_updated_at
  before update on public.lineups
  for each row execute procedure public.set_updated_at();

-- =========================================
-- PLAYER LINEUPS
-- =========================================
create table if not exists public.player_lineups (
  id uuid primary key default uuid_generate_v4(),
  lineup_id uuid not null references public.lineups(id) on delete cascade,
  player_name text not null,
  shirt_number integer,
  position text,
  is_starter boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.player_lineups enable row level security;

-- =========================================
-- MATCH EVENTS
-- =========================================
create table if not exists public.match_events (
  id uuid primary key default uuid_generate_v4(),
  api_event_id text,
  match_id uuid not null references public.matches(id) on delete cascade,
  team_id uuid references public.teams(id),
  minute integer,
  event_type text not null
    check (event_type in ('goal', 'yellow_card', 'red_card', 'substitution', 'penalty', 'own_goal', 'var', 'other')),
  player_name text,
  assist_player_name text,
  description text,
  raw_api_data jsonb,
  created_at timestamptz not null default now()
);

alter table public.match_events enable row level security;

create index if not exists match_events_match_idx on public.match_events(match_id);

-- dedup index when api_event_id present
create unique index if not exists match_events_api_event_idx
  on public.match_events(api_event_id)
  where api_event_id is not null;

-- =========================================
-- SYNC LOGS
-- =========================================
create table if not exists public.sync_logs (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type in ('matches', 'live', 'lineups', 'events', 'scores')),
  status text not null check (status in ('success', 'error', 'partial')),
  message text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.sync_logs enable row level security;

-- =========================================
-- ROW LEVEL SECURITY POLICIES
-- =========================================

-- PROFILES
create policy "Usuários podem ver seus próprios profiles"
  on public.profiles for select
  using (
    auth.uid() = id
    or exists (
      select 1 from public.group_members gm1
      join public.group_members gm2 on gm1.group_id = gm2.group_id
      where gm1.user_id = auth.uid() and gm2.user_id = profiles.id
    )
  );

create policy "Usuários podem atualizar seu próprio profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admin pode gerenciar profiles"
  on public.profiles for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- GROUPS
create policy "Membros podem ver seus grupos"
  on public.groups for select
  using (
    exists (
      select 1 from public.group_members
      where group_id = groups.id and user_id = auth.uid()
    )
  );

create policy "Usuário autenticado pode criar grupo"
  on public.groups for insert
  with check (auth.uid() = created_by);

create policy "Criador pode atualizar grupo"
  on public.groups for update
  using (auth.uid() = created_by);

-- GROUP MEMBERS
create policy "Membros podem ver integrantes do grupo"
  on public.group_members for select
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id and gm.user_id = auth.uid()
    )
  );

create policy "Usuário pode entrar em grupo"
  on public.group_members for insert
  with check (auth.uid() = user_id);

create policy "Usuário pode sair de grupo"
  on public.group_members for delete
  using (auth.uid() = user_id);

-- TEAMS (leitura pública para autenticados)
create policy "Autenticados podem ver times"
  on public.teams for select
  using (auth.uid() is not null);

create policy "Admin pode gerenciar times"
  on public.teams for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- MATCHES (leitura pública para autenticados)
create policy "Autenticados podem ver partidas"
  on public.matches for select
  using (auth.uid() is not null);

create policy "Admin pode gerenciar partidas"
  on public.matches for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- PREDICTIONS
-- Antes do jogo: usuário vê apenas seu próprio palpite
-- Após início: membros do mesmo grupo veem entre si
create policy "Usuário vê seu palpite antes do jogo; grupo vê após início"
  on public.predictions for select
  using (
    auth.uid() = user_id
    or (
      exists (
        select 1 from public.matches m
        where m.id = predictions.match_id
          and m.starts_at <= now()
          and m.status in ('live', 'halftime', 'finished')
      )
      and exists (
        select 1 from public.group_members gm1
        join public.group_members gm2 on gm1.group_id = gm2.group_id
        where gm1.user_id = auth.uid()
          and gm2.user_id = predictions.user_id
          and gm1.group_id = predictions.group_id
      )
    )
  );

create policy "Usuário pode criar palpite antes do jogo"
  on public.predictions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.matches m
      where m.id = match_id
        and m.starts_at > now()
        and m.status = 'scheduled'
    )
    and exists (
      select 1 from public.group_members
      where group_id = predictions.group_id and user_id = auth.uid()
    )
  );

create policy "Usuário pode editar seu palpite antes do jogo"
  on public.predictions for update
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.matches m
      where m.id = match_id
        and m.starts_at > now()
        and m.status = 'scheduled'
    )
  );

create policy "Admin pode gerenciar palpites"
  on public.predictions for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- SCORE LOGS
create policy "Usuário vê seus score logs"
  on public.score_logs for select
  using (auth.uid() = user_id);

create policy "Admin pode ver todos os score logs"
  on public.score_logs for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- LINEUPS & PLAYERS
create policy "Autenticados podem ver escalações"
  on public.lineups for select
  using (auth.uid() is not null);

create policy "Autenticados podem ver jogadores"
  on public.player_lineups for select
  using (auth.uid() is not null);

create policy "Admin pode gerenciar escalações"
  on public.lineups for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- MATCH EVENTS
create policy "Autenticados podem ver eventos"
  on public.match_events for select
  using (auth.uid() is not null);

create policy "Admin pode gerenciar eventos"
  on public.match_events for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- SYNC LOGS
create policy "Admin pode ver sync logs"
  on public.sync_logs for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Service role pode inserir sync logs"
  on public.sync_logs for insert
  with check (true);

-- =========================================
-- RANKING FUNCTION
-- =========================================
create or replace function public.calculate_group_ranking(p_group_id uuid)
returns table (
  user_id uuid,
  user_name text,
  avatar_url text,
  total_points bigint,
  predictions_count bigint,
  exact_scores bigint,
  correct_winners bigint,
  last_points integer
)
language sql
stable
security definer
as $$
  select
    p.id as user_id,
    p.name as user_name,
    p.avatar_url,
    coalesce(sum(pr.points), 0) as total_points,
    count(pr.id) as predictions_count,
    count(pr.id) filter (where pr.exact_score = true) as exact_scores,
    count(pr.id) filter (where pr.correct_winner = true) as correct_winners,
    (
      select pr2.points
      from public.predictions pr2
      join public.matches m2 on m2.id = pr2.match_id
      where pr2.user_id = p.id
        and pr2.group_id = p_group_id
        and m2.status = 'finished'
      order by m2.updated_at desc
      limit 1
    ) as last_points
  from public.profiles p
  join public.group_members gm on gm.user_id = p.id and gm.group_id = p_group_id
  left join public.predictions pr on pr.user_id = p.id and pr.group_id = p_group_id
  group by p.id, p.name, p.avatar_url
  order by
    total_points desc,
    exact_scores desc,
    correct_winners desc,
    predictions_count desc,
    p.name asc;
$$;

-- =========================================
-- SEED: Times da Copa do Mundo 2026
-- =========================================
-- (Adicionar times manualmente ou via sync da API)
