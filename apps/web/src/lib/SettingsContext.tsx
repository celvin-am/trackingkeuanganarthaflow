import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiClient } from './api-client';
import { format, parseISO } from 'date-fns';

type Currency = 'IDR' | 'USD' | 'EUR' | 'SGD' | 'JPY' | 'MYR';
type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';

interface SettingsContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatCurrency: (amount: number | string) => string;
  dateFormat: DateFormat;
  setDateFormat: (f: DateFormat) => void;
  formatDate: (date: Date | string | null | undefined) => string;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const rates: Record<Currency, number> = {
  IDR: 1,
  USD: 1 / 15500,
  EUR: 1 / 16800,
  SGD: 1 / 11500,
  JPY: 1 / 105,
  MYR: 1 / 3300
};

const formatMap: Record<DateFormat, string> = {
  'DD/MM/YYYY': 'dd/MM/yyyy',
  'MM/DD/YYYY': 'MM/dd/yyyy',
  'YYYY-MM-DD': 'yyyy-MM-dd'
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<Currency>('IDR');
  const [dateFormat, setDateFormatState] = useState<DateFormat>('DD/MM/YYYY');
  const [isLoading, setIsLoading] = useState(false);

  // Fungsi fetch utama yang sudah di-crosscheck keamanannya
  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/settings');
      if (res.data) {
        if (res.data.currency) setCurrencyState(res.data.currency as Currency);
        if (res.data.dateFormat) setDateFormatState(res.data.dateFormat as DateFormat);
      }
    } catch (err: any) {
      // CROSS-CHECK: Jika 401, abaikan saja (User memang belum login/public access)
      if (err.response?.status === 401) {
        console.log('ℹ️ Settings: User unauthenticated, using local defaults.');
      } else {
        console.error('❌ Settings: Error fetching from server', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const setCurrency = async (c: Currency) => {
    setCurrencyState(c);
    try {
      await apiClient.patch('/settings', { currency: c });
    } catch (err) {
      console.error('Failed to save currency setting', err);
    }
  };

  const setDateFormat = async (f: DateFormat) => {
    setDateFormatState(f);
    try {
      await apiClient.patch('/settings', { dateFormat: f });
    } catch (err) {
      console.error('Failed to save date format setting', err);
    }
  };

  const formatCurrency = (amount: number | string = 0) => {
    const rawValue = Number(amount);
    const converted = rawValue * rates[currency];
    const noFractions = ['IDR', 'JPY'];

    return new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: noFractions.includes(currency) ? 0 : 2,
      maximumFractionDigits: noFractions.includes(currency) ? 0 : 2,
    }).format(converted);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return '-';
    try {
      const d = typeof date === 'string' ? parseISO(date) : date;
      return format(d, formatMap[dateFormat]);
    } catch (err) {
      console.error('Date formatting error', err);
      return String(date);
    }
  };

  return (
    <SettingsContext.Provider value={{
      currency,
      setCurrency,
      formatCurrency,
      dateFormat,
      setDateFormat,
      formatDate,
      isLoading,
      refreshSettings: fetchSettings // Untuk dipanggil manual setelah login jika perlu
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};

// Compatibility alias
export const useCurrency = () => {
  const { currency, setCurrency, formatCurrency } = useSettings();
  return { currency, setCurrency, formatCurrency };
};