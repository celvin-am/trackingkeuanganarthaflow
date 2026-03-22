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
  const [formData, setFormData] = useState({ name: '', type: 'BANK', balance: 0, description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: wallets = [], isLoading } = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const res = await apiClient.get('/wallets');
      return res.data;
    },
  });

  const totalBalance = wallets.reduce((sum: number, w: any) => sum + Number(w.balance), 0);

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
    if (!window.confirm('Are you sure you want to delete this wallet? All associated transactions will also be lost.')) return;
    try {
      await apiClient.delete(`/wallets/${id}`);
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    } catch (err) {
      console.error('Failed to delete wallet', err);
      alert('Failed to delete wallet');
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-secondary font-medium mb-1">{t('dashboard')} / <span className="text-on-surface">{t('wallets')}</span></p>
          <h1 className="text-3xl font-extrabold tracking-tight">{t('wallets')}</h1>
          <p className="text-sm text-secondary mt-1">Manage and monitor all your accounts in one place.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary-container text-white rounded-xl font-bold hover:opacity-90 transition-opacity text-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          {t('add')} {t('wallet')}
        </button>
      </div>

      {/* Add Wallet Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container-lowest p-8 rounded-2xl w-[400px] shadow-2xl">
            <h2 className="text-xl font-extrabold mb-6">{t('add')} {t('wallet')}</h2>
            <form onSubmit={handleAddWallet} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase block mb-1">Wallet Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dana Proyek YOLO" 
                  className="w-full px-4 py-3 bg-surface-container-low border border-neutral-200 rounded-xl text-sm" 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase block mb-1">Type</label>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-container-low border border-neutral-200 rounded-xl text-sm"
                >
                  <option value="BANK">Bank Account</option>
                  <option value="CASH">Physical Cash</option>
                  <option value="E_WALLET">E-Wallet</option>
                  <option value="INVESTMENT">Investment</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase block mb-1">Description (Optional)</label>
                <input 
                  type="text" 
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. My main savings account" 
                  className="w-full px-4 py-3 bg-surface-container-low border border-neutral-200 rounded-xl text-sm" 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase block mb-1">Initial Balance</label>
                <input 
                  required
                  type="number" 
                  value={formData.balance || ''}
                  onChange={e => setFormData({ ...formData, balance: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-surface-container-low border border-neutral-200 rounded-xl text-sm" 
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-neutral-100 font-bold rounded-xl text-sm">{t('cancel')}</button>
                <button type="submit" disabled={isSubmitting || !formData.name.trim() || formData.balance <= 0} className="flex-1 py-3 bg-primary-container text-white font-bold rounded-xl text-sm disabled:opacity-50">{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Wallet Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container-lowest p-8 rounded-2xl w-[400px] shadow-2xl">
            <h2 className="text-xl font-extrabold mb-6">{t('edit')} {t('wallet')}</h2>
            <form onSubmit={handleEditWallet} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase block mb-1">Wallet Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dana Proyek YOLO" 
                  className="w-full px-4 py-3 bg-surface-container-low border border-neutral-200 rounded-xl text-sm" 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase block mb-1">Type</label>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-container-low border border-neutral-200 rounded-xl text-sm"
                >
                  <option value="BANK">Bank Account</option>
                  <option value="CASH">Physical Cash</option>
                  <option value="E_WALLET">E-Wallet</option>
                  <option value="INVESTMENT">Investment</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase block mb-1">Description (Optional)</label>
                <input 
                  type="text" 
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. My main savings account" 
                  className="w-full px-4 py-3 bg-surface-container-low border border-neutral-200 rounded-xl text-sm" 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase block mb-1">Balance</label>
                <input 
                  required
                  type="number" 
                  value={formData.balance || ''}
                  onChange={e => setFormData({ ...formData, balance: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-surface-container-low border border-neutral-200 rounded-xl text-sm font-bold" 
                />
              </div>
              <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingWallet(null);
                      setFormData({ name: '', type: 'BANK', balance: 0, description: '' });
                    }} 
                    className="flex-1 py-3 bg-neutral-100 font-bold rounded-xl text-sm"
                  >
                    {t('cancel')}
                  </button>
                  <button type="submit" disabled={isSubmitting || !formData.name.trim() || formData.balance <= 0} className="flex-1 py-3 bg-primary-container text-white font-bold rounded-xl text-sm disabled:opacity-50">{t('saveChanges')}</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Total Combined Balance */}
      <div className="bg-gradient-to-r from-primary-container to-primary rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">{t('totalBalance')}</p>
          <h2 className="text-4xl font-extrabold mt-2 tracking-tight">{formatCurrency(totalBalance)}</h2>
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-semibold">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                +12.5%
              </span>
              <span className="text-xs text-white/70">vs last month</span>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-white/60">Total Assets</p>
              <p className="text-xl font-extrabold">{wallets.length}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-white/60">Monthly Yield</p>
              <p className="text-xl font-extrabold">Rp 4.2M</p>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Cards Grid */}
      <div className="grid grid-cols-3 gap-6">
        {isLoading ? (
           <div className="col-span-3 text-center py-10 text-neutral-400">Loading wallets...</div>
        ) : wallets.map((w: any) => {
          const badge = typeBadge[w.type] || typeBadge.BANK;
          return (
            <div key={w.id} className="bg-surface-container-lowest p-7 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer border border-transparent hover:border-primary/20">
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  <span className="material-symbols-outlined text-[24px]">{w.icon || 'account_balance_wallet'}</span>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${badge.bg}`}>
                  {badge.text}
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-on-surface">{w.name}</h3>
              <p className="text-xs text-secondary mt-0.5">{w.description || 'No description'}</p>
              <div className="flex justify-between items-end mt-6">
                <div>
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Available Balance</p>
                  <p className="text-2xl font-extrabold text-on-surface mt-1 tracking-tight">{formatCurrency(Number(w.balance))}</p>
                </div>
                
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button className="p-2 bg-primary/5 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer outline-none">
                      <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content sideOffset={4} align="end" className="min-w-[160px] bg-white rounded-xl shadow-xl border border-neutral-100 p-2 z-[100] animate-in fade-in zoom-in duration-200">
                      <DropdownMenu.Item 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingWallet(w);
                          setFormData({ 
                            name: w.name, 
                            type: w.type, 
                            balance: Number(w.balance), 
                            description: w.description || '' 
                          });
                          setIsEditModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-secondary hover:bg-neutral-50 hover:text-primary rounded-lg cursor-pointer outline-none transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span> {t('edit')} {t('wallet')}
                      </DropdownMenu.Item>
                      <DropdownMenu.Item 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWallet(w.id);
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-lg cursor-pointer outline-none transition-colors mt-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span> {t('delete')} {t('wallet')}
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            </div>
          );
        })}

        {/* Connect New Account Card */}
        <div 
          onClick={() => setIsModalOpen(true)}
          className="bg-surface-container-lowest p-7 rounded-xl border-2 border-dashed border-neutral-200 hover:border-primary/40 transition-colors flex flex-col items-center justify-center cursor-pointer min-h-[200px]"
        >
          <div className="p-3 bg-neutral-100 rounded-full mb-3">
            <span className="material-symbols-outlined text-neutral-400 text-[28px]">add_circle</span>
          </div>
          <p className="text-sm font-semibold text-secondary">{t('add')} {t('wallet')}</p>
        </div>
      </div>
    </div>
  );
}
