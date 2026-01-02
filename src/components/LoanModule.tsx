import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadLoans, saveLoan, deleteLoan, calculateEMI } from '../store/slices/loanSlice';
import type { Loan, LoanType, LoanInterestType, LoanStatus } from '../types';
import Modal from './Modal';

const LoanModule = () => {
  const dispatch = useAppDispatch();
  const { loans } = useAppSelector((state) => state.loan);
  const { profile } = useAppSelector((state) => state.profile);
  const [showForm, setShowForm] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
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

      {/* Summary Cards */}
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
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
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
            <div className="empty-state-icon">🏦</div>
            <p className="empty-state-text mb-2">No loans yet</p>
            <button onClick={() => setShowForm(true)} className="btn-primary mt-4">
              Add Your First Loan
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-3">
            {loans.map((loan) => (
              <div key={loan.id} className="card">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{loan.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {loan.type === 'taken' ? 'Loan Taken' : 'Loan Given'} • {new Date(loan.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ml-2 ${
                      loan.status === 'Active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {loan.status}
                  </span>
                </div>
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
                </div>
                <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(loan)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium min-h-[44px] min-w-[44px] flex items-center"
                    aria-label={`Edit ${loan.name} loan`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(loan.id)}
                    className="text-sm text-red-600 hover:text-red-700 font-medium min-h-[44px] min-w-[44px] flex items-center"
                    aria-label={`Delete ${loan.name} loan`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block card overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Principal
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    EMI
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outstanding
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {loan.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {loan.type === 'taken' ? 'Taken' : 'Given'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-money text-gray-900">
                      {currencySymbol}
                      {loan.principal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-money status-loan">
                      {currencySymbol}
                      {loan.emi.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-money text-gray-900">
                      {currencySymbol}
                      {loan.outstandingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          loan.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <button
                        onClick={() => handleEdit(loan)}
                        className="text-blue-600 hover:text-blue-700 font-medium min-h-[44px] min-w-[44px]"
                        aria-label={`Edit ${loan.name} loan`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(loan.id)}
                        className="text-red-600 hover:text-red-700 font-medium min-h-[44px] min-w-[44px]"
                        aria-label={`Delete ${loan.name} loan`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default LoanModule;

