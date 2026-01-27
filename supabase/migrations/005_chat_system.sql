-- Enable Realtime for these tables
alter publication supabase_realtime add table messages;

-- 1. Conversations Table
create table if not exists conversations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Participants Table (Junction)
create table if not exists conversation_participants (
  conversation_id uuid references conversations(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (conversation_id, user_id)
);

-- 3. Messages Table
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references conversations(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete set null,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies

-- Enable RLS
alter table conversations enable row level security;
alter table conversation_participants enable row level security;
alter table messages enable row level security;

-- Policies for Conversations
create policy "Users can view conversations they are participating in"
  on conversations for select
  using (
    exists (
      select 1 from conversation_participants
      where conversation_participants.conversation_id = conversations.id
      and conversation_participants.user_id = auth.uid()
    )
  );

-- Policies for Participants
create policy "Users can view participants of their conversations"
  on conversation_participants for select
  using (
    exists (
      select 1 from conversation_participants cp
      where cp.conversation_id = conversation_participants.conversation_id
      and cp.user_id = auth.uid()
    )
  );

-- Policies for Messages
create policy "Users can view messages in their conversations"
  on messages for select
  using (
    exists (
      select 1 from conversation_participants
      where conversation_participants.conversation_id = messages.conversation_id
      and conversation_participants.user_id = auth.uid()
    )
  );

create policy "Users can insert messages in their conversations"
  on messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from conversation_participants
      where conversation_participants.conversation_id = conversation_id
      and conversation_participants.user_id = auth.uid()
    )
  );
