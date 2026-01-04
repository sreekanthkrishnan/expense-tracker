/**
 * Expenses Service
 * 
 * Handles all CRUD operations for expenses using Supabase.
 * 
 * SECURITY: All operations automatically filter by user_id via RLS policies.
 * Never accept user_id from client - it's automatically set by RLS.
 */

import { supabase } from '../lib/supabaseClient';
import type { Expense } from '../types';

/**
 * Fetch all expenses for the current user
 * RLS automatically filters by auth.uid()
 */
export const fetchExpenses = async (): Promise<Expense[]> => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching expenses:', error);
    throw new Error('Failed to fetch expenses');
  }

  // Transform database format to app format
  return (data || []).map((row) => ({
    id: row.id,
    amount: parseFloat(row.amount),
    category: row.category,
    date: row.date,
    paymentMethod: row.payment_method,
    notes: row.notes || undefined,
  }));
};

/**
 * Create a new expense
 * user_id is automatically set by RLS policy
 */
export const createExpense = async (expense: Omit<Expense, 'id'>): Promise<Expense> => {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      payment_method: expense.paymentMethod,
      notes: expense.notes || null,
      // user_id is automatically set by RLS policy
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating expense:', error);
    throw new Error('Failed to create expense');
  }

  return {
    id: data.id,
    amount: parseFloat(data.amount),
    category: data.category,
    date: data.date,
    paymentMethod: data.payment_method,
    notes: data.notes || undefined,
  };
};

/**
 * Update an existing expense
 * RLS ensures user can only update their own expenses
 */
export const updateExpense = async (expense: Expense): Promise<Expense> => {
  const { data, error } = await supabase
    .from('expenses')
    .update({
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      payment_method: expense.paymentMethod,
      notes: expense.notes || null,
    })
    .eq('id', expense.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating expense:', error);
    throw new Error('Failed to update expense');
  }

  return {
    id: data.id,
    amount: parseFloat(data.amount),
    category: data.category,
    date: data.date,
    paymentMethod: data.payment_method,
    notes: data.notes || undefined,
  };
};

/**
 * Delete an expense
 * RLS ensures user can only delete their own expenses
 */
export const deleteExpense = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting expense:', error);
    throw new Error('Failed to delete expense');
  }
};
