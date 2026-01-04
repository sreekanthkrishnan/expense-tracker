-- Admin Dashboard Schema
-- Creates profiles table, metal_rates table, and RLS policies

-- ============================================
-- PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUNCTION: Check if current user is admin
-- Uses SECURITY DEFINER to avoid RLS recursion
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;

-- RLS Policy: Users can read their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- RLS Policy: Users can update their own profile
-- Note: Role changes are prevented by trigger (see below)
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policy: Admins can read all profiles
-- Uses security definer function to avoid recursion
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id -- Own profile
    OR public.is_admin() -- Or is admin
  );

-- RLS Policy: Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- RLS Policy: Users can insert their own profile (for first-time setup)
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policy: Admins can insert any profile (for user creation)
CREATE POLICY "Admins can insert any profile"
  ON profiles FOR INSERT
  WITH CHECK (public.is_admin());

-- ============================================
-- METAL RATES TABLE (Admin-controlled rates)
-- ============================================
CREATE TABLE IF NOT EXISTS metal_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metal TEXT NOT NULL CHECK (metal IN ('gold', 'silver')),
  purity TEXT NOT NULL CHECK (purity IN ('24k', '22k', '999')),
  price_per_gram DECIMAL(12, 2) NOT NULL CHECK (price_per_gram > 0),
  date DATE NOT NULL,
  source TEXT NOT NULL DEFAULT 'admin' CHECK (source IN ('admin', 'api')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Unique constraint: one rate per metal + purity + date
  UNIQUE(metal, purity, date)
);

-- Index for efficient date queries
CREATE INDEX IF NOT EXISTS idx_metal_rates_date ON metal_rates(date DESC);
CREATE INDEX IF NOT EXISTS idx_metal_rates_metal_purity ON metal_rates(metal, purity);

-- Enable RLS on metal_rates
ALTER TABLE metal_rates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Everyone can view metal rates" ON metal_rates;
DROP POLICY IF EXISTS "Only admins can insert metal rates" ON metal_rates;
DROP POLICY IF EXISTS "Only admins can update metal rates" ON metal_rates;
DROP POLICY IF EXISTS "Only admins can delete metal rates" ON metal_rates;

-- RLS Policy: Everyone can read metal rates (users need to see rates)
CREATE POLICY "Everyone can view metal rates"
  ON metal_rates FOR SELECT
  USING (true);

-- RLS Policy: Only admins can insert metal rates
CREATE POLICY "Only admins can insert metal rates"
  ON metal_rates FOR INSERT
  WITH CHECK (public.is_admin());

-- RLS Policy: Only admins can update metal rates
CREATE POLICY "Only admins can update metal rates"
  ON metal_rates FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- RLS Policy: Only admins can delete metal rates
CREATE POLICY "Only admins can delete metal rates"
  ON metal_rates FOR DELETE
  USING (public.is_admin());

-- ============================================
-- FUNCTION: Auto-create profile on user signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    'user' -- Default role is 'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FUNCTION: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Prevent non-admins from changing role
-- ============================================
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If role is being changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Only allow if user is admin
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only admins can change user roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Prevent role changes by non-admins
DROP TRIGGER IF EXISTS prevent_role_change_trigger ON profiles;
CREATE TRIGGER prevent_role_change_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_change();

-- Trigger for metal_rates
DROP TRIGGER IF EXISTS update_metal_rates_updated_at ON metal_rates;
CREATE TRIGGER update_metal_rates_updated_at
  BEFORE UPDATE ON metal_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
