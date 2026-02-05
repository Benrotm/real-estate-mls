-- Create Avatars Bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Policy: Public Read Access
create policy "Public Access Avatars"
on storage.objects for select
using ( bucket_id = 'avatars' );

-- Policy: Authenticated Upload
create policy "Authenticated Users Upload Avatars"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'avatars' );

-- Policy: Users update own avatars
create policy "Users Update Own Avatars"
on storage.objects for update
to authenticated
using ( bucket_id = 'avatars' and auth.uid() = owner );

-- Policy: Users delete own avatars
create policy "Users Delete Own Avatars"
on storage.objects for delete
to authenticated
using ( bucket_id = 'avatars' and auth.uid() = owner );
