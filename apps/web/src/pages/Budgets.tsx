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
      const res = await apiClient.get('/budgets', {
        params: { month: selectedMonth, year: selectedYear },
      });
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

  const totalLimit = budgets.reduce((s: number, b: any) => s + Number(b.limitAmount), 0);
  const totalSpent = budgets.reduce((s: number, b: any) => s + Number(b.spent), 0);
  const remainingBudget = totalLimit - totalSpent;

  const handleCreateOrUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        categoryId: formData.categoryId || categories[0]?.id,
        limitAmount: formData.limitAmount,
        month: selectedMonth,
        year: selectedYear,
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
      alert(t('saveBudgetFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!window.confirm(t('deleteBudgetConfirm'))) return;

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
      limitAmount: Number(budget.limitAmount),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBudget(null);
    setFormData({ categoryId: '', limitAmount: 0 });
  };

  return (
    <div className="space-y-5 lg:space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-secondary font-medium mb-1">
            {t('dashboard')} / <span className="text-on-surface">{t('budgets')}</span>
          </p>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
            {t('budgets')}
          </h1>
          <p className="text-sm text-secondary mt-1">{t('trackSpendingLimits')}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
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
            className="min-h-[48px] w-full sm:w-auto rounded-xl border border-neutral-200 bg-surface-container-lowest px-4 py-2.5 text-base sm:text-sm font-semibold text-secondary cursor-pointer transition-colors hover:border-primary focus:outline-none"
          />

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary-container px-5 py-3 text-base sm:text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            {t('add')} {t('budgets')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        <div className="flex items-start gap-4 rounded-2xl border border-neutral-100/50 bg-surface-container-lowest p-5 lg:p-6 shadow-sm">
          <div className="rounded-xl bg-primary/10 p-3 text-primary shrink-0">
            <span className="material-symbols-outlined text-[24px]">
              account_balance_wallet
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">
              {t('totalBudget')}
            </p>
            <p className="mt-2 break-words text-2xl font-extrabold text-on-surface">
              {formatCurrency(totalLimit)}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-2xl border border-neutral-100/50 bg-surface-container-lowest p-5 lg:p-6 shadow-sm">
          <div className="rounded-xl bg-red-50 p-3 text-red-500 shrink-0">
            <span className="material-symbols-outlined text-[24px]">trending_down</span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">
              {t('monthlyExpense')}
            </p>
            <p className="mt-2 break-words text-2xl font-extrabold text-red-500">
              {formatCurrency(totalSpent)}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-2xl border border-neutral-100/50 bg-surface-container-lowest p-5 lg:p-6 shadow-sm">
          <div className="rounded-xl bg-green-50 p-3 text-green-500 shrink-0">
            <span className="material-symbols-outlined text-[24px]">savings</span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">
              {t('remainingBudget')}
            </p>
            <p className="mt-2 break-words text-2xl font-extrabold text-green-500">
              {formatCurrency(remainingBudget)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {isLoading ? (
          <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-neutral-200 bg-surface-container-lowest p-8 text-center text-secondary text-sm">
            {t('loading')}
          </div>
        ) : budgets.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-neutral-200 bg-surface-container-lowest p-8 text-center text-secondary text-sm">
            {t('noData')}
          </div>
        ) : (
          budgets.map((b: any) => {
            const limitAmount = Number(b.limitAmount);
            const spentAmount = Number(b.spent);
            const pct = limitAmount > 0 ? Math.round((spentAmount / limitAmount) * 100) : 0;
            const barColor = getBarColor(pct);

            return (
              <div
                key={b.id}
                className="group rounded-2xl border border-neutral-100/50 bg-surface-container-lowest p-5 lg:p-6 shadow-sm transition-colors hover:border-primary/30"
              >
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`rounded-xl p-2.5 text-white shrink-0 ${
                        b.categoryColor || 'bg-neutral-500'
                      }`}
                    >
                      <span className="material-symbols-outlined">
                        {b.categoryIcon || 'category'}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h3 className="break-words font-extrabold leading-tight text-on-surface">
                        {b.categoryName}
                      </h3>
                      <p className="mt-0.5 text-xs text-secondary">
                        {t('automatedTracking')}
                      </p>
                    </div>
                  </div>

                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button className="rounded-lg bg-neutral-50 p-2 text-secondary transition-opacity hover:bg-neutral-100 lg:opacity-0 lg:group-hover:opacity-100">
                        <span className="material-symbols-outlined text-[18px]">
                          more_horiz
                        </span>
                      </button>
                    </DropdownMenu.Trigger>

                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        className="z-[110] min-w-[160px] rounded-xl border border-neutral-100 bg-white p-1.5 shadow-xl animate-in fade-in zoom-in duration-200"
                        sideOffset={5}
                      >
                        <DropdownMenu.Item
                          onClick={() => openEditModal(b)}
                          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold text-on-surface outline-none hover:bg-neutral-50"
                        >
                          <span className="material-symbols-outlined text-[18px] text-blue-500">
                            edit
                          </span>
                          {t('editBudget')}
                        </DropdownMenu.Item>

                        <DropdownMenu.Separator className="my-1 h-px bg-neutral-100" />

                        <DropdownMenu.Item
                          onClick={() => handleDeleteBudget(b.id)}
                          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold text-red-600 outline-none hover:bg-red-50"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                          {t('delete')}
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>

                <div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>

                  <div className="mt-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="mt-1 break-words text-sm font-bold text-on-surface">
                        {formatCurrency(spentAmount)}{' '}
                        <span className="font-medium text-secondary">
                          / {formatCurrency(limitAmount)}
                        </span>
                      </p>
                    </div>

                    <span
                      className={`shrink-0 text-xs font-bold ${
                        pct >= 100
                          ? 'text-red-500'
                          : pct >= 80
                          ? 'text-yellow-600'
                          : 'text-primary'
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm">
          <div className="flex min-h-full items-end justify-center p-3 sm:p-6 sm:items-center">
            <div className="w-full max-w-xl overflow-hidden rounded-[28px] bg-surface-container-lowest shadow-2xl max-h-[calc(100dvh-1rem)] sm:max-h-[92vh]">
              <div
                className="overflow-y-auto px-5 pt-5 pb-6 sm:px-8 sm:pt-8 sm:pb-8"
                style={{
                  maxHeight: 'calc(100dvh - 1rem)',
                  paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
                }}
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-extrabold text-on-surface">
                      {editingBudget ? t('edit') : t('add')} {t('budgets')}
                    </h2>
                    <p className="mt-1 text-sm text-secondary">
                      {t('setBudgetDescription')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-secondary hover:bg-neutral-200 transition-colors"
                    aria-label="Close modal"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                <form onSubmit={handleCreateOrUpdateBudget} className="space-y-4 sm:space-y-5">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase text-secondary">
                      {t('targetCategory')}
                    </label>
                    <select
                      required
                      value={formData.categoryId}
                      onChange={(e) =>
                        setFormData({ ...formData, categoryId: e.target.value })
                      }
                      className="w-full min-h-[52px] rounded-xl border border-neutral-200 bg-surface-container-low px-4 py-3 text-base font-semibold text-on-surface outline-none focus:border-primary-container"
                    >
                      <option value="" disabled>
                        {t('selectCategory')}
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
                      {t('monthlyLimit')}
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      inputMode="numeric"
                      value={formData.limitAmount || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          limitAmount: Number(e.target.value),
                        })
                      }
                      className="w-full min-h-[52px] rounded-xl border border-neutral-200 bg-surface-container-low px-4 py-3 text-base font-bold text-primary outline-none focus:border-primary-container"
                    />
                  </div>

                  <div
                    className="sticky bottom-0 mt-2 flex flex-col-reverse gap-3 border-t border-neutral-100 bg-surface-container-lowest pt-4 sm:flex-row"
                    style={{ paddingBottom: 'max(0rem, env(safe-area-inset-bottom))' }}
                  >
                    <button
                      type="button"
                      onClick={closeModal}
                      className="w-full min-h-[48px] rounded-xl bg-neutral-100 px-4 py-3 text-base sm:text-sm font-bold text-on-surface"
                    >
                      {t('cancel')}
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting || categories.length === 0}
                      className="w-full min-h-[48px] rounded-xl bg-primary-container px-4 py-3 text-base sm:text-sm font-bold text-white disabled:opacity-50"
                    >
                      {t('save')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}