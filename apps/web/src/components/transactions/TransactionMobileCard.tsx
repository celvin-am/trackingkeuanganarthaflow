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
    <div className="w-full min-w-0 max-w-full rounded-2xl border border-neutral-200 bg-surface-container-lowest p-4 shadow-sm">
      <div className="flex w-full min-w-0 max-w-full flex-col gap-3">
        <div className="flex w-full min-w-0 max-w-full flex-col gap-3">
          <div className="min-w-0 max-w-full">
            <p
              className="break-words text-sm font-bold leading-5 text-on-surface"
              title={tx.description}
            >
              {tx.description}
            </p>

            <div className="mt-1 flex min-w-0 max-w-full flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-secondary">
              <span className="break-words">{formattedDate}</span>
              <span>•</span>
              <span>{formattedTime}</span>
            </div>
          </div>

          <div className="min-w-0 max-w-full">
            <p
              className={`break-words text-base font-extrabold leading-6 ${
                tx.type === 'INCOME' ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {tx.type === 'INCOME' ? '+ ' : '- '}
              {formatCurrency(Number(tx.amount))}
            </p>

            <p className="mt-1 text-[10px] font-semibold uppercase text-secondary">
              {tx.type}
            </p>
          </div>
        </div>

        <div className="flex w-full min-w-0 max-w-full flex-wrap items-center gap-2">
          <span
            className={`inline-flex min-w-0 max-w-full items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase text-white ${colorClass}`}
          >
            <span className="truncate">{catName}</span>
          </span>

          <span className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-bold uppercase text-secondary">
            <span className="material-symbols-outlined shrink-0 text-[14px]">
              account_balance_wallet
            </span>
            <span className="truncate">{walletName}</span>
          </span>

          <span className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-bold uppercase text-secondary">
            <span className="material-symbols-outlined shrink-0 text-[14px]">
              {tx.recurringTxnId ? 'sync' : 'edit_note'}
            </span>
            <span className="truncate">
              {tx.recurringTxnId ? t('recurring') : t('manualEntry')}
            </span>
          </span>
        </div>

        <div className="flex w-full min-w-0 max-w-full flex-col gap-2">
          <button
            onClick={() => onEdit(tx)}
            className="flex min-h-[44px] w-full min-w-0 max-w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-neutral-50"
          >
            <span className="material-symbols-outlined shrink-0 text-[18px]">edit</span>
            <span className="truncate">{t('edit')}</span>
          </button>

          <button
            onClick={() => onDelete(tx.id)}
            className="flex min-h-[44px] w-full min-w-0 max-w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
          >
            <span className="material-symbols-outlined shrink-0 text-[18px]">delete</span>
            <span className="truncate">{t('delete')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}