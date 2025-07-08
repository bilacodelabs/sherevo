-- Insert demo service provider into users table
insert into users (id, email, name, role)
values ('00000000-0000-0000-0000-000000000001', 'mckizibo@gmail.com', 'Mc Kizibo', 'service_provider')
on conflict (email) do nothing;

-- Insert into service_providers table (link to user by id)
insert into service_providers (id, user_id, type, name, contact_email, contact_phone, description)
values (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'mc', 'Mc Kizibo', 'mckizibo@gmail.com', '', 'Demo MC Service Provider')
on conflict (user_id) do nothing;

-- NOTE: You must set the password for this user via the Supabase Auth UI or API, as passwords are managed by Supabase Auth, not the public.users table. 