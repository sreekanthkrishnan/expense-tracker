/**
 * Loan Service
 * 
 * Handles all CRUD operations for loans using Supabase.
 * 
 * SECURITY: All operations automatically filter by user_id via RLS policies.
 */

import { supabase } from '../lib/supabaseClient';
import type { Loan } from '../types';

/**
 * Fetch all loans for the current user
 */
export const fetchLoans = async (): Promise<Loan[]> => {
  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching loans:', error);
    throw new Error('Failed to fetch loans');
  }

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    principal: parseFloat(row.principal),
    interestRate: parseFloat(row.interest_rate),
    interestType: row.interest_type,
    tenure: row.tenure,
    emi: parseFloat(row.emi),
    outstandingBalance: parseFloat(row.outstanding_balance),
    startDate: row.start_date,
    status: row.status,
    notes: row.notes || undefined,
  }));
};

/**
 * Create a new loan
 */
export const createLoan = async (loan: Omit<Loan, 'id'>): Promise<Loan> => {
  const { data, error } = await supabase
    .from('loans')
    .insert({
      name: loan.name,
      type: loan.type,
      principal: loan.principal,
      interest_rate: loan.interestRate,
      interest_type: loan.interestType,
      tenure: loan.tenure,
      emi: loan.emi,
      outstanding_balance: loan.outstandingBalance,
      start_date: loan.startDate,
      status: loan.status,
      notes: loan.notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating loan:', error);
    throw new Error('Failed to create loan');
  }

  return {
    id: data.id,
    name: data.name,
    type: data.type,
    principal: parseFloat(data.principal),
    interestRate: parseFloat(data.interest_rate),
    interestType: data.interest_type,
    tenure: data.tenure,
    emi: parseFloat(data.emi),
    outstandingBalance: parseFloat(data.outstanding_balance),
    startDate: data.start_date,
    status: data.status,
    notes: data.notes || undefined,
  };
};

/**
 * Update an existing loan
 */
export const updateLoan = async (loan: Loan): Promise<Loan> => {
  const { data, error } = await supabase
    .from('loans')
    .update({
      name: loan.name,
      type: loan.type,
      principal: loan.principal,
      interest_rate: loan.interestRate,
      interest_type: loan.interestType,
      tenure: loan.tenure,
      emi: loan.emi,
      outstanding_balance: loan.outstandingBalance,
      start_date: loan.startDate,
      status: loan.status,
      notes: loan.notes || null,
    })
    .eq('id', loan.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating loan:', error);
    throw new Error('Failed to update loan');
  }

  return {
    id: data.id,
    name: data.name,
    type: data.type,
    principal: parseFloat(data.principal),
    interestRate: parseFloat(data.interest_rate),
    interestType: data.interest_type,
    tenure: data.tenure,
    emi: parseFloat(data.emi),
    outstandingBalance: parseFloat(data.outstanding_balance),
    startDate: data.start_date,
    status: data.status,
    notes: data.notes || undefined,
  };
};

/**
 * Delete a loan
 */
export const deleteLoan = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('loans')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting loan:', error);
    throw new Error('Failed to delete loan');
  }
};
