import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { useSettings } from '../../lib/SettingsContext';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: any; // Added for editing
}

export function AddTransactionModal({ isOpen, onClose, transaction }: AddTransactionModalProps) {
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
    frequency: 'MONTHLY' as 'DAILY' | 'WEEKLY' | 'MONTHLY'
  });

  // Populate form if editing
  React.useEffect(() => {
    if (transaction) {
      setFormData({
        amount: Number(transaction.amount),
        type: transaction.type,
        categoryId: transaction.categoryId,
        walletId: transaction.walletId,
        description: transaction.description || '',
        isRecurring: !!transaction.recurringTxnId,
        frequency: transaction.recurring?.frequency || 'MONTHLY'
      });
    } else {
      setFormData({ amount: 0, type: 'EXPENSE', categoryId: '', walletId: '', description: '', isRecurring: false, frequency: 'MONTHLY' });
    }
  }, [transaction, isOpen]);

  const { data: wallets = [] } = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const res = await apiClient.get('/wallets');
      return res.data;
    }
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get('/categories');
      return res.data;
    }
  });

  // Set default category and wallet when data loads
  React.useEffect(() => {
    if (categories.length > 0 && !formData.categoryId) {
      setFormData(prev => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [categories, formData.categoryId]);

  React.useEffect(() => {
    if (wallets.length > 0 && !formData.walletId) {
      setFormData(prev => ({ ...prev, walletId: wallets[0].id }));
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
        date: new Date().toISOString() // Explicit mandatory date
      };
      
      if (formData.isRecurring && !transaction) {
        await apiClient.post('/recurring', {
          walletId: payload.walletId,
          categoryId: payload.categoryId,
          amount: payload.amount,
          type: payload.type,
          description: payload.description,
          frequency: formData.frequency,
          date: payload.date
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
      
      setFormData({ amount: 0, type: 'EXPENSE', categoryId: '', walletId: '', description: '', isRecurring: false, frequency: 'MONTHLY' });
      onClose();
    } catch (err: any) {
      console.error('Failed to add transaction', err);
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-container-lowest p-8 rounded-2xl w-[450px] shadow-2xl">
        <h2 className="text-xl font-extrabold mb-6">{transaction ? 'Edit' : 'Add New'} Transaction</h2>
        {errorMsg && <p className="text-red-500 font-bold text-xs mb-4">{errorMsg}</p>}
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-secondary uppercase block mb-1">Type</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 bg-surface-container-low border border-neutral-200 rounded-xl text-sm font-semibold"
              >
                <option value="EXPENSE">Expense Out</option>
                <option value="INCOME">Income In</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-secondary uppercase block mb-1">Amount</label>
              <input 
                required type="number" 
                min="1"
                value={formData.amount || ''}
                onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-surface-container-low border border-neutral-200 rounded-xl text-sm font-bold text-primary" 
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-secondary uppercase block mb-1">Description</label>
            <input 
              required type="text"
              placeholder="e.g. Beli komponen robotika"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-surface-container-low border border-neutral-200 rounded-xl text-sm" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-secondary uppercase block mb-1">Category</label>
              <select 
                value={formData.categoryId}
                onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-4 py-3 bg-surface-container-low border border-neutral-200 rounded-xl text-sm"
              >
                <option value="" disabled>Select Category</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-secondary uppercase block mb-1">Wallet Source</label>
              <select 
                value={formData.walletId}
                onChange={e => setFormData({ ...formData, walletId: e.target.value })}
                className="w-full px-4 py-3 bg-surface-container-low border border-neutral-200 rounded-xl text-sm"
              >
                <option value="" disabled>Select Wallet</option>
                {wallets.map((w: any) => (
                  <option key={w.id} value={w.id}>{w.name} ({formatCurrency(Number(w.balance))})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox" 
                  checked={formData.isRecurring}
                  onChange={e => setFormData({ ...formData, isRecurring: e.target.checked })}
                  className="sr-only"
                />
                <div className={`w-10 h-5 rounded-full transition-colors ${formData.isRecurring ? 'bg-primary' : 'bg-neutral-200'}`} />
                <div className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.isRecurring ? 'translate-x-5' : 'translate-x-0'} shadow-sm`} />
              </div>
              <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Transaksi Berulang (Recurring)</span>
            </label>

            {formData.isRecurring && (
              <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/10 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="text-[10px] font-bold text-primary uppercase block mb-2">Pilih Frekuensi</label>
                <div className="grid grid-cols-3 gap-2">
                  {['DAILY', 'WEEKLY', 'MONTHLY'].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFormData({ ...formData, frequency: f as any })}
                      className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${
                        formData.frequency === f 
                          ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' 
                          : 'bg-white text-secondary border-neutral-200 hover:border-primary/50'
                      }`}
                    >
                      {f === 'DAILY' ? 'HARIAN' : f === 'WEEKLY' ? 'MINGGUAN' : 'BULANAN'}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-primary/60 mt-3 italic">* Sistem akan membuat transaksi otomatis di masa depan sesuai jadwal.</p>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-neutral-100 font-bold rounded-xl text-sm">Cancel</button>
            <button 
              type="submit" 
              disabled={isSubmitting || !formData.categoryId || !formData.walletId || !formData.amount || formData.amount <= 0 || !formData.description.trim()} 
              className="flex-1 py-3 bg-primary-container text-white font-bold rounded-xl text-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
