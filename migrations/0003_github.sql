alter table media add column if not exists public_url text;
alter table media add column if not exists github_path text;
alter table media alter column data drop not null;

create table if not exists workshop_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);
