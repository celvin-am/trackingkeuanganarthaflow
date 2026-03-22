import { NavLink, useNavigate } from 'react-router-dom';
import { signOut } from '../../lib/auth';
import { useState } from 'react';
import { HelpModal } from '../common/HelpModal';
import { useLanguage } from '../../lib/LanguageContext';
import type { TranslationKey } from '../../lib/translations';

export function Sidebar() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const navItems: { to: string; icon: string; labelKey: TranslationKey }[] = [
    { to: '/dashboard', icon: 'dashboard', labelKey: 'dashboard' },
    { to: '/transactions', icon: 'receipt_long', labelKey: 'transactions' },
    { to: '/wallets', icon: 'account_balance_wallet', labelKey: 'wallets' },
    { to: '/budgets', icon: 'account_balance', labelKey: 'budgets' },
    { to: '/scan', icon: 'qr_code_scanner', labelKey: 'scan' },
    { to: '/settings', icon: 'settings', labelKey: 'settings' },
  ];

  const bottomItems: { id: string; icon: string; labelKey: TranslationKey }[] = [
    { id: 'help', icon: 'help', labelKey: 'help' },
    { id: 'logout', icon: 'logout', labelKey: 'logout' },
  ];

  const handleAction = async (id: string) => {
    if (id === 'logout') {
      await signOut();
      navigate('/sign-in');
    } else if (id === 'help') {
      setIsHelpModalOpen(true);
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-neutral-950 font-sans antialiased tracking-tight flex flex-col py-8 shadow-2xl shadow-orange-900/10 z-50">
      {/* Logo */}
      <div className="px-8 mb-12">
        <h1 className="text-2xl font-extrabold text-white tracking-tight italic">ArthaFlow</h1>
        <p className="text-[10px] text-orange-500 uppercase tracking-widest font-bold mt-1">Finance</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-4 px-6 py-3 transition-all duration-200 ${
                isActive
                  ? 'text-orange-500 bg-orange-500/10 rounded-r-full font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`
            }
          >
            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            <span className="text-sm">{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="px-6 mt-auto flex flex-col gap-1">
        {bottomItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleAction(item.id)}
            className="flex items-center gap-4 px-6 py-3 text-neutral-400 hover:text-white transition-colors hover:bg-neutral-900 duration-200 w-full text-left"
          >
            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            <span className="text-sm">{t(item.labelKey)}</span>
          </button>
        ))}
      </div>
      
      {/* Signature */}
      <div className="px-12 mt-6 mb-2">
        <p className="text-[10px] text-neutral-600 font-medium">
          Handcrafted by <br/>
          <span className="text-neutral-500 font-bold tracking-normal">Celvin Andra Maulana</span>
        </p>
      </div>

      {/* Help Modal */}
      <HelpModal 
        isOpen={isHelpModalOpen} 
        onClose={() => setIsHelpModalOpen(false)} 
      />
    </aside>
  );
}
