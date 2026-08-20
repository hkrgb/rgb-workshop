-- RGB Workshop media vault: metadata + file bytes.
-- user_id is TEXT to match Better Auth ids (and the preview 'dev-user').
create table if not exists media (
  id          text primary key,
  slug        text not null unique,
  user_id     text not null,
  filename    text not null,
  mime_type   text not null,
  kind        text not null,
  size_bytes  integer not null,
  data        bytea not null,
  created_at  timestamptz not null default now()
);

create index if not exists media_user_id_idx on media (user_id);
create index if not exists media_slug_idx on media (slug);
create index if not exists media_created_at_idx on media (created_at desc);
