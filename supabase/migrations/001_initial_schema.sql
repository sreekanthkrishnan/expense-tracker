-- ============================================
-- SUPABASE DATABASE SCHEMA & RLS POLICIES
-- ============================================
-- 
-- This migration creates all necessary tables and Row Level Security (RLS) policies
-- for the expense tracker application.
--
-- SECURITY: All tables use RLS to ensure users can only access their own data.
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS PROFILE TABLE
-- ============================================
-- Optional profile table to store additional user information
-- The auth.users table is managed by Supabase Auth

CREATE TABLE IF NOT EXISTS users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  currency TEXT DEFAULT 'USD',
  monthly_income DECIMAL(12, 2) DEFAULT 0,
  risk_level TEXT DEFAULT 'Medium' CHECK (risk_level IN ('Low', 'Medium', 'High')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on users_profile
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users_profile
CREATE POLICY "Users can view their own profile"
  ON users_profile FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON users_profile FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users_profile FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
  ON users_profile FOR DELETE
  USING (auth.uid() = id);

-- ============================================
-- INCOMES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS incomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('recurring', 'one-time')),
  source TEXT NOT NULL,
  date DATE NOT NULL,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('monthly', 'yearly')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on incomes
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for incomes
CREATE POLICY "Users can view their own incomes"
  ON incomes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own incomes"
  ON incomes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own incomes"
  ON incomes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own incomes"
  ON incomes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- EXPENSES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  payment_method TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expenses
CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- LOANS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('taken', 'given')),
  principal DECIMAL(12, 2) NOT NULL,
  interest_rate DECIMAL(5, 2) NOT NULL,
  interest_type TEXT NOT NULL CHECK (interest_type IN ('flat', 'reducing')),
  tenure INTEGER NOT NULL, -- in months
  emi DECIMAL(12, 2) NOT NULL,
  outstanding_balance DECIMAL(12, 2) NOT NULL,
  start_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Closed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on loans
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loans
CREATE POLICY "Users can view their own loans"
  ON loans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own loans"
  ON loans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loans"
  ON loans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own loans"
  ON loans FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- SAVINGS GOALS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS savings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount DECIMAL(12, 2) NOT NULL,
  target_date DATE NOT NULL,
  current_savings DECIMAL(12, 2) DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  status TEXT CHECK (status IN ('Achievable', 'Achievable with cuts', 'Unrealistic')),
  monthly_saving_required DECIMAL(12, 2),
  feasibility_score DECIMAL(5, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on savings
ALTER TABLE savings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for savings
CREATE POLICY "Users can view their own savings"
  ON savings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own savings"
  ON savings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own savings"
  ON savings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own savings"
  ON savings FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_incomes_user_id ON incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(date);

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);

CREATE INDEX IF NOT EXISTS idx_savings_user_id ON savings(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_target_date ON savings(target_date);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_profile_updated_at
  BEFORE UPDATE ON users_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incomes_updated_at
  BEFORE UPDATE ON incomes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_savings_updated_at
  BEFORE UPDATE ON savings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
