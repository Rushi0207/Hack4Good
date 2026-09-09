-- Problem votes: each authenticated user can upvote a problem once.
create table public.problem_votes (
  problem_id uuid not null references public.problems(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (problem_id, user_id)
);

create index problem_votes_problem_idx on public.problem_votes(problem_id);

alter table public.problem_votes enable row level security;

create policy "votes are publicly readable" on public.problem_votes
  for select using (true);

create policy "authenticated users vote" on public.problem_votes
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "users remove own votes" on public.problem_votes
  for delete to authenticated
  using (user_id = auth.uid());
