type TransactionMobileCardProps = {
  tx: any;
  formatCurrency: (amount: number | string) => string;
  formatDate: (date: Date | string | null | undefined) => string;
  t: (key: any) => string;
  onEdit: (tx: any) => void;
  onDelete: (id: string) => void;
};

export function TransactionMobileCard({
  tx,
  formatCurrency,
  formatDate,
  t,
  onEdit,
  onDelete,
}: TransactionMobileCardProps) {
  const rawDate = tx.date || tx.createdAt;
  const parsedDate = rawDate ? new Date(rawDate) : new Date();

  const formattedDate = formatDate(rawDate);
  const formattedTime = parsedDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const catName = tx.category?.name || t('uncategorized');
  const walletName = tx.wallet?.name || t('unknownWallet');
  const colorClass = tx.category?.color || 'bg-neutral-500';

  return (
    <div className="w-full max-w-full min-w-0 rounded-[28px] border border-neutral-200 bg-surface-container-lowest p-5 shadow-sm">
      <div className="flex w-full min-w-0 max-w-full flex-col gap-4">
        <div className="w-full min-w-0 max-w-full">
          <p
            className="break-words text-[18px] font-bold leading-6 text-on-surface"
            title={tx.description}
          >
            {tx.description}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-secondary">
            <span>{formattedDate}</span>
            <span>•</span>
            <span>{formattedTime}</span>
          </div>
        </div>

        <div className="w-full min-w-0 max-w-full">
          <p
            className={`break-words text-[20px] font-extrabold leading-7 ${
              tx.type === 'INCOME' ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {tx.type === 'INCOME' ? '+ ' : '- '}
            {formatCurrency(Number(tx.amount))}
          </p>

          <p className="mt-2 text-sm font-medium uppercase tracking-wide text-secondary">
            {tx.type}
          </p>
        </div>

        <div className="flex w-full min-w-0 max-w-full flex-wrap items-center gap-2">
          <span
            className={`inline-flex min-w-0 max-w-full items-center rounded-full px-4 py-2 text-xs font-bold uppercase text-white ${colorClass}`}
          >
            <span className="truncate">{catName}</span>
          </span>

          <span className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full bg-neutral-100 px-4 py-2 text-xs font-bold uppercase text-secondary">
            <span className="material-symbols-outlined shrink-0 text-[16px]">
              account_balance_wallet
            </span>
            <span className="truncate">{walletName}</span>
          </span>

          <span className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full bg-neutral-100 px-4 py-2 text-xs font-bold uppercase text-secondary">
            <span className="material-symbols-outlined shrink-0 text-[16px]">
              {tx.recurringTxnId ? 'sync' : 'edit_note'}
            </span>
            <span className="truncate">
              {tx.recurringTxnId ? t('recurring') : t('manualEntry')}
            </span>
          </span>
        </div>

        <div className="flex w-full min-w-0 max-w-full flex-col gap-3 pt-1">
          <button
            onClick={() => onEdit(tx)}
            className="flex min-h-[52px] w-full min-w-0 max-w-full items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-5 py-3 text-base font-semibold text-on-surface transition-colors hover:bg-neutral-50"
          >
            <span className="material-symbols-outlined shrink-0 text-[20px]">edit</span>
            <span className="truncate">{t('edit')}</span>
          </button>

          <button
            onClick={() => onDelete(tx.id)}
            className="flex min-h-[52px] w-full min-w-0 max-w-full items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 py-3 text-base font-semibold text-red-600 transition-colors hover:bg-red-100"
          >
            <span className="material-symbols-outlined shrink-0 text-[20px]">delete</span>
            <span className="truncate">{t('delete')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}