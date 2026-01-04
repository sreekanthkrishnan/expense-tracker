/**
 * Savings Goals Service
 * 
 * Handles all CRUD operations for savings goals using Supabase.
 * 
 * SECURITY: All operations automatically filter by user_id via RLS policies.
 */

import { supabase } from '../lib/supabaseClient';
import type { SavingsGoal } from '../types';

/**
 * Fetch all savings goals for the current user
 */
export const fetchSavingsGoals = async (): Promise<SavingsGoal[]> => {
  const { data, error } = await supabase
    .from('savings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching savings goals:', error);
    throw new Error('Failed to fetch savings goals');
  }

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    targetAmount: parseFloat(row.target_amount),
    targetDate: row.target_date,
    currentSavings: parseFloat(row.current_savings),
    priority: row.priority,
    status: row.status || undefined,
    monthlySavingRequired: row.monthly_saving_required ? parseFloat(row.monthly_saving_required) : undefined,
    feasibilityScore: row.feasibility_score ? parseFloat(row.feasibility_score) : undefined,
    investmentType: row.investment_type || undefined,
    investmentMeta: row.investment_meta || undefined,
  }));
};

/**
 * Create a new savings goal
 */
export const createSavingsGoal = async (goal: Omit<SavingsGoal, 'id'>): Promise<SavingsGoal> => {
  // Get current user ID (required for RLS policy)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('savings')
    .insert({
      user_id: user.id, // Required for RLS policy
      name: goal.name,
      target_amount: goal.targetAmount,
      target_date: goal.targetDate,
      current_savings: goal.currentSavings,
      priority: goal.priority,
      status: goal.status || null,
      monthly_saving_required: goal.monthlySavingRequired || null,
      feasibility_score: goal.feasibilityScore || null,
      investment_type: goal.investmentType || null,
      investment_meta: goal.investmentMeta || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating savings goal:', error);
    throw new Error('Failed to create savings goal');
  }

  return {
    id: data.id,
    name: data.name,
    targetAmount: parseFloat(data.target_amount),
    targetDate: data.target_date,
    currentSavings: parseFloat(data.current_savings),
    priority: data.priority,
    status: data.status || undefined,
    monthlySavingRequired: data.monthly_saving_required ? parseFloat(data.monthly_saving_required) : undefined,
    feasibilityScore: data.feasibility_score ? parseFloat(data.feasibility_score) : undefined,
    investmentType: data.investment_type || undefined,
    investmentMeta: data.investment_meta || undefined,
  };
};

/**
 * Update an existing savings goal
 */
export const updateSavingsGoal = async (goal: SavingsGoal): Promise<SavingsGoal> => {
  const { data, error } = await supabase
    .from('savings')
    .update({
      name: goal.name,
      target_amount: goal.targetAmount,
      target_date: goal.targetDate,
      current_savings: goal.currentSavings,
      priority: goal.priority,
      status: goal.status || null,
      monthly_saving_required: goal.monthlySavingRequired || null,
      feasibility_score: goal.feasibilityScore || null,
      investment_type: goal.investmentType || null,
      investment_meta: goal.investmentMeta || null,
    })
    .eq('id', goal.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating savings goal:', error);
    throw new Error('Failed to update savings goal');
  }

  return {
    id: data.id,
    name: data.name,
    targetAmount: parseFloat(data.target_amount),
    targetDate: data.target_date,
    currentSavings: parseFloat(data.current_savings),
    priority: data.priority,
    status: data.status || undefined,
    monthlySavingRequired: data.monthly_saving_required ? parseFloat(data.monthly_saving_required) : undefined,
    feasibilityScore: data.feasibility_score ? parseFloat(data.feasibility_score) : undefined,
    investmentType: data.investment_type || undefined,
    investmentMeta: data.investment_meta || undefined,
  };
};

/**
 * Delete a savings goal
 */
export const deleteSavingsGoal = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('savings')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting savings goal:', error);
    throw new Error('Failed to delete savings goal');
  }
};
