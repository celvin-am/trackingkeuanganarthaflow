import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSettings } from '../lib/SettingsContext';
import { useLanguage } from '../lib/LanguageContext';
import { apiClient } from '../lib/api-client';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

function getBarColor(pct: number) {
  if (pct >= 100) return 'bg-red-500';
  if (pct >= 80) return 'bg-yellow-500';
  return 'bg-primary-container';
}

export function Budgets() {
  const { formatCurrency } = useSettings();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [formData, setFormData] = useState({ categoryId: '', limitAmount: 0 });

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets', selectedMonth, selectedYear],
    queryFn: async () => {
      const res = await apiClient.get('/budgets', { params: { month: selectedMonth, year: selectedYear }});
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

  const totalLimit = budgets.reduce((s: number, b: any) => s + Number(b.limitAmount), 0);
  const totalSpent = budgets.reduce((s: number, b: any) => s + Number(b.spent), 0);

  const handleCreateOrUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        categoryId: formData.categoryId || categories[0]?.id,
        limitAmount: formData.limitAmount,
        month: selectedMonth,
        year: selectedYear
      };
      
      if (editingBudget) {
        await apiClient.patch(`/budgets/${editingBudget.id}`, payload);
      } else {
        await apiClient.post('/budgets', payload);
      }
      
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setIsModalOpen(false);
      setEditingBudget(null);
      setFormData({ categoryId: '', limitAmount: 0 });
    } catch (err) {
      console.error('Failed to save budget', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!window.confirm('Hapus anggaran ini?')) return;
    try {
      await apiClient.delete(`/budgets/${id}`);
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    } catch (err) {
      console.error('Failed to delete budget', err);
    }
  };

  const openEditModal = (budget: any) => {
    setEditingBudget(budget);
    setFormData({
      categoryId: budget.categoryId,
      limitAmount: Number(budget.limitAmount)
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-secondary font-medium mb-1">{t('dashboard')} / <span className="text-on-surface">{t('budgets')}</span></p>
          <h1 className="text-3xl font-extrabold tracking-tight">{t('budgets')}</h1>
          <p className="text-sm text-secondary mt-1">Track your spending limits across categories.</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="month" 
            value={`${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`}
            onChange={(e) => {
              const [y, m] = e.target.value.split('-');
              if (y && m) {
                setSelectedYear(Number(y));
                setSelectedMonth(Number(m));
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-lowest border border-neutral-200 rounded-xl text-sm font-semibold text-secondary cursor-pointer hover:border-primary focus:outline-none transition-colors"
          />
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-6 py-2.5 bg-primary-container text-white rounded-xl font-bold hover:opacity-90 transition-opacity text-sm">
            <span className="material-symbols-outlined text-[18px]">add</span>
            {t('add')} {t('budgets')}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="flex items-start gap-4 p-6 bg-surface-container-lowest border border-neutral-100/50 rounded-2xl shadow-sm">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <span className="material-symbols-outlined text-secondary text-[24px]">account_balance_wallet</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">{t('monthlyIncome')}</p>
            <p className="text-2xl font-extrabold text-on-surface mt-2">{formatCurrency(totalLimit)}</p>
          </div>
        </div>
        <div className="flex items-start gap-4 p-6 bg-surface-container-lowest border border-neutral-100/50 rounded-2xl shadow-sm">
          <div className="p-3 bg-red-50 text-red-500 rounded-xl">
            <span className="material-symbols-outlined text-[24px]">trending_down</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">{t('monthlyExpense')}</p>
            <p className="text-2xl font-extrabold text-red-500 mt-2">{formatCurrency(totalSpent)}</p>
          </div>
        </div>
        <div className="flex items-start gap-4 p-6 bg-surface-container-lowest border border-neutral-100/50 rounded-2xl shadow-sm">
          <div className="p-3 bg-green-50 text-green-500 rounded-xl">
            <span className="material-symbols-outlined text-[24px]">savings</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Remaining Budget</p>
            <p className="text-2xl font-extrabold text-green-500 mt-2">{formatCurrency(totalLimit - totalSpent)}</p>
          </div>
        </div>
      </div>

      {/* Budget Grid */}
      <div className="grid grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-3 p-8 text-center text-secondary text-sm">{t('loading')}...</div>
        ) : budgets.length === 0 ? (
          <div className="col-span-3 p-8 text-center text-secondary text-sm">{t('noData')}</div>
        ) : budgets.map((b: any) => {
          const limitAmount = Number(b.limitAmount);
          const spentAmount = Number(b.spent);
          const pct = Math.round((spentAmount / limitAmount) * 100);
          const barColor = getBarColor(pct);

          return (
            <div key={b.id} className="bg-surface-container-lowest p-6 rounded-2xl border border-neutral-100/50 shadow-sm hover:border-primary/30 transition-colors group cursor-pointer">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl text-white ${b.categoryColor || 'bg-neutral-500'}`}>
                    <span className="material-symbols-outlined">{b.categoryIcon || 'category'}</span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-on-surface leading-tight">{b.categoryName}</h3>
                    <p className="text-xs text-secondary mt-0.5">Automated Tracking</p>
                  </div>
                </div>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button className="p-2 bg-neutral-50 rounded-lg text-secondary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neutral-100">
                      <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                    </button>
                  </DropdownMenu.Trigger>
                  
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content 
                      className="min-w-[160px] bg-white rounded-xl shadow-xl p-1.5 border border-neutral-100 z-[110] animate-in fade-in zoom-in duration-200"
                      sideOffset={5}
                    >
                      <DropdownMenu.Item 
                        onClick={() => openEditModal(b)}
                        className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-on-surface hover:bg-neutral-50 outline-none rounded-lg cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px] text-blue-500">edit</span>
                        Edit Budget
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator className="h-px bg-neutral-100 my-1" />
                      <DropdownMenu.Item 
                        onClick={() => handleDeleteBudget(b.id)}
                        className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 outline-none rounded-lg cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                        Delete
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>

              <div>
                <div className="w-full h-2.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <p className="text-xs font-bold text-on-surface mt-1">
                      {formatCurrency(spentAmount)} <span className="text-secondary font-medium">/ {formatCurrency(limitAmount)}</span>
                    </p>
                  </div>
                  <span className={`text-xs font-bold ${pct >= 100 ? 'text-red-500' : pct >= 80 ? 'text-yellow-600' : 'text-primary'}`}>
                    {pct}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Set Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container-lowest p-8 rounded-2xl w-[450px] shadow-2xl">
            <h2 className="text-xl font-extrabold mb-6">{editingBudget ? 'Edit' : t('add')} {t('budgets')}</h2>
            <form onSubmit={handleCreateOrUpdateBudget} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase block mb-1">Target Category</label>
                <select 
                  required
                  value={formData.categoryId}
                  onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-container-low border border-neutral-200 rounded-xl text-sm font-semibold"
                >
                  <option value="" disabled>Select Category</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase block mb-1">Monthly Limit</label>
                <input 
                  required type="number" min="1"
                  value={formData.limitAmount || ''}
                  onChange={e => setFormData({ ...formData, limitAmount: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-surface-container-low border border-neutral-200 rounded-xl text-sm font-bold text-primary" 
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => {
                  setIsModalOpen(false);
                  setEditingBudget(null);
                  setFormData({ categoryId: '', limitAmount: 0 });
                }} className="flex-1 py-3 bg-neutral-100 font-bold rounded-xl text-sm">{t('cancel')}</button>
                <button type="submit" disabled={isSubmitting || categories.length === 0} className="flex-1 py-3 bg-primary-container text-white font-bold rounded-xl text-sm disabled:opacity-50">{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
