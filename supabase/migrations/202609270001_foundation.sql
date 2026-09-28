-- ShiftOS, sprint 1. Run against a fresh Supabase project.
begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 100),
  created_at timestamptz not null default now()
);

-- Global identity, intentionally not a tenant-owned record. No email/PII mirror.
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 100),
  created_at timestamptz not null default now()
);

-- Immutable global permission vocabulary. Assignments are tenant-owned.
create table public.permissions (
  key text primary key,
  description text not null
);
insert into public.permissions (key, description) values
  ('organizations.manage', 'Edit organization'), ('access.read', 'Read organization memberships'),
  ('restaurants.read', 'Read restaurants'), ('restaurants.write', 'Manage restaurants'),
  ('employees.read', 'Read employee directory'), ('employees.write', 'Manage employees'),
  ('menu.read', 'Read menu'), ('menu.write', 'Manage menu'),
  ('training.read', 'Read training'), ('training.write', 'Manage training'),
  ('tasks.read', 'Read tasks'), ('tasks.write', 'Manage tasks'),
  ('checklists.read', 'Read checklists'), ('checklists.write', 'Manage checklists'),
  ('storage.read', 'Read private attachments'), ('storage.write', 'Manage private attachments'),
  ('ai.use', 'Request AI assistance');

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  key text not null check (key in ('owner', 'manager', 'staff')),
  unique (organization_id, id), unique (organization_id, key)
);
create table public.role_permissions (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role_id uuid not null,
  permission_key text not null references public.permissions(key),
  primary key (organization_id, role_id, permission_key),
  foreign key (organization_id, role_id) references public.roles(organization_id, id) on delete cascade
);
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role_id uuid not null,
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  unique (organization_id, id), unique (organization_id, user_id),
  foreign key (organization_id, role_id) references public.roles(organization_id, id)
);
create index memberships_user_lookup on public.memberships(user_id, organization_id) where status = 'active';

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 100),
  timezone text not null default 'Europe/Moscow',
  address text not null default '',
  created_at timestamptz not null default now(),
  unique (organization_id, id)
);
create table public.employees (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  restaurant_id uuid not null,
  user_id uuid,
  full_name text not null check (char_length(trim(full_name)) between 1 and 150),
  position text not null default '',
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  unique (organization_id, id), unique (organization_id, user_id),
  foreign key (organization_id, restaurant_id) references public.restaurants(organization_id, id),
  foreign key (organization_id, user_id) references public.memberships(organization_id, user_id)
);
create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  sort_order integer not null default 0,
  unique (organization_id, id)
);
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category_id uuid not null,
  name text not null check (char_length(trim(name)) between 1 and 150),
  description text not null default '',
  price numeric(12,2) not null default 0 check (price >= 0),
  currency text not null default 'RUB' check (currency ~ '^[A-Z]{3}$'),
  allergens text[] not null default '{}',
  available boolean not null default true,
  unique (organization_id, id),
  foreign key (organization_id, category_id) references public.menu_categories(organization_id, id)
);
create table public.training (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 200),
  content text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  unique (organization_id, id)
);
create table public.tests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  training_id uuid not null,
  title text not null check (char_length(trim(title)) between 1 and 200),
  passing_score integer not null default 80 check (passing_score between 0 and 100),
  unique (organization_id, id),
  foreign key (organization_id, training_id) references public.training(organization_id, id) on delete cascade
);
create table public.test_questions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  test_id uuid not null,
  prompt text not null,
  options jsonb not null default '[]' check (jsonb_typeof(options) = 'array'),
  sort_order integer not null default 0,
  unique (organization_id, id),
  foreign key (organization_id, test_id) references public.tests(organization_id, id) on delete cascade
);
-- Answer keys never enter the public Data API. A future grading service owns writes.
create table private.test_answer_keys (
  organization_id uuid not null,
  question_id uuid not null,
  answer jsonb not null,
  primary key (organization_id, question_id),
  foreign key (organization_id, question_id) references public.test_questions(organization_id, id) on delete cascade
);
revoke all on private.test_answer_keys from public, anon, authenticated;

create table public.training_progress (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  training_id uuid not null,
  employee_id uuid not null,
  completed_at timestamptz,
  unique (organization_id, id), unique (organization_id, training_id, employee_id),
  foreign key (organization_id, training_id) references public.training(organization_id, id) on delete cascade,
  foreign key (organization_id, employee_id) references public.employees(organization_id, id)
);
create table public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  test_id uuid not null,
  employee_id uuid not null,
  score integer check (score between 0 and 100),
  submitted_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, test_id) references public.tests(organization_id, id),
  foreign key (organization_id, employee_id) references public.employees(organization_id, id)
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  restaurant_id uuid not null,
  assignee_id uuid,
  title text not null check (char_length(trim(title)) between 1 and 200),
  description text not null default '',
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'normal' check (priority in ('normal', 'high')),
  due_at timestamptz,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, restaurant_id) references public.restaurants(organization_id, id),
  foreign key (organization_id, assignee_id) references public.employees(organization_id, id),
  foreign key (organization_id, created_by) references public.memberships(organization_id, user_id)
);
create index tasks_restaurant_status on public.tasks(organization_id, restaurant_id, status, due_at);
create table public.checklists (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  restaurant_id uuid not null,
  title text not null check (char_length(trim(title)) between 1 and 200),
  kind text not null default 'custom' check (kind in ('opening', 'closing', 'custom')),
  unique (organization_id, id),
  foreign key (organization_id, restaurant_id) references public.restaurants(organization_id, id)
);
create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  checklist_id uuid not null,
  title text not null,
  sort_order integer not null default 0,
  unique (organization_id, id), unique (organization_id, checklist_id, id),
  foreign key (organization_id, checklist_id) references public.checklists(organization_id, id) on delete cascade
);
create table public.checklist_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  checklist_id uuid not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (organization_id, id), unique (organization_id, checklist_id, id),
  foreign key (organization_id, checklist_id) references public.checklists(organization_id, id)
);
create table public.checklist_run_items (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  checklist_id uuid not null,
  run_id uuid not null,
  item_id uuid not null,
  completed_at timestamptz,
  primary key (organization_id, run_id, item_id),
  foreign key (organization_id, checklist_id, run_id) references public.checklist_runs(organization_id, checklist_id, id) on delete cascade,
  foreign key (organization_id, checklist_id, item_id) references public.checklist_items(organization_id, checklist_id, id)
);

-- Helpers have a fixed search_path, derive identity from auth.uid(), and avoid RLS recursion.
create function private.is_member(org_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.memberships m
    where m.organization_id = org_id and m.user_id = (select auth.uid()) and m.status = 'active');
$$;
create function public.has_permission(org_id uuid, permission text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.memberships m
    join public.role_permissions rp on rp.organization_id = m.organization_id and rp.role_id = m.role_id
    where m.organization_id = org_id and m.user_id = (select auth.uid()) and m.status = 'active'
      and rp.permission_key = permission);
$$;
revoke all on function private.is_member(uuid), public.has_permission(uuid, text) from public, anon;
grant execute on function private.is_member(uuid), public.has_permission(uuid, text) to authenticated;

create function private.prevent_tenant_move() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.organization_id is distinct from old.organization_id then
    raise exception 'organization_id is immutable' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function private.prevent_tenant_move() from public, anon, authenticated;

-- Explicit privileges: no public/anonymous data, no client role-management DML.
do $$
declare t text;
begin
  foreach t in array array['organizations','users','permissions','roles','role_permissions','memberships',
    'restaurants','employees','menu_categories','menu_items','training','tests','test_questions',
    'training_progress','test_attempts','tasks','checklists','checklist_items','checklist_runs','checklist_run_items'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
    if t not in ('organizations','users','permissions') then
      execute format('create trigger prevent_tenant_move before update on public.%I for each row execute function private.prevent_tenant_move()', t);
    end if;
  end loop;
end $$;

create policy organization_read on public.organizations for select to authenticated using (private.is_member(id));
grant update (name) on public.organizations to authenticated;
create policy organization_update on public.organizations for update to authenticated
  using (public.has_permission(id, 'organizations.manage')) with check (public.has_permission(id, 'organizations.manage'));
create policy user_self_read on public.users for select to authenticated using (id = (select auth.uid()));
grant update (display_name) on public.users to authenticated;
create policy user_self_update on public.users for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy permissions_read on public.permissions for select to authenticated using (true);
create policy role_read on public.roles for select to authenticated using (private.is_member(organization_id));
create policy role_permission_read on public.role_permissions for select to authenticated using (private.is_member(organization_id));
create policy membership_read on public.memberships for select to authenticated
  using (user_id = (select auth.uid()) or public.has_permission(organization_id, 'access.read'));

do $$
declare item record;
begin
  for item in select * from (values
    ('restaurants','restaurants'), ('employees','employees'), ('menu_categories','menu'), ('menu_items','menu'),
    ('training','training'), ('tests','training'), ('test_questions','training'),
    ('tasks','tasks'), ('checklists','checklists'), ('checklist_items','checklists'),
    ('checklist_runs','checklists'), ('checklist_run_items','checklists')
  ) as pairs(tbl, module) loop
    execute format('grant insert, update, delete on public.%I to authenticated', item.tbl);
    execute format('create policy tenant_read on public.%I for select to authenticated using (public.has_permission(organization_id, %L))', item.tbl, item.module || '.read');
    execute format('create policy tenant_insert on public.%I for insert to authenticated with check (public.has_permission(organization_id, %L))', item.tbl, item.module || '.write');
    execute format('create policy tenant_update on public.%I for update to authenticated using (public.has_permission(organization_id, %L)) with check (public.has_permission(organization_id, %L))', item.tbl, item.module || '.write', item.module || '.write');
    execute format('create policy tenant_delete on public.%I for delete to authenticated using (public.has_permission(organization_id, %L))', item.tbl, item.module || '.write');
  end loop;
end $$;

-- Task authorship is set at insert and cannot be forged or changed through the Data API.
create policy task_author_insert on public.tasks as restrictive for insert to authenticated
  with check (created_by = (select auth.uid()));
revoke update on public.tasks from authenticated;
grant update (title, description, status, priority, due_at, assignee_id, restaurant_id) on public.tasks to authenticated;

-- Progress/results are server-written in a later sprint. Staff cannot award their own scores.
create policy progress_read on public.training_progress for select to authenticated
  using (public.has_permission(organization_id, 'training.write'));
create policy attempts_read on public.test_attempts for select to authenticated
  using (public.has_permission(organization_id, 'training.write'));

create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.users(id, display_name) values (new.id, left(coalesce(new.raw_user_meta_data->>'display_name', ''), 100));
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();
insert into public.users(id) select id from auth.users on conflict do nothing;

-- Atomic onboarding: identity and owner membership are derived on the database side.
-- Existing organizations, roles and memberships cannot be supplied by a caller.
create function public.create_organization(organization_name text, restaurant_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare org uuid; owner_role uuid; manager_role uuid; staff_role uuid; caller uuid := auth.uid();
begin
  if caller is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if char_length(trim(organization_name)) not between 2 and 100 or char_length(trim(restaurant_name)) not between 2 and 100 then
    raise exception 'Names must be 2-100 characters' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(caller::text, 0));
  if (select count(*) from public.memberships where user_id = caller) >= 10 then
    raise exception 'Organization limit reached' using errcode = '54000';
  end if;
  insert into public.organizations(name) values (trim(organization_name)) returning id into org;
  insert into public.roles(organization_id, key, name) values (org, 'owner', 'Владелец') returning id into owner_role;
  insert into public.roles(organization_id, key, name) values (org, 'manager', 'Управляющий') returning id into manager_role;
  insert into public.roles(organization_id, key, name) values (org, 'staff', 'Сотрудник') returning id into staff_role;
  insert into public.role_permissions select org, owner_role, key from public.permissions;
  insert into public.role_permissions select org, manager_role, key from public.permissions where key <> 'organizations.manage';
  insert into public.role_permissions select org, staff_role, key from public.permissions
    where key in ('restaurants.read','menu.read','training.read','tasks.read','checklists.read');
  insert into public.memberships(organization_id, user_id, role_id) values (org, caller, owner_role);
  insert into public.restaurants(organization_id, name) values (org, trim(restaurant_name));
  return org;
end;
$$;
revoke all on function public.create_organization(text, text) from public, anon;
grant execute on function public.create_organization(text, text) to authenticated;

commit;
