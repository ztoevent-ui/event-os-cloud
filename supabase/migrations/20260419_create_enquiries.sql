create table public.public_enquiries (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    contact_name text not null,
    company_name text not null,
    email text not null,
    phone text not null,
    event_category text not null,
    notes text,
    status text default 'new'::text not null
);

-- Enable RLS
alter table public.public_enquiries enable row level security;

-- Only authenticated users (admins/staff) can view
create policy "Authenticated users can view enquiries"
    on public.public_enquiries for select
    to authenticated
    using (true);

-- Anyone can insert (since the Next.js API will use the service role or anon key)
create policy "Anyone can insert enquiries"
    on public.public_enquiries for insert
    to anon, authenticated
    with check (true);
