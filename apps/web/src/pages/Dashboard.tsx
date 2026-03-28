import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { apiClient } from '../lib/api-client';
import { useSettings } from '../lib/SettingsContext';
import { useState, useMemo, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';
import { useSession } from '../lib/auth';

type Stats = {
  totalBalance?: number;
  monthlyIncome?: number;
  monthlyExpense?: number;
  healthScore?: number;
};

type ExpenseItem = {
  categoryName: string;
  amount: number;
  categoryColor?: string;
  color?: string;
};

type BalanceTrendItem = {
  month: string;
  income: number;
  expense: number;
};

type PieExpenseItem = {
  categoryName: string;
  value: number;
  colorKey: string;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`bg-neutral-200 animate-pulse rounded ${className ?? ''}`} style={style} />;
}

export function Dashboard() {
  const { formatCurrency } = useSettings();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [selectedRange, setSelectedRange] = useState<'1W' | '1M' | '1Y'>('1M');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const debouncedRange = useDebounce(selectedRange, 300);

  const { data: sessionData, isPending: sessionLoading } = useSession();
  const isAuthenticated = !!sessionData?.user && !sessionLoading;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/stats');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: isAuthenticated,
    retry: 1,
  });

  const { data: expenseDistRaw = [], isLoading: expenseLoading } = useQuery<ExpenseItem[]>({
    queryKey: ['dashboard-expense-dist'],
    queryFn: async () => {
      const date = new Date();
      const res = await apiClient.get(
        `/dashboard/expense-distribution?month=${date.getMonth() + 1}&year=${date.getFullYear()}`
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: isAuthenticated,
    retry: 1,
  });

  const { data: balanceTrendRaw = [], isLoading: trendLoading } = useQuery<BalanceTrendItem[]>({
    queryKey: ['dashboard-balance-trend', debouncedRange],
    queryFn: async () => {
      const res = await apiClient.get(`/dashboard/balance-trend?range=${debouncedRange}`);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: keepPreviousData,
    enabled: isAuthenticated,
    retry: 1,
  });

  const isLoading = statsLoading || !isAuthenticated;

  const safeExpenseDist = Array.isArray(expenseDistRaw) ? expenseDistRaw : [];
  const safeBalanceTrend = Array.isArray(balanceTrendRaw) ? balanceTrendRaw : [];

  const pieData: PieExpenseItem[] =
    safeExpenseDist.length > 0
      ? safeExpenseDist.map((d) => ({
        categoryName: d.categoryName,
        value: Number(d.amount),
        colorKey: d.categoryColor ?? d.color ?? 'bg-gray-500',
      }))
      : [];

  const totalExpense = useMemo(() => {
    return safeExpenseDist.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [safeExpenseDist]);

  const tailwindToHex = (twClass?: string): string => {
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
      'bg-gray-100': '#f3f4f6',
    };
    return mapping[twClass ?? ''] || '#6b7280';
  };

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          onClick={() => navigate('/wallets')}
          className="bg-surface-container-lowest p-7 rounded-xl flex flex-col justify-between h-44 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/20 border border-transparent"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">
              {t('totalBalance')}
            </span>
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </div>
          </div>
          <div>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <h3 className="text-2xl font-extrabold text-primary tracking-tighter">
                {formatCurrency(stats?.totalBalance ?? 0)}
              </h3>
            )}
            <p className="text-[10px] text-neutral-400 mt-1">{t('realTimePortfolio')}</p>
          </div>
        </div>

        <div
          onClick={() => navigate('/transactions')}
          className="bg-surface-container-low p-7 rounded-xl flex flex-col justify-between h-44 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-green-500/20 border border-transparent"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">
              {t('monthlyIncome')}
            </span>
            <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
              <span className="material-symbols-outlined text-[20px]">trending_up</span>
            </div>
          </div>
          <div>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <h3 className="text-2xl font-extrabold text-green-500 tracking-tighter">
                {formatCurrency(stats?.monthlyIncome ?? 0)}
              </h3>
            )}
            <p className="text-[10px] text-neutral-400 mt-1">{t('thisMonthEarnings')}</p>
          </div>
        </div>

        <div
          onClick={() => navigate('/transactions')}
          className="bg-surface-container-low p-7 rounded-xl flex flex-col justify-between h-44 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-red-500/20 border border-transparent"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">
              {t('monthlyExpense')}
            </span>
            <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
              <span className="material-symbols-outlined text-[20px]">trending_down</span>
            </div>
          </div>
          <div>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <h3 className="text-2xl font-extrabold text-red-500 tracking-tighter">
                {formatCurrency(stats?.monthlyExpense ?? 0)}
              </h3>
            )}
            <p className="text-[10px] text-neutral-400 mt-1">{t('thisMonthSpending')}</p>
          </div>
        </div>

        <div
          onClick={() => navigate('/budgets')}
          className="bg-surface-container-lowest p-7 rounded-xl flex items-center justify-between h-44 shadow-sm border border-neutral-100 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/20"
        >
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">
              {t('healthScore')}
            </span>
            <h3 className="text-2xl font-extrabold text-on-surface mt-4 tracking-tighter">
              {isLoading ? <Skeleton className="h-8 w-16 inline-block" /> : (stats?.healthScore ?? 0)}
              <span className="text-base text-neutral-400">/100</span>
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 mt-2 rounded-full text-[10px] font-bold bg-green-500/10 text-green-500">
              {(stats?.healthScore ?? 0) > 80
                ? t('excellent')
                : (stats?.healthScore ?? 0) > 50
                  ? t('good')
                  : t('needsWork')}
            </span>
          </div>
          <div className="relative w-24 h-24">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
              <circle
                className="text-neutral-100"
                cx="48"
                cy="48"
                fill="transparent"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
              />
              <circle
                className="text-green-500"
                cx="48"
                cy="48"
                fill="transparent"
                r="40"
                stroke="currentColor"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * (stats?.healthScore ?? 0)) / 100}
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

      <section className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-5 bg-surface-container-lowest p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 relative min-h-[450px]">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-lg font-extrabold tracking-tight">{t('expenseDistribution')}</h4>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setActiveMenu(activeMenu === 'expense' ? null : 'expense')}
                className={`hover:bg-neutral-100 rounded-full p-1 transition-colors ${activeMenu === 'expense' ? 'bg-neutral-100' : ''
                  }`}
              >
                <span className="material-symbols-outlined text-secondary text-[20px]">more_horiz</span>
              </button>
              {activeMenu === 'expense' && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => {
                      alert('Exporting to CSV...');
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-4 py-3 text-sm font-semibold hover:bg-neutral-50 flex items-center gap-3"
                  >
                    <span className="material-symbols-outlined text-[18px]">table_view</span>
                    Export as CSV
                  </button>
                  <button
                    onClick={() => {
                      navigate('/transactions');
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-4 py-3 text-sm font-semibold hover:bg-neutral-50 flex items-center gap-3 border-t border-neutral-100"
                  >
                    <span className="material-symbols-outlined text-[18px]">list_alt</span>
                    View Details
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8 h-[300px] min-h-[300px] min-w-0 relative">
            {expenseLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <Skeleton className="w-[160px] h-[160px] rounded-full" />
              </div>
            )}

            {!expenseLoading && pieData.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-20 backdrop-blur-[1px] rounded-xl text-center p-4">
                <p className="text-sm font-bold text-secondary max-w-[200px]">{t('noData')}</p>
              </div>
            )}

            {!expenseLoading && pieData.length > 0 && (
              <div className="relative w-[300px] h-[300px] min-w-[300px] min-h-[300px] flex-shrink-0 mx-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={600}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={tailwindToHex(entry.colorKey)}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      }}
                      formatter={(value: any) => formatCurrency(Number(value))}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-secondary font-bold uppercase">{t('total')}</span>
                  <span className="text-lg font-black">100%</span>
                </div>
              </div>
            )}

            <div className="w-full flex-1 min-w-0 space-y-3 max-h-full overflow-y-auto pr-2 scrollbar-hide">
              {safeExpenseDist.map((item) => {
                const percentage = totalExpense > 0 ? ((item.amount / totalExpense) * 100).toFixed(1) : 0;
                return (
                  <div key={item.categoryName} className="flex items-center justify-between group cursor-default">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2.5 h-2.5 rounded-full shadow-sm"
                        style={{ backgroundColor: tailwindToHex(item.categoryColor || item.color) }}
                      />
                      <span className="text-[13px] font-bold text-on-surface truncate max-w-[120px]">
                        {item.categoryName}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-extrabold text-primary">
                        {formatCurrency(Number(item.amount))}
                      </p>
                      <p className="text-[10px] text-secondary font-bold">{percentage}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

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

          <div className="h-[300px] min-h-[300px] pt-4 w-full min-w-0 relative">
            {trendLoading && (
              <div className="absolute inset-0 flex items-end gap-2 px-4 pb-4 z-10">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="flex-1" style={{ height: `${40 + Math.random() * 60}%` }} />
                ))}
              </div>
            )}

            {!trendLoading && safeBalanceTrend.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-20 backdrop-blur-[1px] rounded-xl text-center">
                <p className="text-sm font-bold text-secondary">{t('noData')}</p>
              </div>
            )}

            {!trendLoading && safeBalanceTrend.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={safeBalanceTrend} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }}
                  />
                  <Tooltip
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: any) => formatCurrency(Number(value))}
                  />
                  <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} animationDuration={600} />
                  <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} animationDuration={600} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      <section className="bg-surface-container-lowest p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 relative overflow-hidden min-h-[450px]">
        <div className="flex justify-between items-center mb-8 relative z-10">
          <div>
            <h4 className="text-lg font-extrabold tracking-tight">{t('balanceTrend')}</h4>
            <p className="text-xs text-secondary mt-0.5">{t('realTimePortfolio')}</p>
          </div>

          <div className="flex gap-2">
            {(['1W', '1M', '1Y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-colors ${selectedRange === range
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-neutral-100 hover:bg-neutral-200'
                  }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[300px] min-h-[300px] w-full min-w-0 relative">
          {trendLoading && debouncedRange !== selectedRange && (
            <div className="absolute top-2 right-2 z-10">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            </div>
          )}

          {trendLoading && (
            <div className="absolute inset-0 flex items-end gap-2 px-4 pb-4 z-10">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="flex-1" style={{ height: `${35 + Math.random() * 55}%` }} />
              ))}
            </div>
          )}

          {!trendLoading && safeBalanceTrend.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-20 backdrop-blur-[1px] rounded-xl text-center">
              <p className="text-sm font-bold text-secondary">{t('noData')}</p>
            </div>
          )}

          {!trendLoading && safeBalanceTrend.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={safeBalanceTrend} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: any) => formatCurrency(Number(value))}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#9d4300"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                  animationDuration={600}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  );
}