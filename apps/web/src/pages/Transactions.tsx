import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { useSettings } from '../lib/SettingsContext';
import { useLanguage } from '../lib/LanguageContext';
import { AddTransactionModal } from '../components/transactions/AddTransactionModal';
import { TransactionMobileCard } from '../components/transactions/TransactionMobileCard';

export function Transactions() {
  const { formatCurrency, formatDate } = useSettings();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
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
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get('/categories');
      return res.data;
    },
  });

  const transactions = response?.data || [];
  const total = response?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

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
    <div className="space-y-5 pb-[calc(112px+env(safe-area-inset-bottom))] lg:space-y-8 lg:pb-0">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-medium text-secondary">
            {t('dashboard')} / <span className="text-on-surface">{t('transactions')}</span>
          </p>

          <h1 className="text-2xl font-extrabold tracking-tight lg:text-3xl">
            {t('transactions')}
          </h1>

          <p className="mt-1 text-sm text-secondary">
            {t('transactionsDescription')}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingTransaction(null);
            setIsModalOpen(true);
          }}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary-container px-5 py-3 text-base font-bold text-white transition-opacity hover:opacity-90 lg:w-auto lg:text-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          {t('addTransaction')}
        </button>
      </div>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        transaction={editingTransaction}
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex min-h-[48px] w-full items-center gap-2 rounded-xl border border-neutral-200 bg-surface-container-lowest px-4 py-2.5 text-base md:w-auto">
          <span className="material-symbols-outlined shrink-0 text-[18px] text-secondary">
            search
          </span>
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-base outline-none placeholder:text-neutral-400 md:w-64"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setPage(1);
          }}
          className="min-h-[48px] w-full cursor-pointer rounded-xl border border-neutral-200 bg-surface-container-lowest px-4 py-2.5 text-base font-semibold text-secondary outline-none transition-colors focus:border-primary md:w-auto md:text-sm"
        >
          <option value="">
            {t('all')} {t('categories')}
          </option>
          {categories.map((cat: any) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3 lg:hidden">
        {isLoading ? (
          <div className="rounded-2xl border border-neutral-200 bg-surface-container-lowest p-6 text-center text-sm text-secondary">
            {t('loading')}
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-surface-container-lowest p-6 text-center text-sm text-secondary">
            {t('noData')}
          </div>
        ) : (
          transactions.map((tx: any) => (
            <TransactionMobileCard
              key={tx.id}
              tx={tx}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              t={t}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-neutral-100 bg-surface-container-lowest shadow-sm lg:block">
        <table className="min-w-[800px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-neutral-100 bg-surface-container-low/50">
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-secondary">
                {t('date')}
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-secondary">
                {t('description')}
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-secondary">
                {t('category')}
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-secondary">
                {t('wallet')}
              </th>
              <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-secondary">
                {t('amount')}
              </th>
              <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-widest text-secondary">
                {t('actions')}
              </th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-sm text-secondary">
                  {t('loading')}
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-sm text-secondary">
                  {t('noData')}
                </td>
              </tr>
            ) : (
              transactions.map((tx: any) => {
                const formattedDate = formatDate(tx.date || tx.createdAt);
                const formattedTime = new Date(tx.date || tx.createdAt).toLocaleTimeString(
                  'en-US',
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                  }
                );

                const catName = tx.category?.name || t('uncategorized');
                const walletName = tx.wallet?.name || t('unknownWallet');
                const colorClass = tx.category?.color || 'bg-neutral-500';

                return (
                  <tr
                    key={tx.id}
                    className="group border-b border-neutral-50 transition-colors hover:bg-neutral-50/50"
                  >
                    <td className="align-middle px-6 py-4">
                      <p className="whitespace-nowrap text-sm font-bold text-on-surface">
                        {formattedDate}
                      </p>
                      <p className="mt-0.5 text-[10px] text-neutral-400">{formattedTime}</p>
                    </td>

                    <td className="max-w-[250px] align-middle px-6 py-4">
                      <p
                        className="truncate text-sm font-semibold text-on-surface"
                        title={tx.description}
                      >
                        {tx.description}
                      </p>

                      <div className="mt-0.5 flex items-center gap-1.5">
                        {tx.recurringTxnId && (
                          <span
                            className="material-symbols-outlined animate-pulse text-[14px] text-primary"
                            title={t('recurring')}
                          >
                            sync
                          </span>
                        )}
                        <p className="whitespace-nowrap text-xs text-secondary">
                          {tx.recurringTxnId ? t('recurring') : t('manualEntry')}
                        </p>
                      </div>
                    </td>

                    <td className="align-middle px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase whitespace-nowrap text-white ${colorClass}`}
                      >
                        {catName}
                      </span>
                    </td>

                    <td className="align-middle px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-neutral-400" />
                        <span className="whitespace-nowrap text-sm text-secondary">
                          {walletName}
                        </span>
                      </div>
                    </td>

                    <td className="align-middle px-6 py-4 text-right">
                      <span
                        className={`whitespace-nowrap text-sm font-bold ${
                          tx.type === 'INCOME' ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {tx.type === 'INCOME' ? '+ ' : '- '}
                        {formatCurrency(Number(tx.amount))}
                      </span>
                    </td>

                    <td className="align-middle px-6 py-4 text-center">
                      <div className="flex justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => handleEdit(tx)}
                          className="cursor-pointer rounded-lg p-1.5 outline-none transition-colors hover:bg-neutral-200"
                        >
                          <span className="material-symbols-outlined text-[16px] text-secondary">
                            edit
                          </span>
                        </button>

                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="cursor-pointer rounded-lg p-1.5 outline-none transition-colors hover:bg-red-100"
                        >
                          <span className="material-symbols-outlined text-[16px] text-red-500">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-secondary">
          {t('total')}: <span className="font-bold text-on-surface">{total}</span>
        </p>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">
              chevron_left
            </span>
          </button>

          <div className="flex items-center gap-1 px-2">
            <span className="text-sm font-bold text-on-surface">
              {t('page')} {page}
            </span>
            <span className="text-sm text-secondary">
              {t('of')} {totalPages}
            </span>
          </div>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">
              chevron_right
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}