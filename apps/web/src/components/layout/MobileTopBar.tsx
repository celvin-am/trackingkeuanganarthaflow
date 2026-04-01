import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useSession, signOut } from '../../lib/auth';
import { useLanguage } from '../../lib/LanguageContext';
import { HelpModal } from '../common/HelpModal';

export function MobileTopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const titleMap: Record<string, string> = {
    '/dashboard': t('dashboard'),
    '/transactions': t('transactions'),
    '/wallets': t('wallets'),
    '/budgets': t('budgets'),
    '/scan': t('scan'),
    '/settings': t('settings'),
  };

  const title = useMemo(() => {
    return titleMap[location.pathname] || 'ArthaFlow';
  }, [location.pathname, titleMap]);

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = '/sign-in';
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  return (
    <>
      <header className="lg:hidden sticky top-0 z-40 h-16 border-b border-neutral-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
        <div className="flex h-full items-center justify-between px-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-500">
              ArthaFlow
            </p>
            <h1 className="truncate text-base font-bold text-neutral-900">
              {title}
            </h1>
          </div>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-orange-100 shrink-0"
                aria-label="Open profile menu"
              >
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-[20px] text-orange-600">
                    person
                  </span>
                )}
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                sideOffset={8}
                align="end"
                className="z-[120] min-w-[180px] rounded-2xl border border-neutral-100 bg-white p-2 shadow-xl animate-in fade-in zoom-in duration-200"
              >
                <DropdownMenu.Item
                  onClick={() => navigate('/settings')}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-on-surface outline-none hover:bg-neutral-50"
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary">
                    settings
                  </span>
                  {t('settings')}
                </DropdownMenu.Item>

                <DropdownMenu.Item
                  onClick={() => setIsHelpOpen(true)}
                  className="mt-1 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-on-surface outline-none hover:bg-neutral-50"
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary">
                    help
                  </span>
                  {t('help')}
                </DropdownMenu.Item>

                <DropdownMenu.Item
                  onClick={handleLogout}
                  className="mt-1 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-red-600 outline-none hover:bg-red-50"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    logout
                  </span>
                  {t('logout')}
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </header>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
}