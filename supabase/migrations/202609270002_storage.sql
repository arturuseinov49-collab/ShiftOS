begin;
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('organization-files', 'organization-files', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

-- Invalid/unscoped object names deny access rather than throwing UUID cast errors.
create function private.storage_organization(object_name text) returns uuid
language plpgsql immutable set search_path = '' as $$
begin
  if split_part(object_name, '/', 2) = '' then return null; end if;
  return split_part(object_name, '/', 1)::uuid;
exception when invalid_text_representation then return null;
end;
$$;
revoke all on function private.storage_organization(text) from public, anon;
grant execute on function private.storage_organization(text) to authenticated;

create policy shiftos_file_read on storage.objects for select to authenticated
using (bucket_id = 'organization-files' and public.has_permission(private.storage_organization(name), 'storage.read'));
create policy shiftos_file_insert on storage.objects for insert to authenticated
with check (bucket_id = 'organization-files' and public.has_permission(private.storage_organization(name), 'storage.write'));
create policy shiftos_file_update on storage.objects for update to authenticated
using (bucket_id = 'organization-files' and public.has_permission(private.storage_organization(name), 'storage.write'))
with check (bucket_id = 'organization-files' and public.has_permission(private.storage_organization(name), 'storage.write'));
create policy shiftos_file_delete on storage.objects for delete to authenticated
using (bucket_id = 'organization-files' and public.has_permission(private.storage_organization(name), 'storage.write'));
commit;
