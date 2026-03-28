import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { apiClient } from './api-client';
import { format, parseISO } from 'date-fns';
import { useSession } from './auth';

type Currency = 'IDR' | 'USD' | 'EUR' | 'SGD' | 'JPY' | 'MYR';
type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';

interface SettingsContextType {
  currency: Currency;
  setCurrency: (c: Currency) => Promise<void>;
  formatCurrency: (amount: number | string) => string;
  dateFormat: DateFormat;
  setDateFormat: (f: DateFormat) => Promise<void>;
  formatDate: (date: Date | string | null | undefined) => string;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'arthaflow_settings';

const DEFAULT_SETTINGS = {
  currency: 'IDR' as Currency,
  dateFormat: 'DD/MM/YYYY' as DateFormat,
};

const rates: Record<Currency, number> = {
  IDR: 1,
  USD: 1 / 15500,
  EUR: 1 / 16800,
  SGD: 1 / 11500,
  JPY: 1 / 105,
  MYR: 1 / 3300,
};

const formatMap: Record<DateFormat, string> = {
  'DD/MM/YYYY': 'dd/MM/yyyy',
  'MM/DD/YYYY': 'MM/dd/yyyy',
  'YYYY-MM-DD': 'yyyy-MM-dd',
};

function readLocalSettings() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(raw);
    return {
      currency: (parsed.currency as Currency) ?? DEFAULT_SETTINGS.currency,
      dateFormat: (parsed.dateFormat as DateFormat) ?? DEFAULT_SETTINGS.dateFormat,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveLocalSettings(settings: { currency: Currency; dateFormat: DateFormat }) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const initialLocal = useMemo(() => readLocalSettings(), []);
  const [currency, setCurrencyState] = useState<Currency>(initialLocal.currency);
  const [dateFormat, setDateFormatState] = useState<DateFormat>(initialLocal.dateFormat);
  const [isLoading, setIsLoading] = useState(true);

  const { data: sessionData, isPending: sessionLoading } = useSession();
  const isAuthenticated = !!sessionData?.user && !sessionLoading;

  const applyLocalState = useCallback((next: { currency: Currency; dateFormat: DateFormat }) => {
    setCurrencyState(next.currency);
    setDateFormatState(next.dateFormat);
    saveLocalSettings(next);
  }, []);

  const fetchSettings = useCallback(async () => {
    if (sessionLoading) return;

    if (!isAuthenticated) {
      const local = readLocalSettings();
      applyLocalState(local);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await apiClient.get('/settings');

      const next = {
        currency: (res.data?.currency as Currency) ?? DEFAULT_SETTINGS.currency,
        dateFormat: (res.data?.dateFormat as DateFormat) ?? DEFAULT_SETTINGS.dateFormat,
      };

      applyLocalState(next);
    } catch (err: any) {
      if (err.response?.status === 401) {
        console.log('ℹ️ Settings: User unauthenticated, using local defaults.');
        applyLocalState(readLocalSettings());
      } else {
        console.error('❌ Settings: Error fetching from server', err);
        applyLocalState(readLocalSettings());
      }
    } finally {
      setIsLoading(false);
    }
  }, [applyLocalState, isAuthenticated, sessionLoading]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const setCurrency = useCallback(async (c: Currency) => {
    setCurrencyState(c);
    saveLocalSettings({ currency: c, dateFormat });

    if (!isAuthenticated) return;

    try {
      await apiClient.patch('/settings', { currency: c });
    } catch (err: any) {
      if (err.response?.status !== 401) {
        console.error('Failed to save currency setting', err);
      }
    }
  }, [dateFormat, isAuthenticated]);

  const setDateFormat = useCallback(async (f: DateFormat) => {
    setDateFormatState(f);
    saveLocalSettings({ currency, dateFormat: f });

    if (!isAuthenticated) return;

    try {
      await apiClient.patch('/settings', { dateFormat: f });
    } catch (err: any) {
      if (err.response?.status !== 401) {
        console.error('Failed to save date format setting', err);
      }
    }
  }, [currency, isAuthenticated]);

  const formatCurrency = useCallback((amount: number | string = 0) => {
    const rawValue = Number(amount);
    const converted = rawValue * rates[currency];
    const noFractions = ['IDR', 'JPY'];

    return new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: noFractions.includes(currency) ? 0 : 2,
      maximumFractionDigits: noFractions.includes(currency) ? 0 : 2,
    }).format(converted);
  }, [currency]);

  const formatDate = useCallback((date: Date | string | null | undefined) => {
    if (!date) return '-';

    try {
      const d = typeof date === 'string' ? parseISO(date) : date;
      return format(d, formatMap[dateFormat]);
    } catch (err) {
      console.error('Date formatting error', err);
      return String(date);
    }
  }, [dateFormat]);

  const value = useMemo<SettingsContextType>(() => ({
    currency,
    setCurrency,
    formatCurrency,
    dateFormat,
    setDateFormat,
    formatDate,
    isLoading,
    refreshSettings: fetchSettings,
  }), [currency, setCurrency, formatCurrency, dateFormat, setDateFormat, formatDate, isLoading, fetchSettings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};

export const useCurrency = () => {
  const { currency, setCurrency, formatCurrency } = useSettings();
  return { currency, setCurrency, formatCurrency };
};