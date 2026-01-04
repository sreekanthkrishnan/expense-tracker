-- Migration: Add Investment Fields to Savings Goals
-- This migration extends the savings table to support investment-based goals
-- without breaking existing savings goals (all fields are optional)

-- Add investment type column
ALTER TABLE savings 
ADD COLUMN IF NOT EXISTS investment_type TEXT 
CHECK (investment_type IN ('gold', 'silver', 'mutual_fund', 'fd', 'rd', 'index_fund', 'custom') OR investment_type IS NULL);

-- Add investment metadata as JSONB (flexible structure for different investment types)
ALTER TABLE savings 
ADD COLUMN IF NOT EXISTS investment_meta JSONB DEFAULT NULL;

-- Add indexes for investment queries
CREATE INDEX IF NOT EXISTS idx_savings_investment_type ON savings(investment_type) WHERE investment_type IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN savings.investment_type IS 'Type of investment: gold, silver, mutual_fund, fd, rd, index_fund, or custom';
COMMENT ON COLUMN savings.investment_meta IS 'JSON metadata for investment: expectedReturnRate, fundName, tenureMonths, etc.';
