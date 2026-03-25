import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { apiClient } from '../lib/api-client';
import { useSettings } from '../lib/SettingsContext';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';

export function Dashboard() {
  const { formatCurrency } = useSettings();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedRange, setSelectedRange] = useState('1M');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // --- OPTIMIZED QUERIES ---

  // 1. Stats Query - Cache 5 menit biar gak spam API tiap buka Dashboard
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/stats');
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // Data dianggap fresh selama 5 menit
    gcTime: 10 * 60 * 1000,   // Cache disimpan di memori 10 menit
  });

  // 2. Expense Distribution
  const { data: expenseDist = [] } = useQuery({
    queryKey: ['dashboard-expense-dist'],
    queryFn: async () => {
      const date = new Date();
      const res = await apiClient.get(`/dashboard/expense-distribution?month=${date.getMonth() + 1}&year=${date.getFullYear()}`);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // 3. Balance Trend - Pake keepPreviousData biar grafik gak ilang pas loading
  const { data: balanceTrend = [] } = useQuery({
    queryKey: ['dashboard-balance-trend', selectedRange],
    queryFn: async () => {
      const res = await apiClient.get(`/dashboard/balance-trend?range=${selectedRange}`);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData, // 🔥 Efek "Debounce" UI: Grafik lama tetep tampil sampe data baru siap
  });

  // --- HELPERS ---

  const totalExpense = useMemo(() => {
    return expenseDist.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
  }, [expenseDist]);

  const tailwindToHex = (twClass: string) => {
    const mapping: Record<string, string> = {
      'bg-red-500': '#ef4444',
      'bg-blue-500': '#3b82f6',
      'bg-green-500': '#22c55e',
      'bg-yellow-500': '#eab308',
      'bg-purple-500': '#a855f7',
      'bg-pink-500': '#ec4899',
      'bg-orange-500': '#f97316',
      'bg-indigo-500': '#6366f1',
      'bg-teal-500': '#14b8a6',
      'bg-cyan-500': '#06b6d4',
      'bg-gray-500': '#6b7280',
    };
    return mapping[twClass] || '#6b7280';
  };

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Balance */}
        <div
          onClick={() => navigate('/wallets')}
          className="bg-surface-container-lowest p-7 rounded-xl flex flex-col justify-between h-44 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/20 border border-transparent"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">{t('totalBalance')}</span>
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </div>
          </div>
          <div>
            {isLoading ? (
              <div className="h-8 w-32 bg-neutral-200 animate-pulse rounded"></div>
            ) : (
              <h3 className="text-2xl font-extrabold text-primary tracking-tighter">{formatCurrency(stats?.totalBalance)}</h3>
            )}
            <p className="text-[10px] text-neutral-400 mt-1">{t('realTimePortfolio')}</p>
          </div>
        </div>

        {/* Monthly Income */}
        <div
          onClick={() => navigate('/transactions')}
          className="bg-surface-container-low p-7 rounded-xl flex flex-col justify-between h-44 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-green-500/20 border border-transparent"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">{t('monthlyIncome')}</span>
            <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
              <span className="material-symbols-outlined text-[20px]">trending_up</span>
            </div>
          </div>
          <div>
            {isLoading ? (
              <div className="h-8 w-32 bg-neutral-200 animate-pulse rounded"></div>
            ) : (
              <h3 className="text-2xl font-extrabold text-green-500 tracking-tighter">{formatCurrency(stats?.monthlyIncome)}</h3>
            )}
            <p className="text-[10px] text-neutral-400 mt-1">{t('thisMonthEarnings')}</p>
          </div>
        </div>

        {/* Monthly Expense */}
        <div
          onClick={() => navigate('/transactions')}
          className="bg-surface-container-low p-7 rounded-xl flex flex-col justify-between h-44 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-red-500/20 border border-transparent"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">{t('monthlyExpense')}</span>
            <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
              <span className="material-symbols-outlined text-[20px]">trending_down</span>
            </div>
          </div>
          <div>
            {isLoading ? (
              <div className="h-8 w-32 bg-neutral-200 animate-pulse rounded"></div>
            ) : (
              <h3 className="text-2xl font-extrabold text-red-500 tracking-tighter">{formatCurrency(stats?.monthlyExpense)}</h3>
            )}
            <p className="text-[10px] text-neutral-400 mt-1">{t('thisMonthSpending')}</p>
          </div>
        </div>

        {/* Health Score */}
        <div
          onClick={() => navigate('/budgets')}
          className="bg-surface-container-lowest p-7 rounded-xl flex items-center justify-between h-44 shadow-sm border border-neutral-100 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/20"
        >
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">{t('healthScore')}</span>
            <h3 className="text-2xl font-extrabold text-on-surface mt-4 tracking-tighter">
              {isLoading ? '-' : stats?.healthScore || 0}<span className="text-base text-neutral-400">/100</span>
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 mt-2 rounded-full text-[10px] font-bold bg-green-500/10 text-green-500">
              {(stats?.healthScore || 0) > 80 ? t('excellent') : (stats?.healthScore || 0) > 50 ? t('good') : t('needsWork')}
            </span>
          </div>
          <div className="relative w-24 h-24">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
              <circle className="text-neutral-100" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeWidth="8" />
              <circle
                className="text-green-500"
                cx="48"
                cy="48"
                fill="transparent"
                r="40"
                stroke="currentColor"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * (stats?.healthScore || 0)) / 100}
                strokeWidth="8"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-500 text-3xl">verified_user</span>
            </div>
          </div>
        </div>
      </section>

      {/* Charts Grid */}
      <section className="grid grid-cols-12 gap-6">
        {/* Expense Distribution */}
        <div className="col-span-12 lg:col-span-5 bg-surface-container-lowest p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 relative min-h-[450px]">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-lg font-extrabold tracking-tight">{t('expenseDistribution')}</h4>
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'expense' ? null : 'expense')}
                className={`hover:bg-neutral-100 rounded-full p-1 transition-colors ${activeMenu === 'expense' ? 'bg-neutral-100' : ''}`}
              >
                <span className="material-symbols-outlined text-secondary text-[20px]">more_horiz</span>
              </button>
              {activeMenu === 'expense' && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <button onClick={() => { alert('Exporting to CSV...'); setActiveMenu(null); }} className="w-full text-left px-4 py-3 text-sm font-semibold hover:bg-neutral-50 flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px]">table_view</span> Export as CSV
                  </button>
                  <button onClick={() => { navigate('/transactions'); setActiveMenu(null); }} className="w-full text-left px-4 py-3 text-sm font-semibold hover:bg-neutral-50 flex items-center gap-3 border-t border-neutral-100">
                    <span className="material-symbols-outlined text-[18px]">list_alt</span> View Details
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8 h-[300px] min-h-[300px] relative">
            {expenseDist.length === 0 && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-20 backdrop-blur-[1px] rounded-xl text-center p-4">
                <p className="text-sm font-bold text-secondary max-w-[200px]">{t('noData')}</p>
              </div>
            )}
            <div className="relative w-[300px] h-[300px] min-w-[300px] min-h-[300px] flex-shrink-0 mx-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseDist.length > 0 ? expenseDist.map((d: any) => ({ ...d, value: Number(d.amount) })) : [{ categoryName: 'No Data', value: 1, color: 'bg-gray-100' }]}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(expenseDist.length > 0 ? expenseDist : [{ categoryName: 'No Data', value: 1, color: 'bg-gray-100' }]).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={tailwindToHex(entry.categoryColor || entry.color)} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => formatCurrency(Number(value))}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-secondary font-bold uppercase">{t('total')}</span>
                <span className="text-lg font-black">{expenseDist.length > 0 ? '100%' : '0%'}</span>
              </div>
            </div>
            <div className="w-full flex-1 space-y-3 max-h-full overflow-y-auto pr-2 scrollbar-hide">
              {expenseDist.map((item: any) => {
                const percentage = totalExpense > 0 ? ((item.amount / totalExpense) * 100).toFixed(1) : 0;
                return (
                  <div key={item.categoryName} className="flex items-center justify-between group cursor-default">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.categoryColor || '#cbd5e1' }} />
                      <span className="text-[13px] font-bold text-on-surface truncate max-w-[120px]">{item.categoryName}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-extrabold text-primary">{formatCurrency(Number(item.amount))}</p>
                      <p className="text-[10px] text-secondary font-bold">{percentage}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Monthly Comparison */}
        <div className="col-span-12 lg:col-span-7 bg-surface-container-lowest p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 relative min-h-[450px]">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-lg font-extrabold tracking-tight">{t('monthlyComparison')}</h4>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-green-500" />
                <span className="text-[10px] font-bold text-secondary uppercase">{t('income')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-red-500" />
                <span className="text-[10px] font-bold text-secondary uppercase">{t('expense')}</span>
              </div>
            </div>
          </div>

          <div className="h-[300px] min-h-[300px] pt-4 w-full relative">
            {balanceTrend.length === 0 && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-20 backdrop-blur-[1px] rounded-xl text-center">
                <p className="text-sm font-bold text-secondary">{t('noData')}</p>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={balanceTrend} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }} />
                <Tooltip
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => formatCurrency(Number(value))}
                />
                <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Balance Trend Area Chart */}
      <section className="bg-surface-container-lowest p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 relative overflow-hidden min-h-[450px]">
        <div className="flex justify-between items-center mb-8 relative z-10">
          <div>
            <h4 className="text-lg font-extrabold tracking-tight">{t('balanceTrend')}</h4>
            <p className="text-xs text-secondary mt-0.5">{t('realTimePortfolio')}</p>
          </div>
          <div className="flex gap-2">
            {['1W', '1M', '1Y'].map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-colors ${selectedRange === range ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-neutral-100 hover:bg-neutral-200'}`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[300px] min-h-[300px] w-full relative">
          {balanceTrend.length === 0 && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-20 backdrop-blur-[1px] rounded-xl text-center">
              <p className="text-sm font-bold text-secondary">{t('noData')}</p>
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={balanceTrend} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value: any) => formatCurrency(Number(value))}
              />
              <Area type="monotone" dataKey="income" stroke="#9d4300" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}