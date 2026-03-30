import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../lib/LanguageContext';

export function Scan() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await apiClient.get('/categories')).data,
  });

  const { data: wallets = [] } = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => (await apiClient.get('/wallets')).data,
  });

  const applySelectedFile = (selected: File) => {
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setScanResult(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      applySelectedFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  const handleScan = async () => {
    if (!file) return;
    setIsScanning(true);

    const formData = new FormData();
    formData.append('receipt', file);

    try {
      const res = await apiClient.post('/scan', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setScanResult({
        ...res.data,
        categoryId: '',
        walletId: wallets.length > 0 ? wallets[0].id : '',
        type: 'EXPENSE',
        date: res.data.date || new Date().toISOString().split('T')[0],
      });
    } catch (err) {
      console.error('OCR failed', err);
      alert(t('scanFailed'));
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveTransaction = async () => {
    if (!scanResult) return;
    setIsSaving(true);

    try {
      await apiClient.post('/transactions', {
        amount: Number(scanResult.amount),
        type: scanResult.type,
        categoryId: scanResult.categoryId,
        walletId: scanResult.walletId,
        description: `${scanResult.merchant} - ${scanResult.description || t('receiptScan')}`,
        date: new Date(scanResult.date),
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['wallets'] }),
        queryClient.invalidateQueries({ queryKey: ['budgets'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-expense-dist'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-balance-trend'] }),
      ]);

      navigate('/transactions');
    } catch (err) {
      console.error('Failed saving transaction', err);
      alert(t('saveTransactionFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setScanResult(null);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-24 lg:space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="mb-1 text-xs font-medium text-secondary">
            {t('dashboard')} / <span className="text-on-surface">{t('scan')}</span>
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight lg:text-3xl">
            {t('scan')}
          </h1>
          <p className="mt-1 text-sm text-secondary">{t('scanDescription')}</p>
        </motion.div>

        {scanResult && (
          <button
            onClick={handleReset}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-bold text-secondary transition-colors hover:border-red-200 hover:text-red-500 lg:w-auto"
          >
            <span className="material-symbols-outlined text-[20px]">restart_alt</span>
            {t('resetScan')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-8">
        {/* Upload Panel */}
        <div className="lg:col-span-5">
          <div className="flex h-full flex-col rounded-3xl border border-neutral-100 bg-surface-container-lowest p-5 shadow-sm lg:p-8">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-extrabold">
              <span className="material-symbols-outlined text-primary">cloud_upload</span>
              {t('uploadReceipt')}
            </h3>

            <div className="space-y-4">
              <label className="group relative flex min-h-[240px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-neutral-200 transition-all hover:border-primary/50 hover:bg-primary/5 lg:min-h-[340px]">
                {previewUrl ? (
                  <>
                    <img
                      src={previewUrl}
                      alt={t('receiptPreview')}
                      className="absolute inset-0 h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex flex-col items-center rounded-2xl bg-white/90 p-4 text-primary shadow-xl backdrop-blur-md">
                        <span className="material-symbols-outlined mb-1 text-[32px]">
                          image
                        </span>
                        <span className="text-xs font-bold uppercase tracking-widest">
                          {t('changeImage')}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center px-6 text-center text-secondary lg:px-10">
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/5 text-primary transition-transform group-hover:scale-110">
                      <span className="material-symbols-outlined text-[40px]">
                        receipt_long
                      </span>
                    </div>
                    <p className="text-lg font-extrabold text-on-surface">
                      {t('readyToScan')}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed">
                      {t('chooseCameraOrGallery')}
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                      <span className="rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-bold">
                        JPG
                      </span>
                      <span className="rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-bold">
                        PNG
                      </span>
                      <span className="rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-bold">
                        WEBP
                      </span>
                    </div>
                  </div>
                )}

                {isScanning && (
                  <div className="pointer-events-none absolute inset-0 overflow-hidden bg-primary/10">
                    <motion.div
                      initial={{ top: '-10%' }}
                      animate={{ top: '110%' }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="absolute left-0 right-0 z-20 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_rgba(249,115,22,0.8)]"
                    />
                  </div>
                )}
              </label>

              {/* Proper mobile actions */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-on-surface transition-colors hover:border-primary hover:bg-primary/5">
                  <span className="material-symbols-outlined text-[20px] text-primary">
                    photo_camera
                  </span>
                  {t('takePhoto')}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                <label className="flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-on-surface transition-colors hover:border-primary hover:bg-primary/5">
                  <span className="material-symbols-outlined text-[20px] text-primary">
                    imagesmode
                  </span>
                  {t('chooseFromGallery')}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {!scanResult && (
                <button
                  disabled={!file || isScanning}
                  onClick={handleScan}
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-primary text-base font-extrabold text-white transition-all hover:shadow-lg hover:shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-50 lg:h-16 lg:text-lg"
                >
                  {isScanning ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {t('loading')}
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">auto_awesome</span>
                      {t('startScan')}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {!scanResult ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex min-h-[320px] h-full flex-col items-center justify-center space-y-6 rounded-3xl border border-dashed border-neutral-200 bg-surface-container-lowest p-8 text-center lg:min-h-[540px]"
              >
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-neutral-50 text-neutral-300">
                  <span className="material-symbols-outlined text-[56px]">analytics</span>
                </div>
                <div>
                  <h4 className="text-xl font-extrabold text-on-surface">
                    {t('waitingExtractionData')}
                  </h4>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-secondary">
                    {t('waitingExtractionDescription')}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex h-full flex-col rounded-3xl border border-neutral-100 bg-surface-container-lowest p-5 shadow-sm lg:p-8"
              >
                <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-extrabold">
                    <span className="material-symbols-outlined text-primary">fact_check</span>
                    {t('reviewExtractionResult')}
                  </h3>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                    {t('draftVerification')}
                  </span>
                </div>

                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4 rounded-2xl border border-green-100 bg-green-50 p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white shadow-lg shadow-green-200">
                      <span className="material-symbols-outlined text-[20px]">done_all</span>
                    </div>
                    <div>
                      <p className="text-sm font-extrabold leading-none text-green-900">
                        {t('extractionSuccess')}
                      </p>
                      <p className="mt-1 text-xs text-green-700">
                        {t('reviewBeforeSave')}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
                    <div className="lg:col-span-2">
                      <label className="mb-2 block px-1 text-[10px] font-bold uppercase tracking-widest text-secondary">
                        {t('merchantName')}
                      </label>
                      <input
                        type="text"
                        value={scanResult.merchant || ''}
                        onChange={(e) => setScanResult({ ...scanResult, merchant: e.target.value })}
                        className="w-full rounded-2xl border border-neutral-200 bg-surface-container-low px-5 py-3.5 text-base font-bold text-on-surface outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder={t('merchantPlaceholder')}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block px-1 text-[10px] font-bold uppercase tracking-widest text-secondary">
                        {t('totalAmount')}
                      </label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-secondary">
                          Rp
                        </span>
                        <input
                          type="number"
                          value={scanResult.amount || ''}
                          onChange={(e) =>
                            setScanResult({
                              ...scanResult,
                              amount: Number(e.target.value),
                            })
                          }
                          className="w-full rounded-2xl border border-neutral-200 bg-surface-container-low pl-12 pr-5 py-3.5 text-base font-black text-primary outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block px-1 text-[10px] font-bold uppercase tracking-widest text-secondary">
                        {t('transactionDate')}
                      </label>
                      <input
                        type="date"
                        value={scanResult.date || ''}
                        onChange={(e) =>
                          setScanResult({ ...scanResult, date: e.target.value })
                        }
                        className="w-full rounded-2xl border border-neutral-200 bg-surface-container-low px-5 py-3.5 text-base font-semibold text-on-surface outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary lg:text-sm"
                      />
                    </div>

                    <div className="lg:col-span-2">
                      <label className="mb-2 block px-1 text-[10px] font-bold uppercase tracking-widest text-secondary">
                        {t('additionalDescription')}
                      </label>
                      <input
                        type="text"
                        value={scanResult.description || ''}
                        onChange={(e) =>
                          setScanResult({
                            ...scanResult,
                            description: e.target.value,
                          })
                        }
                        className="w-full rounded-2xl border border-neutral-200 bg-surface-container-low px-5 py-3.5 text-base font-medium text-on-surface outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary lg:text-sm"
                        placeholder={t('additionalDescriptionPlaceholder')}
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block px-1 text-[10px] font-bold uppercase tracking-widest text-secondary">
                        {t('selectCategory')} <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={scanResult.categoryId}
                        onChange={(e) =>
                          setScanResult({
                            ...scanResult,
                            categoryId: e.target.value,
                          })
                        }
                        className={`w-full appearance-none rounded-2xl px-5 py-3.5 text-base font-bold text-on-surface outline-none transition-all lg:text-sm ${
                          !scanResult.categoryId
                            ? 'border border-red-300 bg-surface-container-low ring-2 ring-red-50/50'
                            : 'border border-neutral-200 bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary'
                        }`}
                      >
                        <option value="" disabled>
                          {t('selectCategory')}
                        </option>
                        {categories.map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      {!scanResult.categoryId && (
                        <p className="mt-1 px-1 text-[10px] font-bold text-red-500">
                          {t('categoryRequired')}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block px-1 text-[10px] font-bold uppercase tracking-widest text-secondary">
                        {t('selectWallet')}
                      </label>
                      <select
                        value={scanResult.walletId}
                        onChange={(e) =>
                          setScanResult({
                            ...scanResult,
                            walletId: e.target.value,
                          })
                        }
                        className="w-full appearance-none rounded-2xl border border-neutral-200 bg-surface-container-low px-5 py-3.5 text-base font-bold text-on-surface outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary lg:text-sm"
                      >
                        <option value="" disabled>
                          {t('selectWallet')}
                        </option>
                        {wallets.map((w: any) => (
                          <option key={w.id} value={w.id}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-8 lg:pt-10">
                  <button
                    disabled={
                      isSaving ||
                      !scanResult.categoryId ||
                      !scanResult.walletId ||
                      !scanResult.merchant ||
                      !scanResult.amount
                    }
                    onClick={handleSaveTransaction}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-green-600 py-4 text-base font-black text-white transition-all hover:bg-green-700 hover:shadow-xl hover:shadow-green-100 disabled:opacity-50 lg:py-5 lg:text-lg"
                  >
                    {isSaving ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        {t('loading')}
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined font-bold">
                          check_circle
                        </span>
                        {t('confirm')} &amp; {t('save')}
                      </>
                    )}
                  </button>
                  <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-widest text-secondary">
                    {t('makeSureDataCorrect')}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}