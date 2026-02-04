-- Create Storage Bucket for Support Attachments
insert into storage.buckets (id, name, public)
values ('support-attachments', 'support-attachments', true)
on conflict (id) do nothing;

-- Policy: Public Read Access
create policy "Public Access Support"
on storage.objects for select
using ( bucket_id = 'support-attachments' );

-- Policy: Authenticated Upload
create policy "Authenticated Users Upload Support"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'support-attachments' );

-- Policy: Users update own
create policy "Users Update Own Support"
on storage.objects for update
to authenticated
using ( bucket_id = 'support-attachments' and auth.uid() = owner );

-- Policy: Users delete own
create policy "Users Delete Own Support"
on storage.objects for delete
to authenticated
using ( bucket_id = 'support-attachments' and auth.uid() = owner );
