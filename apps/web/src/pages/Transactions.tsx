import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { useSettings } from '../lib/SettingsContext';
import { useLanguage } from '../lib/LanguageContext';
import { AddTransactionModal } from '../components/transactions/AddTransactionModal';

export function Transactions() {
  const { formatCurrency, formatDate } = useSettings();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);

  // Pagination, Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: response, isLoading } = useQuery({
    queryKey: ['transactions', page, debouncedSearch, selectedCategory],
    queryFn: async () => {
      const offset = (page - 1) * limit;
      let url = `/transactions?limit=${limit}&offset=${offset}&search=${debouncedSearch}`;
      if (selectedCategory) url += `&categoryId=${selectedCategory}`;
      const res = await apiClient.get(url);
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

  const transactions = response?.data || [];
  const total = response?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const handleDelete = async (id: string) => {
    if (confirm(t('confirm'))) {
      await apiClient.delete(`/transactions/${id}`);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }
  };

  const handleEdit = (tx: any) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-secondary font-medium mb-1">{t('dashboard')} / <span className="text-on-surface">{t('transactions')}</span></p>
          <h1 className="text-3xl font-extrabold tracking-tight">{t('transactions')}</h1>
          <p className="text-sm text-secondary mt-1">Manage and monitor your financial flows with precision.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary-container text-white rounded-xl font-bold hover:opacity-90 transition-opacity text-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          {t('addTransaction')}
        </button>
      </div>

      {/* Add/Edit Transaction Modal */}
      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        transaction={editingTransaction}
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-lowest border border-neutral-200 rounded-xl text-sm w-full md:w-auto">
          <span className="material-symbols-outlined text-secondary text-[18px]">search</span>
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent outline-none text-sm flex-1 md:w-64 placeholder:text-neutral-400"
          />
        </div>

        <select 
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 bg-surface-container-lowest border border-neutral-200 rounded-xl text-sm font-semibold text-secondary outline-none focus:border-primary transition-colors cursor-pointer"
        >
          <option value="">{t('all')} {t('categories')}</option>
          {categories.map((cat: any) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Transactions Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-x-auto border border-neutral-100">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-surface-container-low/50 border-b border-neutral-100">
              <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest text-left">{t('date')}</th>
              <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest text-left">{t('description')}</th>
              <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest text-left">{t('category')}</th>
              <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest text-left">{t('wallet')}</th>
              <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest text-right">{t('amount')}</th>
              <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest text-center">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="p-8 text-center text-secondary text-sm">{t('loading')}</td></tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-secondary text-sm">
                  {t('noData')}
                </td>
              </tr>
            ) : transactions.map((tx: any) => {
              const formattedDate = formatDate(tx.date || tx.createdAt);
              const formattedTime = new Date(tx.date || tx.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

              const catName = tx.category?.name || 'Uncategorized';
              const walletName = tx.wallet?.name || 'Unknown Wallet';
              const colorClass = tx.category?.color || 'bg-neutral-500';

              return (
                <tr key={tx.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors group">
                  <td className="px-6 py-4 align-middle">
                    <p className="text-sm font-bold text-on-surface whitespace-nowrap">{formattedDate}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">{formattedTime}</p>
                  </td>
                  <td className="px-6 py-4 align-middle max-w-[250px]">
                    <p className="text-sm font-semibold text-on-surface truncate" title={tx.description}>{tx.description}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {tx.recurringTxnId && (
                        <span className="material-symbols-outlined text-[14px] text-primary animate-pulse" title={t('recurring')}>sync</span>
                      )}
                      <p className="text-xs text-secondary whitespace-nowrap">{tx.recurringTxnId ? t('recurring') : t('manualEntry')}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-middle">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase whitespace-nowrap ${colorClass}`}>
                      {catName}
                    </span>
                  </td>
                  <td className="px-6 py-4 align-middle">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-neutral-400" />
                      <span className="text-sm text-secondary whitespace-nowrap">{walletName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-middle text-right">
                    <span className={`text-sm font-bold whitespace-nowrap ${tx.type === 'INCOME' ? 'text-green-500' : 'text-red-500'}`}>
                      {tx.type === 'INCOME' ? '+ ' : '- '}{formatCurrency(Number(tx.amount))}
                    </span>
                  </td>
                  <td className="px-6 py-4 align-middle text-center">
                    <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(tx)}
                        className="p-1.5 hover:bg-neutral-200 rounded-lg transition-colors outline-none cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-secondary text-[16px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="p-1.5 hover:bg-red-100 rounded-lg transition-colors outline-none cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-red-500 text-[16px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-secondary">
          {t('total')}: <span className="font-bold text-on-surface">{total}</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-secondary text-[18px]">chevron_left</span>
          </button>

          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-on-surface">Page {page}</span>
            <span className="text-sm text-secondary">of {Math.max(1, totalPages)}</span>
          </div>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-secondary text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
