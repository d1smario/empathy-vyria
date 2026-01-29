-- =====================================================
-- FIX: Update handle_new_user trigger to include role
-- =====================================================
-- This script fixes the issue where users created with role="coach" 
-- were getting role="athlete" in the users table because the trigger
-- wasn't reading the role from raw_user_meta_data

-- 1. Update the trigger function to include role
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'athlete')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix existing users whose role doesn't match their auth metadata
-- This updates users who registered as coach but have role='athlete' in the users table
UPDATE public.users u
SET role = (
  SELECT COALESCE(raw_user_meta_data->>'role', 'athlete')
  FROM auth.users au
  WHERE au.id = u.id
)
WHERE u.role = 'athlete'
AND EXISTS (
  SELECT 1 FROM auth.users au
  WHERE au.id = u.id
  AND au.raw_user_meta_data->>'role' = 'coach'
);

-- 3. Verify the fix worked
-- SELECT u.id, u.email, u.role as users_role, au.raw_user_meta_data->>'role' as metadata_role
-- FROM public.users u
-- JOIN auth.users au ON u.id = au.id
-- WHERE u.role != COALESCE(au.raw_user_meta_data->>'role', 'athlete');
