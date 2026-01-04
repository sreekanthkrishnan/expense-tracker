import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadLoans, saveLoan, deleteLoan, calculateEMI } from '../store/slices/loanSlice';
import type { Loan, LoanType, LoanInterestType, LoanStatus } from '../types';
import Modal from './Modal';
import LoanSummaryCard from './LoanSummaryCard';
import LoanProgressBar from './LoanProgressBar';
import RemainingEmiInfo from './RemainingEmiInfo';
import EarlyClosureTips from './EarlyClosureTips';
import EditEmiModal from './EditEmiModal';
import EditTenureModal from './EditTenureModal';
import PrepaymentSimulator from './PrepaymentSimulator';
import { Icon } from './common/Icon';
import {
  calculateLoanProgress,
  generateEarlyClosureTips,
  isHighInterestLoan,
  isLongTenureLoan,
  isInterestHeavyLoan,
} from '../utils/loanCalculations';
import { calculateNewTenureFromEMI, calculateNewEMIFromTenure } from '../utils/emiTenureCalculator';

const LoanModule = () => {
  const dispatch = useAppDispatch();
  const { loans } = useAppSelector((state) => state.loan);
  const { profile } = useAppSelector((state) => state.profile);
  const [showForm, setShowForm] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [editingEmiLoan, setEditingEmiLoan] = useState<Loan | null>(null);
  const [editingTenureLoan, setEditingTenureLoan] = useState<Loan | null>(null);
  const [formData, setFormData] = useState<Partial<Loan>>({
    name: '',
    type: 'taken',
    principal: 0,
    interestRate: 0,
    interestType: 'reducing',
    tenure: 0,
    emi: 0,
    outstandingBalance: 0,
    startDate: new Date().toISOString().split('T')[0],
    status: 'Active',
  });

  useEffect(() => {
    dispatch(loadLoans());
  }, [dispatch]);

  const calculateEMIFromForm = () => {
    if (formData.principal && formData.interestRate && formData.tenure) {
      const emi = calculateEMI(
        formData.principal,
        formData.interestRate,
        formData.tenure,
        formData.interestType || 'reducing'
      );
      setFormData({ ...formData, emi, outstandingBalance: formData.principal });
    }
  };

  useEffect(() => {
    calculateEMIFromForm();
  }, [formData.principal, formData.interestRate, formData.tenure, formData.interestType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const loan: Loan = {
      id: editingLoan?.id || `loan-${Date.now()}`,
      name: formData.name || '',
      type: formData.type || 'taken',
      principal: formData.principal || 0,
      interestRate: formData.interestRate || 0,
      interestType: formData.interestType || 'reducing',
      tenure: formData.tenure || 0,
      emi: formData.emi || 0,
      outstandingBalance: formData.outstandingBalance || formData.principal || 0,
      startDate: formData.startDate || new Date().toISOString().split('T')[0],
      status: formData.status || 'Active',
      notes: formData.notes,
    };
    dispatch(saveLoan(loan));
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'taken',
      principal: 0,
      interestRate: 0,
      interestType: 'reducing',
      tenure: 0,
      emi: 0,
      outstandingBalance: 0,
      startDate: new Date().toISOString().split('T')[0],
      status: 'Active',
    });
    setEditingLoan(null);
    setShowForm(false);
  };

  const handleEdit = (loan: Loan) => {
    setEditingLoan(loan);
    setFormData(loan);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this loan?')) {
      dispatch(deleteLoan(id));
    }
  };

  const handleUpdateEmiTenure = (loan: Loan, newEMI: number, newRemainingTenure: number) => {
    // Calculate how many EMIs have been paid
    const progress = calculateLoanProgress(loan);
    const emisPaid = progress.emisPaid;
    
    // Update loan with new EMI and adjusted total tenure
    // Total tenure = EMIs paid + new remaining tenure
    const updatedLoan: Loan = {
      ...loan,
      emi: newEMI,
      tenure: emisPaid + newRemainingTenure,
    };
    
    // Outstanding balance remains the same as it represents current state
    // The new EMI and tenure will be used for future calculations
    dispatch(saveLoan(updatedLoan));
  };

  const handleApplyPrepayment = (loan: Loan, prepaymentAmount: number, mode: 'TENURE' | 'EMI') => {
    const progress = calculateLoanProgress(loan);
    const newOutstandingBalance = loan.outstandingBalance - prepaymentAmount;
    
    if (newOutstandingBalance <= 0) {
      // Loan fully paid off
      const updatedLoan: Loan = {
        ...loan,
        outstandingBalance: 0,
        status: 'Closed',
      };
      dispatch(saveLoan(updatedLoan));
      return;
    }

    let updatedLoan: Loan;
    
    if (mode === 'TENURE') {
      // Keep EMI same, recalculate tenure
      const result = calculateNewTenureFromEMI(
        { ...loan, outstandingBalance: newOutstandingBalance },
        loan.emi
      );
      const emisPaid = progress.emisPaid;
      updatedLoan = {
        ...loan,
        outstandingBalance: newOutstandingBalance,
        tenure: emisPaid + result.newTenure,
      };
    } else {
      // Keep tenure same, recalculate EMI
      const result = calculateNewEMIFromTenure(
        { ...loan, outstandingBalance: newOutstandingBalance },
        progress.emisRemaining
      );
      updatedLoan = {
        ...loan,
        outstandingBalance: newOutstandingBalance,
        emi: result.newEMI,
      };
    }
    
    dispatch(saveLoan(updatedLoan));
  };

  const toggleCardExpand = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getLoanBadges = (loan: Loan) => {
    const badges: Array<{ label: string; color: string }> = [];
    if (isHighInterestLoan(loan)) {
      badges.push({ label: 'High Interest', color: 'bg-brand-pink bg-opacity-20 text-brand-pink' });
    }
    if (isLongTenureLoan(loan)) {
      badges.push({ label: 'Long Tenure', color: 'bg-brand-yellow bg-opacity-30 text-brand-dark-purple' });
    }
    if (isInterestHeavyLoan(loan)) {
      badges.push({ label: 'Interest Heavy', color: 'bg-brand-yellow bg-opacity-20 text-brand-dark-purple' });
    }
    return badges;
  };

  const currency = profile?.currency || 'USD';
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : currency;

  // Calculate total EMI for active loans
  const totalEMI = loans
    .filter((loan) => loan.status === 'Active' && loan.type === 'taken')
    .reduce((sum, loan) => sum + loan.emi, 0);

  const totalInterestLoss = loans
    .filter((loan) => loan.status === 'Active' && loan.type === 'taken')
    .reduce((sum, loan) => {
      const totalPayable = loan.emi * loan.tenure;
      return sum + (totalPayable - loan.principal);
    }, 0);

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Loans</h2>
          <p className="text-sm text-gray-600">Track loans taken and given</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary w-full sm:w-auto"
          aria-label="Add new loan"
        >
          <span className="mr-2">+</span> Add Loan
        </button>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="card">
          <p className="text-xs sm:text-sm text-gray-600 mb-1.5">Total Monthly EMI (Active)</p>
          <p className="text-money-lg status-loan">
            {currencySymbol}
            {totalEMI.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="card">
          <p className="text-xs sm:text-sm text-gray-600 mb-1.5">Total Interest Loss</p>
          <p className="text-money-lg status-expense">
            {currencySymbol}
            {totalInterestLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="card">
          <p className="text-xs sm:text-sm text-gray-600 mb-1.5">Active Loans</p>
          <p className="text-money-lg text-gray-900">
            {loans.filter((l) => l.status === 'Active').length}
          </p>
        </div>
      </div>

      {/* Loan Summary Card */}
      <LoanSummaryCard loans={loans} currencySymbol={currencySymbol} />

      {/* Edit EMI Modal */}
      {editingEmiLoan && (
        <EditEmiModal
          isOpen={!!editingEmiLoan}
          onClose={() => setEditingEmiLoan(null)}
          loan={editingEmiLoan}
          currencySymbol={currencySymbol}
          onSave={handleUpdateEmiTenure}
        />
      )}

      {/* Edit Tenure Modal */}
      {editingTenureLoan && (
        <EditTenureModal
          isOpen={!!editingTenureLoan}
          onClose={() => setEditingTenureLoan(null)}
          loan={editingTenureLoan}
          currencySymbol={currencySymbol}
          onSave={handleUpdateEmiTenure}
        />
      )}

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={resetForm}
        title={editingLoan ? 'Edit Loan' : 'Add Loan'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="loan-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name / Person
                </label>
                <input
                  type="text"
                  id="loan-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                  aria-required="true"
                />
              </div>
              <div>
                <label htmlFor="loan-type" className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  id="loan-type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as LoanType })}
                  className="input"
                >
                  <option value="taken">Loan Taken</option>
                  <option value="given">Loan Given</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="loan-principal" className="block text-sm font-medium text-gray-700 mb-2">
                    Principal
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      id="loan-principal"
                      value={formData.principal || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, principal: parseFloat(e.target.value) || 0 })
                      }
                      className="input pl-8"
                      required
                      min="0"
                      step="0.01"
                      aria-required="true"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="loan-rate" className="block text-sm font-medium text-gray-700 mb-2">
                    Interest Rate (% per annum)
                  </label>
                  <input
                    type="number"
                    id="loan-rate"
                    value={formData.interestRate || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })
                    }
                    className="input"
                    required
                    min="0"
                    step="0.01"
                    aria-required="true"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="loan-interest-type" className="block text-sm font-medium text-gray-700 mb-2">
                    Interest Type
                  </label>
                  <select
                    id="loan-interest-type"
                    value={formData.interestType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        interestType: e.target.value as LoanInterestType,
                      })
                    }
                    className="input"
                  >
                    <option value="flat">Flat</option>
                    <option value="reducing">Reducing Balance</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="loan-tenure" className="block text-sm font-medium text-gray-700 mb-2">
                    Tenure (months)
                  </label>
                  <input
                    type="number"
                    id="loan-tenure"
                    value={formData.tenure || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, tenure: parseInt(e.target.value) || 0 })
                    }
                    className="input"
                    required
                    min="1"
                    aria-required="true"
                  />
                </div>
              </div>
              {formData.emi && formData.emi > 0 && (
                <div className="bg-brand-purple bg-opacity-10 border border-brand-purple border-opacity-30 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">
                    <span className="text-gray-600">Calculated EMI:</span>{' '}
                    <span className="text-money status-loan">
                      {currencySymbol}
                      {formData.emi.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </p>
                </div>
              )}
              <div>
                <label htmlFor="loan-outstanding" className="block text-sm font-medium text-gray-700 mb-2">
                  Outstanding Balance
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    id="loan-outstanding"
                    value={formData.outstandingBalance || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        outstandingBalance: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="input pl-8"
                    required
                    min="0"
                    step="0.01"
                    aria-required="true"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="loan-start-date" className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="loan-start-date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="input"
                    required
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="loan-status" className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    id="loan-status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as LoanStatus })
                    }
                    className="input"
                  >
                    <option value="Active">Active</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="loan-notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Notes <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="loan-notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingLoan ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
      </Modal>

      {/* Loan List - Mobile card view, Desktop table view */}
      {loans.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Icon name="CreditCard" size={48} className="text-gray-400 opacity-50" />
            <p className="empty-state-text mb-2">No loans yet</p>
            <button onClick={() => setShowForm(true)} className="btn-primary mt-4">
              Add Your First Loan
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Card View - Enhanced */}
          <div className="block sm:hidden space-y-3">
            {loans.map((loan) => {
              const progress = calculateLoanProgress(loan);
              const tips = loan.status === 'Active' && loan.type === 'taken' ? generateEarlyClosureTips(loan, currencySymbol) : [];
              const badges = loan.status === 'Active' && loan.type === 'taken' ? getLoanBadges(loan) : [];
              const isExpanded = expandedCards.has(loan.id);

              return (
                <div key={loan.id} className="card">
                  {/* Header with badges */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm">{loan.name}</h3>
                        {badges.map((badge, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 text-xs font-semibold rounded-full ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">
                        {loan.type === 'taken' ? 'Loan Taken' : 'Loan Given'} • {new Date(loan.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            loan.status === 'Active'
                              ? 'bg-brand-yellow bg-opacity-20 text-brand-dark-purple'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {loan.status}
                        </span>
                      <button
                        onClick={() => toggleCardExpand(loan.id)}
                        className="btn-icon text-gray-400 hover:text-gray-600"
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        <Icon 
                          name="ChevronDown" 
                          size={20} 
                          className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Remaining EMIs - Prominent */}
                  {loan.status === 'Active' && loan.type === 'taken' && (
                    <RemainingEmiInfo progress={progress} currencySymbol={currencySymbol} />
                  )}

                  {/* EMI Progress Bar */}
                  {loan.status === 'Active' && loan.type === 'taken' && (
                    <LoanProgressBar progress={progress} loanName={loan.name} />
                  )}

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-600">Principal</p>
                      <p className="text-sm font-medium text-gray-900 text-money">
                        {currencySymbol}
                        {loan.principal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">EMI</p>
                      <p className="text-sm font-medium status-loan text-money">
                        {currencySymbol}
                        {loan.emi.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    {loan.status === 'Active' && loan.type === 'taken' && (
                      <>
                        <div>
                          <p className="text-xs text-gray-600">Outstanding</p>
                          <p className="text-sm font-medium text-gray-900 text-money">
                            {currencySymbol}
                            {loan.outstandingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Rate</p>
                          <p className="text-sm font-medium text-gray-900">
                            {loan.interestRate.toFixed(2)}%
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Expandable Details */}
                  {isExpanded && loan.status === 'Active' && loan.type === 'taken' && (
                    <div className="pt-3 border-t border-gray-200 slide-up">
                      <div className="space-y-3 mb-3">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Total Tenure</p>
                          <p className="text-sm font-medium text-gray-900">{loan.tenure} months</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">EMIs Paid</p>
                          <p className="text-sm font-medium text-gray-900">{progress.emisPaid} of {loan.tenure}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Interest Type</p>
                          <p className="text-sm font-medium text-gray-900 capitalize">{loan.interestType}</p>
                        </div>
                      </div>

                      {/* Early Closure Tips */}
                      {tips.length > 0 && <EarlyClosureTips tips={tips} />}

                      {/* Pre-Payment Simulator */}
                      <PrepaymentSimulator
                        loan={loan}
                        currencySymbol={currencySymbol}
                        onApply={handleApplyPrepayment}
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-gray-100">
                    {loan.status === 'Active' && loan.type === 'taken' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEmiLoan(loan);
                          }}
                          className="text-sm text-brand-dark-purple hover:text-brand-purple font-medium min-h-[44px] px-3 py-2 border border-brand-yellow rounded-lg hover:bg-brand-yellow hover:bg-opacity-20 flex items-center"
                          aria-label={`Edit EMI for ${loan.name}`}
                        >
                          Edit EMI
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTenureLoan(loan);
                          }}
                          className="text-sm text-purple-600 hover:text-purple-700 font-medium min-h-[44px] px-3 py-2 border border-purple-200 rounded-lg hover:bg-purple-50 flex items-center"
                          aria-label={`Edit tenure for ${loan.name}`}
                        >
                          Edit Tenure
                        </button>
                      </>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(loan);
                      }}
                      className="text-sm text-brand-purple hover:text-brand-dark-purple font-medium min-h-[44px] px-3 py-2 flex items-center"
                      aria-label={`Edit ${loan.name} loan`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(loan.id);
                      }}
                      className="text-sm text-brand-pink hover:text-pink-600 font-medium min-h-[44px] px-3 py-2 flex items-center"
                      aria-label={`Delete ${loan.name} loan`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View - Enhanced */}
          <div className="hidden sm:block space-y-4">
            {loans.map((loan) => {
              const progress = calculateLoanProgress(loan);
              const tips = loan.status === 'Active' && loan.type === 'taken' ? generateEarlyClosureTips(loan, currencySymbol) : [];
              const badges = loan.status === 'Active' && loan.type === 'taken' ? getLoanBadges(loan) : [];
              const isExpanded = expandedCards.has(loan.id);

              return (
                <div key={loan.id} className="card">
                  {/* Main Loan Info Row */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold text-gray-900">{loan.name}</h3>
                          {badges.map((badge, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-0.5 text-xs font-semibold rounded-full ${badge.color}`}
                            >
                              {badge.label}
                            </span>
                          ))}
                          <span
                            className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                              loan.status === 'Active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {loan.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {loan.type === 'taken' ? 'Loan Taken' : 'Loan Given'} • {new Date(loan.startDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {loan.status === 'Active' && loan.type === 'taken' && (
                        <div className="text-right">
                          <p className="text-xs text-gray-600">EMIs Remaining</p>
                          <p className="text-lg font-bold text-brand-purple">
                            {progress.emisRemaining} / {loan.tenure}
                          </p>
                        </div>
                      )}
                      <button
                        onClick={() => toggleCardExpand(loan.id)}
                        className="btn-icon text-gray-400 hover:text-gray-600"
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        <Icon 
                          name="ChevronDown" 
                          size={20} 
                          className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Principal</p>
                      <p className="text-sm font-semibold text-gray-900 text-money">
                        {currencySymbol}
                        {loan.principal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">EMI</p>
                      <p className="text-sm font-semibold status-loan text-money">
                        {currencySymbol}
                        {loan.emi.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    {loan.status === 'Active' && loan.type === 'taken' && (
                      <>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Outstanding</p>
                          <p className="text-sm font-semibold text-gray-900 text-money">
                            {currencySymbol}
                            {loan.outstandingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Interest Rate</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {loan.interestRate.toFixed(2)}%
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Remaining EMIs Info */}
                  {loan.status === 'Active' && loan.type === 'taken' && (
                    <>
                      <RemainingEmiInfo progress={progress} currencySymbol={currencySymbol} />
                      <LoanProgressBar progress={progress} loanName={loan.name} />
                    </>
                  )}

                  {/* Expandable Details */}
                  {isExpanded && loan.status === 'Active' && loan.type === 'taken' && (
                    <div className="pt-4 border-t border-gray-200 slide-up">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Total Tenure</p>
                          <p className="text-sm font-medium text-gray-900">{loan.tenure} months</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">EMIs Paid</p>
                          <p className="text-sm font-medium text-gray-900">{progress.emisPaid}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Interest Type</p>
                          <p className="text-sm font-medium text-gray-900 capitalize">{loan.interestType}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Progress</p>
                          <p className="text-sm font-medium text-gray-900">{progress.progressPercentage.toFixed(1)}%</p>
                        </div>
                      </div>

                      {/* Early Closure Tips */}
                      {tips.length > 0 && <EarlyClosureTips tips={tips} />}

                      {/* Pre-Payment Simulator */}
                      <PrepaymentSimulator
                        loan={loan}
                        currencySymbol={currencySymbol}
                        onApply={handleApplyPrepayment}
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap justify-end gap-2 pt-4 border-t border-gray-200">
                    {loan.status === 'Active' && loan.type === 'taken' && (
                      <>
                        <button
                          onClick={() => setEditingEmiLoan(loan)}
                          className="text-sm text-brand-dark-purple hover:text-brand-purple font-medium min-h-[44px] px-3 py-2 border border-brand-yellow rounded-lg hover:bg-brand-yellow hover:bg-opacity-20"
                          aria-label={`Edit EMI for ${loan.name}`}
                        >
                          Edit EMI
                        </button>
                        <button
                          onClick={() => setEditingTenureLoan(loan)}
                          className="text-sm text-purple-600 hover:text-purple-700 font-medium min-h-[44px] px-3 py-2 border border-purple-200 rounded-lg hover:bg-purple-50"
                          aria-label={`Edit tenure for ${loan.name}`}
                        >
                          Edit Tenure
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleEdit(loan)}
                      className="text-sm text-brand-purple hover:text-brand-dark-purple font-medium min-h-[44px] px-3 py-2"
                      aria-label={`Edit ${loan.name} loan`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(loan.id)}
                      className="text-sm text-brand-pink hover:text-pink-600 font-medium min-h-[44px] px-3 py-2"
                      aria-label={`Delete ${loan.name} loan`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default LoanModule;

