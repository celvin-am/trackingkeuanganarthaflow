import { useSession, signOut } from '../../lib/auth';
import { useSettings } from '../../lib/SettingsContext';
import { useLanguage } from '../../lib/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/api-client';

export function Header() {
  const { data: session, isPending } = useSession();
  const { currency, setCurrency } = useSettings();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('goodMorning');
    if (hour < 15) return t('goodAfternoon');
    if (hour < 19) return t('goodEvening');
    return t('goodNight');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/sign-in');
  };

  return (
    <header className="sticky top-0 h-20 bg-neutral-50/80 backdrop-blur-xl flex items-center justify-between px-10 z-40 border-b border-neutral-100/50">
      <div className="flex flex-col">
        <h2 className="text-xl font-bold tracking-tight text-on-surface">
          {getGreeting()},{' '}
          {session?.user?.name?.split(' ')[0] || (isPending ? '...' : t('user'))} 👋
        </h2>
        <p className="text-xs text-secondary font-medium">
          {t('financialOverviewHealthy')}
        </p>
      </div>

      <div className="flex items-center gap-6">
        {/* Currency Selector */}
        <div className="relative group cursor-pointer">
          <div className="flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-full text-sm font-semibold text-on-surface hover:bg-neutral-200 transition-colors">
            <span className="material-symbols-outlined text-[18px]">payments</span>
            <span>{currency}</span>
            <span className="material-symbols-outlined text-[14px]">expand_more</span>
          </div>

          <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-neutral-100 z-50">
            {['IDR', 'USD', 'EUR'].map((curr) => (
              <button
                key={curr}
                onClick={() => setCurrency(curr as any)}
                className={`w-full text-left px-4 py-2 hover:bg-neutral-50 text-sm font-semibold ${
                  currency === curr ? 'text-primary' : 'text-on-surface'
                }`}
              >
                {curr === 'IDR' ? 'IDR (Rp)' : curr === 'USD' ? 'USD ($)' : 'EUR (€)'}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="relative group cursor-pointer">
          <button className="hover:bg-neutral-200/50 rounded-full p-2 transition-all duration-300 relative">
            <span className="material-symbols-outlined text-on-surface text-[22px]">
              notifications
            </span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-neutral-100 z-50">
            <div className="px-4 py-2 border-b border-neutral-100">
              <span className="text-sm font-bold text-on-surface">
                {t('notifications')}
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              <div className="px-4 py-3 hover:bg-neutral-50 cursor-pointer flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                </div>
                <div>
                  <p className="text-sm text-on-surface font-semibold">
                    {t('welcomeNotificationTitle')}
                  </p>
                  <p className="text-xs text-secondary mt-0.5">
                    {t('welcomeNotificationDesc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Avatar & Profile Menu */}
        <div className="relative group cursor-pointer">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm bg-orange-100 flex items-center justify-center">
            {session?.user?.image ? (
              <img
                src={
                  session.user.image.startsWith('http')
                    ? session.user.image
                    : `${apiClient.defaults.baseURL?.replace('/api', '')}${session.user.image}?t=${Date.now()}`
                }
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="material-symbols-outlined text-primary text-[22px]">
                person
              </span>
            )}
          </div>

          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-neutral-100 z-50">
            <div className="px-4 py-3 border-b border-neutral-100 mb-2">
              <p className="text-sm font-bold text-on-surface truncate">
                {session?.user?.name || (isPending ? t('syncing') : t('user'))}
              </p>
              <p className="text-xs text-secondary truncate">
                {session?.user?.email || (isPending ? t('loading') : t('notLoggedIn'))}
              </p>
            </div>
            <button
              onClick={() => navigate('/settings')}
              className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-sm font-semibold text-on-surface flex items-center gap-3"
            >
              <span className="material-symbols-outlined text-[18px]">settings</span>
              {t('settings')}
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-sm font-semibold text-red-600 flex items-center gap-3 mt-1 border-t border-neutral-100 pt-3"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              {t('logout')}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}