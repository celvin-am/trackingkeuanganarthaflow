import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { useSettings } from '../../lib/SettingsContext';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: any;
}

export function AddTransactionModal({
  isOpen,
  onClose,
  transaction,
}: AddTransactionModalProps) {
  const { formatCurrency } = useSettings();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    amount: 0,
    type: 'EXPENSE',
    categoryId: '',
    walletId: '',
    description: '',
    isRecurring: false,
    frequency: 'MONTHLY' as 'DAILY' | 'WEEKLY' | 'MONTHLY',
  });

  React.useEffect(() => {
    if (transaction) {
      setFormData({
        amount: Number(transaction.amount),
        type: transaction.type,
        categoryId: transaction.categoryId,
        walletId: transaction.walletId,
        description: transaction.description || '',
        isRecurring: !!transaction.recurringTxnId,
        frequency: transaction.recurring?.frequency || 'MONTHLY',
      });
    } else {
      setFormData({
        amount: 0,
        type: 'EXPENSE',
        categoryId: '',
        walletId: '',
        description: '',
        isRecurring: false,
        frequency: 'MONTHLY',
      });
    }
  }, [transaction, isOpen]);

  const { data: wallets = [] } = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const res = await apiClient.get('/wallets');
      return res.data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get('/categories');
      return res.data;
    },
  });

  React.useEffect(() => {
    if (categories.length > 0 && !formData.categoryId) {
      setFormData((prev) => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [categories, formData.categoryId]);

  React.useEffect(() => {
    if (wallets.length > 0 && !formData.walletId) {
      setFormData((prev) => ({ ...prev, walletId: wallets[0].id }));
    }
  }, [wallets, formData.walletId]);

  if (!isOpen) return null;

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (formData.amount <= 0) {
        throw new Error('Amount must be greater than 0.');
      }

      if (!formData.description.trim()) {
        throw new Error('Description is required.');
      }

      const payload = {
        ...formData,
        date: new Date().toISOString(),
      };

      if (formData.isRecurring && !transaction) {
        await apiClient.post('/recurring', {
          walletId: payload.walletId,
          categoryId: payload.categoryId,
          amount: payload.amount,
          type: payload.type,
          description: payload.description,
          frequency: formData.frequency,
          date: payload.date,
        });
      } else if (transaction) {
        await apiClient.patch(`/transactions/${transaction.id}`, payload);
      } else {
        await apiClient.post('/transactions', payload);
      }

      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-expense-dist'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-balance-trend'] });

      setFormData({
        amount: 0,
        type: 'EXPENSE',
        categoryId: '',
        walletId: '',
        description: '',
        isRecurring: false,
        frequency: 'MONTHLY',
      });

      onClose();
    } catch (err: any) {
      console.error('Failed to add transaction', err);
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm">
      <div className="flex min-h-full items-end justify-center p-3 sm:p-6 sm:items-center">
        <div className="w-full max-w-2xl rounded-[28px] bg-surface-container-lowest shadow-2xl max-h-[92vh] overflow-hidden">
          <div className="overflow-y-auto max-h-[92vh] px-5 py-5 sm:px-8 sm:py-8">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-on-surface">
                  {transaction ? 'Edit' : 'Add New'} Transaction
                </h2>
                <p className="mt-1 text-sm text-secondary">
                  Record and organize your financial activity.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-secondary hover:bg-neutral-200 transition-colors"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {errorMsg && (
              <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {errorMsg}
              </p>
            )}

            <form onSubmit={handleAddTransaction} className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase text-secondary">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full min-h-[52px] rounded-xl border border-neutral-200 bg-surface-container-low px-4 py-3 text-base font-semibold text-on-surface outline-none focus:border-primary-container"
                  >
                    <option value="EXPENSE">Expense Out</option>
                    <option value="INCOME">Income In</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase text-secondary">
                    Amount
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={formData.amount || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: Number(e.target.value) })
                    }
                    className="w-full min-h-[52px] rounded-xl border border-neutral-200 bg-surface-container-low px-4 py-3 text-base font-bold text-primary outline-none focus:border-primary-container"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase text-secondary">
                  Description
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Beli komponen robotika"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full min-h-[52px] rounded-xl border border-neutral-200 bg-surface-container-low px-4 py-3 text-base text-on-surface outline-none focus:border-primary-container"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase text-secondary">
                    Category
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                    className="w-full min-h-[52px] rounded-xl border border-neutral-200 bg-surface-container-low px-4 py-3 text-base text-on-surface outline-none focus:border-primary-container"
                  >
                    <option value="" disabled>
                      Select Category
                    </option>
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase text-secondary">
                    Wallet Source
                  </label>
                  <select
                    value={formData.walletId}
                    onChange={(e) =>
                      setFormData({ ...formData, walletId: e.target.value })
                    }
                    className="w-full min-h-[52px] rounded-xl border border-neutral-200 bg-surface-container-low px-4 py-3 text-base text-on-surface outline-none focus:border-primary-container"
                  >
                    <option value="" disabled>
                      Select Wallet
                    </option>
                    {wallets.map((w: any) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatCurrency(Number(w.balance))})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative shrink-0">
                    <input
                      type="checkbox"
                      checked={formData.isRecurring}
                      onChange={(e) =>
                        setFormData({ ...formData, isRecurring: e.target.checked })
                      }
                      className="sr-only"
                    />
                    <div
                      className={`h-6 w-11 rounded-full transition-colors ${
                        formData.isRecurring ? 'bg-primary' : 'bg-neutral-200'
                      }`}
                    />
                    <div
                      className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm ${
                        formData.isRecurring ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>

                  <span className="text-sm sm:text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                    Transaksi Berulang (Recurring)
                  </span>
                </label>

                {formData.isRecurring && (
                  <div className="mt-4 rounded-xl border border-primary/10 bg-primary/5 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="mb-2 block text-[10px] font-bold uppercase text-primary">
                      Pilih Frekuensi
                    </label>

                    <div className="grid grid-cols-3 gap-2">
                      {['DAILY', 'WEEKLY', 'MONTHLY'].map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFormData({ ...formData, frequency: f as any })}
                          className={`rounded-lg border px-2 py-2 text-[10px] sm:text-xs font-bold transition-all ${
                            formData.frequency === f
                              ? 'border-primary bg-primary text-white shadow-md shadow-primary/20'
                              : 'border-neutral-200 bg-white text-secondary hover:border-primary/50'
                          }`}
                        >
                          {f === 'DAILY'
                            ? 'HARIAN'
                            : f === 'WEEKLY'
                            ? 'MINGGUAN'
                            : 'BULANAN'}
                        </button>
                      ))}
                    </div>

                    <p className="mt-3 text-[10px] italic text-primary/60">
                      * Sistem akan membuat transaksi otomatis di masa depan sesuai jadwal.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full min-h-[48px] rounded-xl bg-neutral-100 px-4 py-3 text-base sm:text-sm font-bold text-on-surface"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !formData.categoryId ||
                    !formData.walletId ||
                    !formData.amount ||
                    formData.amount <= 0 ||
                    !formData.description.trim()
                  }
                  className="w-full min-h-[48px] rounded-xl bg-primary-container px-4 py-3 text-base sm:text-sm font-bold text-white disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}