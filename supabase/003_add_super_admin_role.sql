--/supabase/003_add_super_admin_role.sql

-- Run this by itself, as its own query execution. A newly added enum
-- value can't be referenced in the same transaction that adds it, so
-- migration 004 (which uses 'super_admin') must run separately, after
-- this one has committed.

alter type public.orion_role add value if not exists 'super_admin';