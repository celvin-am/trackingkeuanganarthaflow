import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { apiClient } from '../lib/api-client';
import { useSettings } from '../lib/SettingsContext';
import { useLanguage } from '../lib/LanguageContext';

const typeBadge: Record<string, { bg: string; text: string }> = {
  BANK: { bg: 'bg-blue-100 text-blue-700', text: 'BANK' },
  CASH: { bg: 'bg-green-100 text-green-700', text: 'CASH' },
  E_WALLET: { bg: 'bg-purple-100 text-purple-700', text: 'E-WALLET' },
  INVESTMENT: { bg: 'bg-yellow-100 text-yellow-700', text: 'INVESTMENT' },
};

export function Wallets() {
  const { formatCurrency } = useSettings();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'BANK',
    balance: 0,
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: wallets = [], isLoading } = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const res = await apiClient.get('/wallets');
      return res.data;
    },
  });

  const totalBalance = wallets.reduce(
    (sum: number, w: any) => sum + Number(w.balance),
    0
  );

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post('/wallets', formData);
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setIsModalOpen(false);
      setFormData({ name: '', type: 'BANK', balance: 0, description: '' });
    } catch (err) {
      console.error('Failed to add wallet', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWallet) return;
    setIsSubmitting(true);
    try {
      await apiClient.patch(`/wallets/${editingWallet.id}`, formData);
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      setIsEditModalOpen(false);
      setEditingWallet(null);
      setFormData({ name: '', type: 'BANK', balance: 0, description: '' });
    } catch (err) {
      console.error('Failed to update wallet', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWallet = async (id: string) => {
    if (!window.confirm(t('deleteWalletConfirm'))) {
      return;
    }

    try {
      await apiClient.delete(`/wallets/${id}`);
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    } catch (err) {
      console.error('Failed to delete wallet', err);
      alert(t('deleteWalletFailed'));
    }
  };

  const closeAddModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '', type: 'BANK', balance: 0, description: '' });
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingWallet(null);
    setFormData({ name: '', type: 'BANK', balance: 0, description: '' });
  };

  return (
    <div className="space-y-5 lg:space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-secondary font-medium mb-1">
            {t('dashboard')} / <span className="text-on-surface">{t('wallets')}</span>
          </p>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
            {t('wallets')}
          </h1>
          <p className="text-sm text-secondary mt-1">{t('walletsDescription')}</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex min-h-[48px] w-full lg:w-auto items-center justify-center gap-2 rounded-xl bg-primary-container px-5 py-3 text-base lg:text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          {t('add')} {t('wallet')}
        </button>
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
                      {t('add')} {t('wallet')}
                    </h2>
                    <p className="mt-1 text-sm text-secondary">
                      {t('createWalletDescription')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeAddModal}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-secondary hover:bg-neutral-200 transition-colors"
                    aria-label="Close modal"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                <form onSubmit={handleAddWallet} className="space-y-4 sm:space-y-5">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase text-secondary">
                      {t('walletName')}
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder={t('walletNamePlaceholder')}
                      className="w-full min-h-[52px] rounded-xl border border-neutral-200 bg-surface-container-low px-4 py-3 text-base text-on-surface outline-none focus:border-primary-container"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase text-secondary">
                        {t('type')}
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) =>
                          setFormData({ ...formData, type: e.target.value })
                        }
                        className="w-full min-h-[52px] rounded-xl border border-neutral-200 bg-surface-container-low px-4 py-3 text-base text-on-surface outline-none focus:border-primary-container"
                      >
                        <option value="BANK">Bank Account</option>
                        <option value="CASH">Physical Cash</option>
                        <option value="E_WALLET">E-Wallet</option>
                        <option value="INVESTMENT">Investment</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase text-secondary">
                        {t('initialBalance')}
                      </label>
                      <input
                        required
                        type="number"
                        inputMode="numeric"
                        value={formData.balance || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            balance: Number(e.target.value),
                          })
                        }
                        className="w-full min-h-[52px] rounded-xl border border-neutral-200 bg-surface-container-low px-4 py-3 text-base font-semibold text-on-surface outline-none focus:border-primary-container"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase text-secondary">
                      {t('descriptionOptional')}
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder={t('walletDescriptionPlaceholder')}
                      className="w-full min-h-[52px] rounded-xl border border-neutral-200 bg-surface-container-low px-4 py-3 text-base text-on-surface outline-none focus:border-primary-container"
                    />
                  </div>

                  <div
                    className="sticky bottom-0 mt-2 flex flex-col-reverse gap-3 border-t border-neutral-100 bg-surface-container-lowest pt-4 sm:flex-row"
                    style={{ paddingBottom: 'max(0rem, env(safe-area-inset-bottom))' }}
                  >
                    <button
                      type="button"
                      onClick={closeAddModal}
                      className="w-full min-h-[48px] rounded-xl bg-neutral-100 px-4 py-3 text-base sm:text-sm font-bold text-on-surface"
                    >
                      {t('cancel')}
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting || !formData.name.trim() || formData.balance <= 0}
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

      {isEditModalOpen && (
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
                      {t('edit')} {t('wallet')}
                    </h2>
                    <p className="mt-1 text-sm text-secondary">
                      {t('updateWalletDescription')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-secondary hover:bg-neutral-200 transition-colors"
                    aria-label="Close modal"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                <form onSubmit={handleEditWallet} className="space-y-4 sm:space-y-5">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase text-secondary">
                      {t('walletName')}
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder={t('walletNamePlaceholder')}
                      className="w-full min-h-[52px] rounded-xl border border-neutral-200 bg-surface-container-low px-4 py-3 text-base text-on-surface outline-none focus:border-primary-container"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase text-secondary">
                        {t('type')}
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) =>
                          setFormData({ ...formData, type: e.target.value })
                        }
                        className="w-full min-h-[52px] rounded-xl border border-neutral-200 bg-surface-container-low px-4 py-3 text-base text-on-surface outline-none focus:border-primary-container"
                      >
                        <option value="BANK">Bank Account</option>
                        <option value="CASH">Physical Cash</option>
                        <option value="E_WALLET">E-Wallet</option>
                        <option value="INVESTMENT">Investment</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase text-secondary">
                        {t('balance')}
                      </label>
                      <input
                        required
                        type="number"
                        inputMode="numeric"
                        value={formData.balance || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            balance: Number(e.target.value),
                          })
                        }
                        className="w-full min-h-[52px] rounded-xl border border-neutral-200 bg-surface-container-low px-4 py-3 text-base font-semibold text-on-surface outline-none focus:border-primary-container"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase text-secondary">
                      {t('descriptionOptional')}
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder={t('walletDescriptionPlaceholder')}
                      className="w-full min-h-[52px] rounded-xl border border-neutral-200 bg-surface-container-low px-4 py-3 text-base text-on-surface outline-none focus:border-primary-container"
                    />
                  </div>

                  <div
                    className="sticky bottom-0 mt-2 flex flex-col-reverse gap-3 border-t border-neutral-100 bg-surface-container-lowest pt-4 sm:flex-row"
                    style={{ paddingBottom: 'max(0rem, env(safe-area-inset-bottom))' }}
                  >
                    <button
                      type="button"
                      onClick={closeEditModal}
                      className="w-full min-h-[48px] rounded-xl bg-neutral-100 px-4 py-3 text-base sm:text-sm font-bold text-on-surface"
                    >
                      {t('cancel')}
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting || !formData.name.trim() || formData.balance <= 0}
                      className="w-full min-h-[48px] rounded-xl bg-primary-container px-4 py-3 text-base sm:text-sm font-bold text-white disabled:opacity-50"
                    >
                      {t('saveChanges')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-container to-primary p-5 sm:p-6 lg:p-8 text-white">
        <div className="absolute right-0 top-0 h-48 w-48 sm:h-64 sm:w-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />

        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">
            {t('totalBalance')}
          </p>

          <h2 className="mt-2 break-words text-3xl sm:text-4xl font-extrabold tracking-tight">
            {formatCurrency(totalBalance)}
          </h2>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                +12.5%
              </span>
              <span className="text-xs text-white/70">{t('vsLastMonth')}</span>
            </div>

            <div className="flex gap-6 sm:gap-8">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/60">
                  {t('totalAssets')}
                </p>
                <p className="text-lg sm:text-xl font-extrabold">{wallets.length}</p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/60">
                  {t('monthlyYield')}
                </p>
                <p className="text-lg sm:text-xl font-extrabold">Rp 4.2M</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {isLoading ? (
          <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-neutral-200 bg-surface-container-lowest p-8 text-center text-neutral-400">
            {t('loadingWallets')}
          </div>
        ) : (
          <>
            {wallets.map((w: any) => {
              const badge = typeBadge[w.type] || typeBadge.BANK;

              return (
                <div
                  key={w.id}
                  className="rounded-2xl border border-transparent bg-surface-container-lowest p-5 lg:p-7 shadow-sm transition-shadow duration-200 hover:border-primary/20 hover:shadow-md"
                >
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div className="rounded-xl bg-primary/10 p-3 text-primary shrink-0">
                      <span className="material-symbols-outlined text-[24px]">
                        {w.icon || 'account_balance_wallet'}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${badge.bg}`}
                    >
                      {badge.text}
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-on-surface break-words">
                    {w.name}
                  </h3>

                  <p className="mt-0.5 text-sm text-secondary break-words">
                    {w.description || t('noDescription')}
                  </p>

                  <div className="mt-6 flex items-end justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">
                        {t('availableBalance')}
                      </p>
                      <p className="mt-1 break-words text-xl sm:text-2xl font-extrabold tracking-tight text-on-surface">
                        {formatCurrency(Number(w.balance))}
                      </p>
                    </div>

                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <button className="shrink-0 rounded-lg bg-primary/5 p-2 text-primary outline-none transition-colors hover:bg-primary/10 cursor-pointer">
                          <span className="material-symbols-outlined text-[20px]">
                            more_horiz
                          </span>
                        </button>
                      </DropdownMenu.Trigger>

                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          sideOffset={4}
                          align="end"
                          className="z-[100] min-w-[170px] rounded-xl border border-neutral-100 bg-white p-2 shadow-xl animate-in fade-in zoom-in duration-200"
                        >
                          <DropdownMenu.Item
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingWallet(w);
                              setFormData({
                                name: w.name,
                                type: w.type,
                                balance: Number(w.balance),
                                description: w.description || '',
                              });
                              setIsEditModalOpen(true);
                            }}
                            className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-secondary outline-none transition-colors hover:bg-neutral-50 hover:text-primary"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                            {t('edit')} {t('wallet')}
                          </DropdownMenu.Item>

                          <DropdownMenu.Item
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteWallet(w.id);
                            }}
                            className="mt-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-red-500 outline-none transition-colors hover:bg-red-50"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            {t('delete')} {t('wallet')}
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </div>
                </div>
              );
            })}

            <div
              onClick={() => setIsModalOpen(true)}
              className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-surface-container-lowest p-6 transition-colors hover:border-primary/40"
            >
              <div className="mb-3 rounded-full bg-neutral-100 p-3">
                <span className="material-symbols-outlined text-[28px] text-neutral-400">
                  add_circle
                </span>
              </div>
              <p className="text-sm font-semibold text-secondary">
                {t('add')} {t('wallet')}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}