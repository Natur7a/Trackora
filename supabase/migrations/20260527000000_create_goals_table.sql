create table if not exists public.goals (
  id bigint generated always as identity primary key,

  user_id uuid references auth.users(id)
  on delete cascade,

  title text not null,

  target numeric not null,

  deadline date not null,

  created_at timestamptz default now()
);

alter table public.goals
enable row level security;

create policy "Users can view own goals"
on public.goals
for select
using (auth.uid() = user_id);

create policy "Users can insert own goals"
on public.goals
for insert
with check (auth.uid() = user_id);

create policy "Users can delete own goals"
on public.goals
for delete
using (auth.uid() = user_id);