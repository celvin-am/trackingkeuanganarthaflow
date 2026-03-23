import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { apiClient } from '../lib/api-client';
import { useSettings } from '../lib/SettingsContext';
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';

export function Dashboard() {
  const { formatCurrency } = useSettings();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // 🔥 ANTI-WARNING: Nunggu layout stabil (500ms) sebelum render chart
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/stats');
      return res.data;
    }
  });

  const { data: expenseDist = [] } = useQuery({
    queryKey: ['dashboard-expense-dist'],
    queryFn: async () => {
      const date = new Date();
      const res = await apiClient.get(`/dashboard/expense-distribution?month=${date.getMonth() + 1}&year=${date.getFullYear()}`);
      return res.data;
    }
  });

  const [selectedRange, setSelectedRange] = useState('1M');

  const { data: balanceTrend = [] } = useQuery({
    queryKey: ['dashboard-balance-trend', selectedRange],
    queryFn: async () => {
      const res = await apiClient.get(`/dashboard/balance-trend?range=${selectedRange}`);
      return res.data;
    }
  });

  // 🔥 VARIABLE DIGUNAKAN: Buat ngitung persentase di legend
  const totalExpense = useMemo(() => {
    return expenseDist.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
  }, [expenseDist]);

  const tailwindToHex = (twClass: string) => {
    const mapping: Record<string, string> = {
      'bg-red-500': '#ef4444', 'bg-blue-500': '#3b82f6', 'bg-green-500': '#22c55e',
      'bg-yellow-500': '#eab308', 'bg-purple-500': '#a855f7', 'bg-pink-500': '#ec4899',
      'bg-orange-500': '#f97316', 'bg-indigo-500': '#6366f1', 'bg-teal-500': '#14b8a6',
      'bg-cyan-500': '#06b6d4', 'bg-gray-500': '#6b7280',
    };
    return mapping[twClass] || '#6b7280';
  };

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t('totalBalance'), val: stats?.totalBalance, color: 'text-primary', icon: 'account_balance_wallet', bg: 'bg-surface-container-lowest', path: '/wallets' },
          { label: t('monthlyIncome'), val: stats?.monthlyIncome, color: 'text-green-500', icon: 'trending_up', bg: 'bg-surface-container-low', path: '/transactions' },
          { label: t('monthlyExpense'), val: stats?.monthlyExpense, color: 'text-red-500', icon: 'trending_down', bg: 'bg-surface-container-low', path: '/transactions' }
        ].map((card, i) => (
          <div
            key={i}
            onClick={() => navigate(card.path)}
            className={`${card.bg} p-7 rounded-xl flex flex-col justify-between h-44 shadow-sm border border-transparent hover:border-primary/10 cursor-pointer transition-all duration-200`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">{card.label}</span>
              <div className={`p-2 rounded-lg ${card.color.replace('text-', 'bg-')}/10`}>
                <span className={`material-symbols-outlined text-[20px] ${card.color}`}>{card.icon}</span>
              </div>
            </div>
            <div>
              {isLoading ? <div className="h-8 w-32 bg-neutral-200 animate-pulse rounded" /> : (
                <h3 className={`text-2xl font-extrabold ${card.color} tracking-tighter`}>{formatCurrency(card.val || 0)}</h3>
              )}
            </div>
          </div>
        ))}

        <div className="bg-surface-container-lowest p-7 rounded-xl flex items-center justify-between h-44 shadow-sm border border-neutral-100">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">{t('healthScore')}</span>
            <h3 className="text-2xl font-extrabold mt-4 tracking-tighter">{isLoading ? '-' : (stats?.healthScore || 0)}/100</h3>
          </div>
          <div className="relative w-20 h-20">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
              <circle className="text-neutral-100" cx="48" cy="48" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" />
              <circle
                className="text-green-500"
                cx="48" cy="48" r="40" fill="transparent" stroke="currentColor" strokeWidth="8"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * (stats?.healthScore || 0)) / 100}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* Charts Grid */}
      <section className="grid grid-cols-12 gap-6">
        {/* Expense Distribution */}
        <div className="col-span-12 lg:col-span-5 bg-surface-container-lowest p-8 rounded-xl shadow-sm min-h-[450px]">
          <h4 className="text-lg font-extrabold tracking-tight mb-8">{t('expenseDistribution')}</h4>
          <div className="flex flex-col md:flex-row items-center gap-8 h-[300px] min-h-[300px] w-full relative">
            <div className="relative w-[280px] h-[280px] min-h-[280px] min-w-[280px] mx-auto">
              {isMounted && !isLoading && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseDist.length > 0 ? expenseDist.map((d: any) => ({ ...d, value: Number(d.amount) })) : [{ value: 1 }]}
                      innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                    >
                      {expenseDist.map((entry: any, index: number) => (
                        <Cell key={index} fill={tailwindToHex(entry.categoryColor || entry.color)} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="w-full flex-1 space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
              {expenseDist.map((item: any) => (
                <div key={item.categoryName} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.categoryColor || '#6b7280' }} />
                    <span className="text-[13px] font-bold text-on-surface truncate max-w-[100px]">{item.categoryName}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-extrabold text-primary">{formatCurrency(Number(item.amount))}</p>
                    <p className="text-[10px] text-secondary font-bold">{totalExpense > 0 ? ((item.amount / totalExpense) * 100).toFixed(1) : 0}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Comparison */}
        <div className="col-span-12 lg:col-span-7 bg-surface-container-lowest p-8 rounded-xl shadow-sm min-h-[450px]">
          <h4 className="text-lg font-extrabold tracking-tight mb-8">{t('monthlyComparison')}</h4>
          <div className="h-[300px] min-h-[300px] pt-4 w-full relative">
            {isMounted && !isLoading && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={balanceTrend}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }} />
                  <Tooltip cursor={{ fill: '#f3f4f6' }} formatter={(v: any) => formatCurrency(Number(v))} />
                  <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      {/* Balance Trend Area Chart */}
      <section className="bg-surface-container-lowest p-8 rounded-xl shadow-sm min-h-[450px] relative">
        <div className="flex justify-between items-center mb-8">
          <h4 className="text-lg font-extrabold tracking-tight">{t('balanceTrend')}</h4>
          <div className="flex gap-2">
            {['1W', '1M', '1Y'].map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-colors ${selectedRange === range ? 'bg-primary text-white shadow-lg' : 'bg-neutral-100 hover:bg-neutral-200'}`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[300px] min-h-[300px] w-full relative">
          {isMounted && !isLoading && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={balanceTrend}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }} />
                <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                <Area type="monotone" dataKey="income" stroke="#9d4300" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  );
}