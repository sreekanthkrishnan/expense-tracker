/**
 * Income Service
 * 
 * Handles all CRUD operations for incomes using Supabase.
 * 
 * SECURITY: All operations automatically filter by user_id via RLS policies.
 */

import { supabase } from '../lib/supabaseClient';
import type { Income } from '../types';

/**
 * Fetch all incomes for the current user
 */
export const fetchIncomes = async (): Promise<Income[]> => {
  const { data, error } = await supabase
    .from('incomes')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching incomes:', error);
    throw new Error('Failed to fetch incomes');
  }

  return (data || []).map((row) => ({
    id: row.id,
    amount: parseFloat(row.amount),
    type: row.type,
    source: row.source,
    date: row.date,
    recurringFrequency: row.recurring_frequency || undefined,
    notes: row.notes || undefined,
  }));
};

/**
 * Create a new income
 */
export const createIncome = async (income: Omit<Income, 'id'>): Promise<Income> => {
  // Get current user ID (required for RLS policy)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('incomes')
    .insert({
      user_id: user.id, // Required for RLS policy
      amount: income.amount,
      type: income.type,
      source: income.source,
      date: income.date,
      recurring_frequency: income.recurringFrequency || null,
      notes: income.notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating income:', error);
    throw new Error('Failed to create income');
  }

  return {
    id: data.id,
    amount: parseFloat(data.amount),
    type: data.type,
    source: data.source,
    date: data.date,
    recurringFrequency: data.recurring_frequency || undefined,
    notes: data.notes || undefined,
  };
};

/**
 * Update an existing income
 */
export const updateIncome = async (income: Income): Promise<Income> => {
  const { data, error } = await supabase
    .from('incomes')
    .update({
      amount: income.amount,
      type: income.type,
      source: income.source,
      date: income.date,
      recurring_frequency: income.recurringFrequency || null,
      notes: income.notes || null,
    })
    .eq('id', income.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating income:', error);
    throw new Error('Failed to update income');
  }

  return {
    id: data.id,
    amount: parseFloat(data.amount),
    type: data.type,
    source: data.source,
    date: data.date,
    recurringFrequency: data.recurring_frequency || undefined,
    notes: data.notes || undefined,
  };
};

/**
 * Delete an income
 */
export const deleteIncome = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('incomes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting income:', error);
    throw new Error('Failed to delete income');
  }
};
