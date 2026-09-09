-- Hack4Good initial schema. Auth identities remain in auth.users.
create extension if not exists pgcrypto;

create type public.user_role as enum ('PARTICIPANT', 'ORGANIZER', 'JUDGE', 'ADMIN');
create type public.hackathon_status as enum ('DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED');
create type public.problem_status as enum ('OPEN', 'SELECTED', 'IN_PROGRESS', 'SOLVED', 'CLOSED');
create type public.project_status as enum ('DRAFT', 'SUBMITTED');
create type public.invitation_status as enum ('PENDING', 'ACCEPTED', 'REJECTED');
create type public.impact_status as enum ('PLANNED', 'IN_PROGRESS', 'IMPLEMENTED', 'DISCONTINUED');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (length(btrim(full_name)) > 0),
  role public.user_role not null default 'PARTICIPANT',
  bio text,
  skills text[] not null default '{}',
  location text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hackathons (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) > 0),
  description text not null check (length(btrim(description)) > 0),
  theme text,
  rules text,
  location text,
  registration_deadline timestamptz not null,
  start_date timestamptz not null,
  end_date timestamptz not null,
  max_team_size integer not null check (max_team_size between 1 and 10),
  status public.hackathon_status not null default 'DRAFT',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (registration_deadline <= start_date and start_date < end_date)
);

create table public.problems (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) > 0),
  description text not null check (length(btrim(description)) > 0),
  category text,
  location text,
  expected_impact text,
  image_url text,
  status public.problem_status not null default 'OPEN',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hackathon_problems (
  hackathon_id uuid not null references public.hackathons(id) on delete cascade,
  problem_id uuid not null references public.problems(id) on delete cascade,
  primary key (hackathon_id, problem_id)
);

create table public.hackathon_registrations (
  id uuid primary key default gen_random_uuid(),
  hackathon_id uuid not null references public.hackathons(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (hackathon_id, user_id)
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  hackathon_id uuid not null references public.hackathons(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 100),
  description text,
  leader_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hackathon_id, name)
);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (team_id, user_id)
);

create table public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.invitation_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  unique (team_id, user_id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  problem_id uuid not null references public.problems(id) on delete restrict,
  title text not null check (length(btrim(title)) > 0),
  description text not null check (length(btrim(description)) > 0),
  technologies text[] not null default '{}',
  impact text,
  github_url text,
  demo_url text,
  status public.project_status not null default 'DRAFT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, problem_id)
);

create table public.project_submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  document_url text
);

create table public.evaluation_criteria (
  id uuid primary key default gen_random_uuid(),
  hackathon_id uuid not null references public.hackathons(id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  max_score numeric(10,2) not null check (max_score > 0),
  weight numeric(10,4) not null check (weight > 0),
  unique (hackathon_id, name)
);

-- Required by the documented judge-assignment API; no equivalent table was listed in the source schema.
create table public.hackathon_judges (
  hackathon_id uuid not null references public.hackathons(id) on delete cascade,
  judge_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (hackathon_id, judge_id)
);

create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  judge_id uuid not null references public.profiles(id) on delete restrict,
  feedback text,
  total_score numeric(12,2) not null default 0 check (total_score >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, judge_id)
);

create table public.evaluation_scores (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.evaluations(id) on delete cascade,
  criterion_id uuid not null references public.evaluation_criteria(id) on delete restrict,
  score numeric(10,2) not null check (score >= 0),
  unique (evaluation_id, criterion_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  problem_id uuid not null references public.problems(id) on delete cascade,
  content text not null check (length(btrim(content)) > 0),
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (length(btrim(type)) > 0),
  message text not null check (length(btrim(message)) > 0),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.impact_records (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  status public.impact_status not null default 'PLANNED',
  people_benefited integer check (people_benefited is null or people_benefited >= 0),
  metric_name text,
  metric_value numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index hackathons_status_idx on public.hackathons(status);
create index hackathons_created_by_idx on public.hackathons(created_by);
create index problems_status_idx on public.problems(status);
create index problems_created_by_idx on public.problems(created_by);
create index registrations_user_idx on public.hackathon_registrations(user_id);
create index teams_hackathon_idx on public.teams(hackathon_id);
create index team_members_user_idx on public.team_members(user_id);
create index invitations_user_status_idx on public.team_invitations(user_id, status);
create index projects_team_idx on public.projects(team_id);
create index projects_problem_idx on public.projects(problem_id);
create index criteria_hackathon_idx on public.evaluation_criteria(hackathon_id);
create index evaluations_project_idx on public.evaluations(project_id);
create index evaluations_judge_idx on public.evaluations(judge_id);
create index comments_problem_idx on public.comments(problem_id);
create index notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index impact_records_project_idx on public.impact_records(project_id);

create function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

create function public.current_role()
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role() = 'ADMIN', false)
$$;

create function public.is_participant()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role() = 'PARTICIPANT', false)
$$;

create function public.is_hackathon_manager(target_hackathon_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.hackathons where id = target_hackathon_id and created_by = auth.uid()
  )
$$;

create function public.is_team_member(target_team_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.team_members where team_id = target_team_id and user_id = auth.uid())
$$;

create function public.is_team_leader(target_team_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.teams where id = target_team_id and leader_id = auth.uid())
$$;

create function public.is_assigned_judge(target_hackathon_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.hackathon_judges where hackathon_id = target_hackathon_id and judge_id = auth.uid()
  )
$$;

create function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only an administrator can change a user role';
  end if;
  return new;
end; $$;

create function public.validate_team()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles where id = new.leader_id and role = 'PARTICIPANT') then
    raise exception 'A team leader must be a participant';
  end if;
  if not exists (select 1 from public.hackathon_registrations where hackathon_id = new.hackathon_id and user_id = new.leader_id) then
    raise exception 'A team leader must be registered for the hackathon';
  end if;
  return new;
end; $$;

create function public.validate_team_member()
returns trigger language plpgsql security definer set search_path = public as $$
declare target_hackathon uuid; max_size integer;
begin
  select hackathon_id into target_hackathon from public.teams where id = new.team_id;
  if target_hackathon is null then raise exception 'Team does not exist'; end if;
  if not exists (select 1 from public.profiles where id = new.user_id and role = 'PARTICIPANT') then
    raise exception 'Only participants can join teams';
  end if;
  if not exists (select 1 from public.hackathon_registrations where hackathon_id = target_hackathon and user_id = new.user_id) then
    raise exception 'A team member must be registered for the hackathon';
  end if;
  if exists (
    select 1 from public.team_members member join public.teams team on team.id = member.team_id
    where member.user_id = new.user_id and team.hackathon_id = target_hackathon and member.team_id <> new.team_id
  ) then raise exception 'A participant can belong to only one team per hackathon'; end if;
  select max_team_size into max_size from public.hackathons where id = target_hackathon;
  if tg_op = 'INSERT' and (select count(*) from public.team_members where team_id = new.team_id) >= max_size then
    raise exception 'Team size cannot exceed the hackathon maximum';
  end if;
  return new;
end; $$;

create function public.validate_project_problem()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.teams team join public.hackathon_problems hp on hp.hackathon_id = team.hackathon_id
    where team.id = new.team_id and hp.problem_id = new.problem_id
  ) then raise exception 'The project problem must belong to the team hackathon'; end if;
  return new;
end; $$;

create function public.validate_submission()
returns trigger language plpgsql security definer set search_path = public as $$
declare target_hackathon uuid; deadline timestamptz; submitted_status public.project_status;
begin
  select team.hackathon_id, hackathon.end_date, project.status into target_hackathon, deadline, submitted_status
  from public.projects project join public.teams team on team.id = project.team_id
  join public.hackathons hackathon on hackathon.id = team.hackathon_id where project.id = new.project_id;
  if submitted_status <> 'SUBMITTED' then raise exception 'Only submitted projects can have a submission record'; end if;
  if now() > deadline then raise exception 'Submission deadline has passed'; end if;
  if not exists (select 1 from public.team_members where team_id = (select team_id from public.projects where id = new.project_id)) then
    raise exception 'A project team must have members';
  end if;
  return new;
end; $$;

create function public.validate_evaluation()
returns trigger language plpgsql security definer set search_path = public as $$
declare target_hackathon uuid; project_team uuid; submitted_status public.project_status;
begin
  select team.hackathon_id, project.team_id, project.status into target_hackathon, project_team, submitted_status
  from public.projects project join public.teams team on team.id = project.team_id where project.id = new.project_id;
  if submitted_status <> 'SUBMITTED' then raise exception 'Only submitted projects can be evaluated'; end if;
  if not exists (select 1 from public.hackathon_judges where hackathon_id = target_hackathon and judge_id = new.judge_id) then
    raise exception 'Judge is not assigned to this hackathon';
  end if;
  if exists (select 1 from public.team_members where team_id = project_team and user_id = new.judge_id) then
    raise exception 'A judge cannot evaluate a project from their own team';
  end if;
  return new;
end; $$;

create function public.validate_score()
returns trigger language plpgsql security definer set search_path = public as $$
declare max_allowed numeric; criterion_hackathon uuid; project_hackathon uuid;
begin
  select criterion.max_score, criterion.hackathon_id into max_allowed, criterion_hackathon
  from public.evaluation_criteria criterion where criterion.id = new.criterion_id;
  select team.hackathon_id into project_hackathon from public.evaluations evaluation
  join public.projects project on project.id = evaluation.project_id join public.teams team on team.id = project.team_id
  where evaluation.id = new.evaluation_id;
  if criterion_hackathon is distinct from project_hackathon then raise exception 'Criterion is not for this project hackathon'; end if;
  if new.score > max_allowed then raise exception 'Score exceeds the criterion maximum'; end if;
  return new;
end; $$;

create function public.recalculate_evaluation_total()
returns trigger language plpgsql security definer set search_path = public as $$
declare target_evaluation uuid;
begin
  target_evaluation := coalesce(new.evaluation_id, old.evaluation_id);
  update public.evaluations evaluation set total_score = coalesce((
    select sum(score.score * criterion.weight) from public.evaluation_scores score
    join public.evaluation_criteria criterion on criterion.id = score.criterion_id
    where score.evaluation_id = target_evaluation
  ), 0) where evaluation.id = target_evaluation;
  return null;
end; $$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger profiles_protect_role before update on public.profiles for each row execute function public.protect_profile_role();
create trigger hackathons_updated_at before update on public.hackathons for each row execute function public.set_updated_at();
create trigger problems_updated_at before update on public.problems for each row execute function public.set_updated_at();
create trigger teams_validate before insert or update on public.teams for each row execute function public.validate_team();
create trigger teams_updated_at before update on public.teams for each row execute function public.set_updated_at();
create trigger team_members_validate before insert or update on public.team_members for each row execute function public.validate_team_member();
create trigger projects_validate before insert or update on public.projects for each row execute function public.validate_project_problem();
create trigger projects_updated_at before update on public.projects for each row execute function public.set_updated_at();
create trigger submissions_validate before insert on public.project_submissions for each row execute function public.validate_submission();
create trigger evaluations_validate before insert or update on public.evaluations for each row execute function public.validate_evaluation();
create trigger evaluations_updated_at before update on public.evaluations for each row execute function public.set_updated_at();
create trigger scores_validate before insert or update on public.evaluation_scores for each row execute function public.validate_score();
create trigger scores_recalculate after insert or update or delete on public.evaluation_scores for each row execute function public.recalculate_evaluation_total();
create trigger impacts_updated_at before update on public.impact_records for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.hackathons enable row level security;
alter table public.problems enable row level security;
alter table public.hackathon_problems enable row level security;
alter table public.hackathon_registrations enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_invitations enable row level security;
alter table public.projects enable row level security;
alter table public.project_submissions enable row level security;
alter table public.evaluation_criteria enable row level security;
alter table public.hackathon_judges enable row level security;
alter table public.evaluations enable row level security;
alter table public.evaluation_scores enable row level security;
alter table public.comments enable row level security;
alter table public.notifications enable row level security;
alter table public.impact_records enable row level security;

create policy "public profiles are readable" on public.profiles for select using (true);
create policy "users create own participant profile" on public.profiles for insert to authenticated with check (id = auth.uid() and role = 'PARTICIPANT');
create policy "users update own profile or admin" on public.profiles for update to authenticated using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
create policy "admins delete profiles" on public.profiles for delete to authenticated using (public.is_admin());

create policy "published hackathons are readable" on public.hackathons for select using (status = 'PUBLISHED' or created_by = auth.uid() or public.is_admin());
create policy "managers create hackathons" on public.hackathons for insert to authenticated with check (created_by = auth.uid() and (public.current_role() in ('ORGANIZER', 'ADMIN')));
create policy "managers update hackathons" on public.hackathons for update to authenticated using (public.is_hackathon_manager(id)) with check (public.is_hackathon_manager(id));
create policy "managers delete hackathons" on public.hackathons for delete to authenticated using (public.is_hackathon_manager(id));

create policy "problems are publicly readable" on public.problems for select using (true);
create policy "participants submit problems" on public.problems for insert to authenticated with check (created_by = auth.uid() and (public.is_participant() or public.is_admin()));
create policy "owners and admins update problems" on public.problems for update to authenticated using (created_by = auth.uid() or public.is_admin()) with check (created_by = auth.uid() or public.is_admin());
create policy "owners and admins delete problems" on public.problems for delete to authenticated using (created_by = auth.uid() or public.is_admin());

create policy "linked public content is readable" on public.hackathon_problems for select using (true);
create policy "hackathon managers link problems" on public.hackathon_problems for insert to authenticated with check (public.is_hackathon_manager(hackathon_id));
create policy "hackathon managers unlink problems" on public.hackathon_problems for delete to authenticated using (public.is_hackathon_manager(hackathon_id));

create policy "registrations visible to user or manager" on public.hackathon_registrations for select to authenticated using (user_id = auth.uid() or public.is_hackathon_manager(hackathon_id) or public.is_admin());
create policy "participants register themselves" on public.hackathon_registrations for insert to authenticated with check (user_id = auth.uid() and (public.is_participant() or public.is_admin()));
create policy "users or managers remove registrations" on public.hackathon_registrations for delete to authenticated using (user_id = auth.uid() or public.is_hackathon_manager(hackathon_id) or public.is_admin());

create policy "teams are readable" on public.teams for select using (true);
create policy "participants create teams" on public.teams for insert to authenticated with check (leader_id = auth.uid() and public.is_participant());
create policy "leaders and managers update teams" on public.teams for update to authenticated using (public.is_team_leader(id) or public.is_hackathon_manager(hackathon_id)) with check (public.is_team_leader(id) or public.is_hackathon_manager(hackathon_id));
create policy "leaders and managers delete teams" on public.teams for delete to authenticated using (public.is_team_leader(id) or public.is_hackathon_manager(hackathon_id));

create policy "team members are readable" on public.team_members for select using (true);
create policy "leaders add self or accepted invitees" on public.team_members for insert to authenticated with check (
  (user_id = auth.uid() and (public.is_team_leader(team_id) or exists (select 1 from public.team_invitations where team_id = team_members.team_id and user_id = auth.uid() and status = 'ACCEPTED')))
  or public.is_admin()
);
create policy "leaders remove members" on public.team_members for delete to authenticated using (public.is_team_leader(team_id) or user_id = auth.uid() or public.is_admin());

create policy "invitations visible to recipient or leader" on public.team_invitations for select to authenticated using (user_id = auth.uid() or public.is_team_leader(team_id) or public.is_admin());
create policy "leaders create invitations" on public.team_invitations for insert to authenticated with check (public.is_team_leader(team_id) or public.is_admin());
create policy "recipients respond to invitations" on public.team_invitations for update to authenticated using (user_id = auth.uid() or public.is_team_leader(team_id) or public.is_admin()) with check (user_id = auth.uid() or public.is_team_leader(team_id) or public.is_admin());
create policy "leaders delete invitations" on public.team_invitations for delete to authenticated using (public.is_team_leader(team_id) or public.is_admin());

create policy "submitted projects are readable" on public.projects for select using (status = 'SUBMITTED' or public.is_team_member(team_id) or public.is_hackathon_manager((select hackathon_id from public.teams where id = team_id)) or public.is_admin());
create policy "team members create projects" on public.projects for insert to authenticated with check (public.is_team_member(team_id) or public.is_admin());
create policy "team members manage draft projects" on public.projects for update to authenticated using ((public.is_team_member(team_id) and status = 'DRAFT') or public.is_admin()) with check (public.is_team_member(team_id) or public.is_admin());
create policy "team members delete draft projects" on public.projects for delete to authenticated using ((public.is_team_member(team_id) and status = 'DRAFT') or public.is_admin());

create policy "submissions visible to team managers judges" on public.project_submissions for select to authenticated using (public.is_team_member((select team_id from public.projects where id = project_id)) or public.is_hackathon_manager((select team.hackathon_id from public.projects project join public.teams team on team.id = project.team_id where project.id = project_id)) or public.is_assigned_judge((select team.hackathon_id from public.projects project join public.teams team on team.id = project.team_id where project.id = project_id)) or public.is_admin());
create policy "team members submit projects" on public.project_submissions for insert to authenticated with check (public.is_team_member((select team_id from public.projects where id = project_id)) or public.is_admin());

create policy "criteria are readable" on public.evaluation_criteria for select using (true);
create policy "managers create criteria" on public.evaluation_criteria for insert to authenticated with check (public.is_hackathon_manager(hackathon_id));
create policy "managers update criteria" on public.evaluation_criteria for update to authenticated using (public.is_hackathon_manager(hackathon_id)) with check (public.is_hackathon_manager(hackathon_id));
create policy "managers delete criteria" on public.evaluation_criteria for delete to authenticated using (public.is_hackathon_manager(hackathon_id));

create policy "judges see own assignments" on public.hackathon_judges for select to authenticated using (judge_id = auth.uid() or public.is_hackathon_manager(hackathon_id) or public.is_admin());
create policy "managers assign judges" on public.hackathon_judges for insert to authenticated with check (public.is_hackathon_manager(hackathon_id));
create policy "managers unassign judges" on public.hackathon_judges for delete to authenticated using (public.is_hackathon_manager(hackathon_id));

create policy "submitted evaluations are readable" on public.evaluations for select to authenticated using (public.is_assigned_judge((select team.hackathon_id from public.projects project join public.teams team on team.id = project.team_id where project.id = project_id)) or public.is_team_member((select team_id from public.projects where id = project_id)) or public.is_hackathon_manager((select team.hackathon_id from public.projects project join public.teams team on team.id = project.team_id where project.id = project_id)) or public.is_admin());
create policy "assigned judges create evaluations" on public.evaluations for insert to authenticated with check (judge_id = auth.uid() or public.is_admin());
create policy "judges update own evaluations" on public.evaluations for update to authenticated using (judge_id = auth.uid() or public.is_admin()) with check (judge_id = auth.uid() or public.is_admin());
create policy "judges delete own evaluations" on public.evaluations for delete to authenticated using (judge_id = auth.uid() or public.is_admin());

create policy "evaluation scores follow evaluation access" on public.evaluation_scores for select to authenticated using (exists (select 1 from public.evaluations where id = evaluation_id and (judge_id = auth.uid() or public.is_admin())));
create policy "judges create scores" on public.evaluation_scores for insert to authenticated with check (exists (select 1 from public.evaluations where id = evaluation_id and (judge_id = auth.uid() or public.is_admin())));
create policy "judges update scores" on public.evaluation_scores for update to authenticated using (exists (select 1 from public.evaluations where id = evaluation_id and (judge_id = auth.uid() or public.is_admin())) ) with check (exists (select 1 from public.evaluations where id = evaluation_id and (judge_id = auth.uid() or public.is_admin())));
create policy "judges delete scores" on public.evaluation_scores for delete to authenticated using (exists (select 1 from public.evaluations where id = evaluation_id and (judge_id = auth.uid() or public.is_admin())));

create policy "comments are readable" on public.comments for select using (true);
create policy "authenticated users create comments" on public.comments for insert to authenticated with check (user_id = auth.uid());
create policy "authors and admins delete comments" on public.comments for delete to authenticated using (user_id = auth.uid() or public.is_admin());

create policy "users see own notifications" on public.notifications for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "users update own notifications" on public.notifications for update to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "users delete own notifications" on public.notifications for delete to authenticated using (user_id = auth.uid() or public.is_admin());

create policy "impact records are readable" on public.impact_records for select using (true);
create policy "team members create impact" on public.impact_records for insert to authenticated with check (public.is_team_member((select team_id from public.projects where id = project_id)) or public.is_admin());
create policy "team members update impact" on public.impact_records for update to authenticated using (public.is_team_member((select team_id from public.projects where id = project_id)) or public.is_admin()) with check (public.is_team_member((select team_id from public.projects where id = project_id)) or public.is_admin());
create policy "team members delete impact" on public.impact_records for delete to authenticated using (public.is_team_member((select team_id from public.projects where id = project_id)) or public.is_admin());

revoke all on function public.current_role() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.is_participant() from public;
revoke all on function public.is_hackathon_manager(uuid) from public;
revoke all on function public.is_team_member(uuid) from public;
revoke all on function public.is_team_leader(uuid) from public;
revoke all on function public.is_assigned_judge(uuid) from public;
grant execute on function public.current_role(), public.is_admin(), public.is_participant(), public.is_hackathon_manager(uuid), public.is_team_member(uuid), public.is_team_leader(uuid), public.is_assigned_judge(uuid) to authenticated;
