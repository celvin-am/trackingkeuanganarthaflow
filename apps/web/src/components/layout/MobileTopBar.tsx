import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '../../lib/auth';

const titleMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transactions',
  '/wallets': 'Wallets',
  '/budgets': 'Budgets',
  '/scan': 'Scan Receipt',
  '/settings': 'Settings',
};

export function MobileTopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: session } = useSession();

  const title = useMemo(() => {
    return titleMap[location.pathname] || 'ArthaFlow';
  }, [location.pathname]);

  return (
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

        <button
          onClick={() => navigate('/settings')}
          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-orange-100 shrink-0"
          aria-label="Open Settings"
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
      </div>
    </header>
  );
}