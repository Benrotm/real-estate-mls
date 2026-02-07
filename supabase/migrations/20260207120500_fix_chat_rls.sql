-- Fix infinite recursion in conversation_participants policy

-- 1. Create a security definer function to check participation without RLS recursion
create or replace function public.is_conversation_participant(_conversation_id uuid)
returns boolean as $$
begin
  return exists (
    select 1
    from conversation_participants
    where conversation_id = _conversation_id
    and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- 2. Drop the old recursive policy
drop policy if exists "Users can view participants of their conversations" on conversation_participants;

-- 3. Create new policy using the function
create policy "Users can view participants of their conversations"
  on conversation_participants for select
  using (
    is_conversation_participant(conversation_id)
  );
