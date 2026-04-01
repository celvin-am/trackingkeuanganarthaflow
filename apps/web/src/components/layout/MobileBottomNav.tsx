import { NavLink } from 'react-router-dom';
import { useLanguage } from '../../lib/LanguageContext';

export function MobileBottomNav() {
  const { t } = useLanguage();

  const navItems = [
    { to: '/dashboard', icon: 'dashboard', label: t('dashboard') },
    { to: '/transactions', icon: 'receipt_long', label: t('transactions') },
    { to: '/scan', icon: 'qr_code_scanner', label: t('scan') },
    { to: '/budgets', icon: 'account_balance', label: t('budgets') },
    { to: '/wallets', icon: 'account_balance_wallet', label: t('wallets') },
  ];

  return (
    <nav className="lg:hidden fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div
        className="grid grid-cols-5 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 transition-colors ${
                isActive ? 'text-orange-600' : 'text-neutral-500 hover:text-neutral-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`material-symbols-outlined text-[22px] ${
                    isActive ? 'font-variation-settings-[FILL_1]' : ''
                  }`}
                >
                  {item.icon}
                </span>
                <span className="truncate text-[10px] font-semibold">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}