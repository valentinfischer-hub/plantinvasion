-- Plantinvasion - Migration 0002: Switch from collector cultivars to generic plants
-- Reason: Sprite-Generation-Modell (PixelLab) kann spezifische Cultivare nicht erkennbar erzeugen.
-- Wir tauschen die 5 Sammler-Cultivare gegen 5 generische Pflanzen die das Modell perfekt kann.

-- Alte Cultivar-Spezies entfernen (sicher: aelter als 1 Tag und kein Spieler hat sie noch im Inventar genutzt)
delete from public.plant_species
 where slug in (
   'alocasia-black-velvet-albo',
   'monstera-bulbasaur',
   'myrtillocactus-fukurokuryu',
   'lithops',
   'pinguicula-seductora'
 );

-- Neue generische Starter-Spezies einfuegen
insert into public.plant_species (slug, scientific_name, common_name, rarity, is_starter, atk_bias, def_bias, spd_bias, description, sprite_seed_prefix)
values
  ('sunflower',     'Helianthus annuus',         'Sunflower',     2, true,   5,   5,   5, 'Klassische Sonnenblume mit grossem gelbem Bluetenkopf. Allrounder mit ausgewogenen Werten.', 'sunflower'),
  ('spike-cactus',  'Echinocactus grusonii',     'Spike Cactus',  3, true,  -5,  25, -10, 'Stachelkugel-Kaktus mit Defensiv-Spezialisierung. Hoher DEF, niedrige Speed.',           'spike_cactus'),
  ('venus-flytrap', 'Dionaea muscipula',          'Venus Flytrap', 4, true,  20, -10,   5, 'Karnivore Pflanze mit Schnappfallen. Glass-Cannon mit hohem ATK.',                       'venus_flytrap'),
  ('lavender',      'Lavandula angustifolia',     'Lavender',      2, true, -10,  -5,  20, 'Aromatische Heilpflanze mit hoher Speed. Hit-and-Run-Angreifer.',                        'lavender'),
  ('tomato-plant',  'Solanum lycopersicum',       'Tomato Plant',  2, true,   0,  15,   0, 'Robuste Nutzpflanze mit roten Fruechten. Support-Pflanze, Heilung in V2.',               'tomato_plant')
on conflict (slug) do update set
  scientific_name = excluded.scientific_name,
  common_name     = excluded.common_name,
  rarity          = excluded.rarity,
  description     = excluded.description,
  atk_bias        = excluded.atk_bias,
  def_bias        = excluded.def_bias,
  spd_bias        = excluded.spd_bias;
