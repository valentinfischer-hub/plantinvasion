-- Plantinvasion - Initial Schema (V0.1)
-- Run via Supabase Dashboard -> SQL Editor -> New query -> paste -> Run

-- =========================================================
-- Extensions
-- =========================================================
create extension if not exists "uuid-ossp";

-- =========================================================
-- Plant Species (Stammarten + spaetere Mutationen)
-- =========================================================
create table if not exists public.plant_species (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  scientific_name text not null,
  common_name text,
  rarity smallint not null default 1 check (rarity between 1 and 5),
  is_starter boolean not null default false,
  is_mutation boolean not null default false,
  parent_a_species_id uuid references public.plant_species(id),
  parent_b_species_id uuid references public.plant_species(id),
  -- Stat-Bias: gewichtet die Random-Stat-Generation pro Spezies
  atk_bias smallint not null default 0,
  def_bias smallint not null default 0,
  spd_bias smallint not null default 0,
  description text,
  sprite_seed_prefix text,
  created_at timestamptz not null default now()
);
create index if not exists plant_species_slug_idx on public.plant_species(slug);

-- =========================================================
-- Users (Spielerdaten ueber Supabase Auth)
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  coins bigint not null default 0,
  gems bigint not null default 0
);

-- =========================================================
-- Plants (individuelle Pflanzen pro Spieler)
-- =========================================================
create table if not exists public.plants (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  species_id uuid not null references public.plant_species(id),
  -- Stats: Range 0-300 laut GDD
  atk smallint not null check (atk between 0 and 300),
  def smallint not null check (def between 0 and 300),
  spd smallint not null check (spd between 0 and 300),
  -- Wachstum: 0=Seed, 1=Sprout, 2=Juvenile, 3=Adult, 4=Blooming
  growth_stage smallint not null default 0 check (growth_stage between 0 and 4),
  growth_progress real not null default 0,
  -- Genetik: Seed fuer deterministische Sprite-Variation
  gene_seed bigint not null,
  parent_a_id uuid references public.plants(id),
  parent_b_id uuid references public.plants(id),
  is_mutation boolean not null default false,
  nickname text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists plants_owner_idx on public.plants(owner_id);
create index if not exists plants_species_idx on public.plants(species_id);

-- =========================================================
-- Breedings (Kreuzungs-Log)
-- =========================================================
create table if not exists public.breedings (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  parent_a_id uuid not null references public.plants(id),
  parent_b_id uuid not null references public.plants(id),
  result_plant_id uuid references public.plants(id),
  is_mutation boolean not null default false,
  -- Mutation-Roll: 0.00-1.00, < 0.08 -> Mutation laut GDD
  mutation_roll numeric(4,3) not null,
  created_at timestamptz not null default now()
);
create index if not exists breedings_owner_idx on public.breedings(owner_id);

-- =========================================================
-- Battles (Auto-Kampf-Logs)
-- =========================================================
create table if not exists public.battles (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  attacker_plant_id uuid not null references public.plants(id),
  defender_plant_id uuid references public.plants(id),
  -- defender kann NPC sein (defender_plant_id=null, defender_npc_slug gefuellt)
  defender_npc_slug text,
  winner text not null check (winner in ('attacker','defender','draw')),
  rounds smallint not null,
  rewards_coins bigint not null default 0,
  log_json jsonb,
  created_at timestamptz not null default now()
);
create index if not exists battles_owner_idx on public.battles(owner_id);

-- =========================================================
-- Row Level Security: jeder Spieler sieht nur eigene Daten
-- =========================================================
alter table public.profiles enable row level security;
alter table public.plants enable row level security;
alter table public.breedings enable row level security;
alter table public.battles enable row level security;
-- plant_species ist read-only fuer alle authentifizierten Nutzer
alter table public.plant_species enable row level security;

drop policy if exists "profiles_self_read"   on public.profiles;
drop policy if exists "profiles_self_update" on public.profiles;
drop policy if exists "plants_self_all"      on public.plants;
drop policy if exists "breedings_self_all"   on public.breedings;
drop policy if exists "battles_self_all"     on public.battles;
drop policy if exists "species_authenticated_read" on public.plant_species;

create policy "profiles_self_read"   on public.profiles for select using (auth.uid() = id);
create policy "profiles_self_update" on public.profiles for update using (auth.uid() = id);
create policy "plants_self_all"      on public.plants    for all    using (auth.uid() = owner_id);
create policy "breedings_self_all"   on public.breedings for all    using (auth.uid() = owner_id);
create policy "battles_self_all"     on public.battles   for all    using (auth.uid() = owner_id);
create policy "species_authenticated_read" on public.plant_species for select using (auth.role() = 'authenticated' or auth.role() = 'anon');

-- =========================================================
-- Auto-create profile on auth.users insert
-- =========================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name) values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================
-- Seed: V1 Start-Pflanzen (5 Spezies)
-- =========================================================
insert into public.plant_species (slug, scientific_name, common_name, rarity, is_starter, atk_bias, def_bias, spd_bias, description, sprite_seed_prefix)
values
  ('alocasia-black-velvet-albo', 'Alocasia reginula ''Black Velvet'' albo / pink variegata', 'Black Velvet Albo',     5, true, 10, 10,  0, 'Dunkelgruen-schwarzes Aroid mit pinker und weisser Variegation, samtige Blattoberflaeche.', 'aroid_alocasia_blackvelvet_albo'),
  ('monstera-bulbasaur',          'Monstera deliciosa ''Bulbasaur''',                          'Monstera Bulbasaur',    4, true,  5,  5, 10, 'Mutierte Monstera mit kompaktem, gedrungenem Wuchs, erinnert an Pokemon Bulbasaur.',         'aroid_monstera_bulbasaur'),
  ('myrtillocactus-fukurokuryu',  'Myrtillocactus geometrizans cv. Fukurokuryuzinhga',         'Bishops Cap (Monstrose)', 5, true,  0, 25, -5, 'Japanische Cultivar-Monstrose mit unregelmaessigem, knorrigem Wuchs.',                       'cactus_myrtillocactus_monstrose'),
  ('lithops',                      'Lithops spp.',                                              'Living Stones',         3, true, -5, 20, -5, 'Mesemb mit Stein-Mimikry, lebt in Suedafrikas Wuesten.',                                     'mesemb_lithops'),
  ('pinguicula-seductora',        'Pinguicula seductora',                                       'Mexican Butterwort',    4, true, 15,  0,  5, 'Karnivore mit klebrigen Blattflaechen, faengt Insekten passiv.',                              'carnivore_pinguicula_seductora')
on conflict (slug) do update set
  scientific_name = excluded.scientific_name,
  common_name     = excluded.common_name,
  rarity          = excluded.rarity,
  description     = excluded.description,
  atk_bias        = excluded.atk_bias,
  def_bias        = excluded.def_bias,
  spd_bias        = excluded.spd_bias;
