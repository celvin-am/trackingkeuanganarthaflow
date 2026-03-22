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

  // Get categories and wallets to map the transaction easily
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: async () => (await apiClient.get('/categories')).data });
  const { data: wallets = [] } = useQuery({ queryKey: ['wallets'], queryFn: async () => (await apiClient.get('/wallets')).data });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setScanResult(null); // Reset previous scans
    }
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
      console.log('Gemini Extracted:', res.data);
      
      // Smart Mapping: Category remains empty for user to select manually if not obvious
      setScanResult({
        ...res.data,
        categoryId: '', // Enforce manual selection for higher accuracy
        walletId: wallets.length > 0 ? wallets[0].id : '',
        type: 'EXPENSE',
        date: res.data.date || new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      console.error('OCR failed', err);
      alert('Gagal memproses struk. Silakan coba lagi atau input manual.');
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
        description: `${scanResult.merchant} - ${scanResult.description || 'Receipt Scan'}`,
        date: new Date(scanResult.date),
      });
      
      // UI Refresh State: Await deep invalidation to ensure UI is absolutely current
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
      alert('Gagal menyimpan transaksi ke database.');
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
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-end">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-xs text-secondary font-medium mb-1">{t('dashboard')} / <span className="text-on-surface">{t('scan')}</span></p>
          <h1 className="text-3xl font-extrabold tracking-tight">{t('scan')}</h1>
          <p className="text-sm text-secondary mt-1">Upload receipt and let AI handle the data extraction.</p>
        </motion.div>
        
        {scanResult && (
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-secondary hover:text-red-500 font-bold transition-colors text-sm"
          >
            <span className="material-symbols-outlined text-[20px]">restart_alt</span>
            Reset Scan
          </button>
        )}
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Upload Panel */}
        <div className="col-span-5 space-y-6">
          <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-neutral-100 h-full flex flex-col">
            <h3 className="text-lg font-extrabold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">cloud_upload</span>
              {t('add')} {t('scan')}
            </h3>
            
            <label className="flex-1 border-2 border-dashed border-neutral-200 rounded-3xl flex flex-col items-center justify-center min-h-[400px] cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all relative overflow-hidden group">
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="Receipt preview" className="absolute inset-0 w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="p-4 bg-white/90 rounded-2xl backdrop-blur-md shadow-xl text-primary flex flex-col items-center">
                      <span className="material-symbols-outlined text-[32px] mb-1">refresh</span>
                      <span className="text-xs font-bold uppercase tracking-widest">Ganti Gambar</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-secondary text-center px-10">
                  <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[40px]">add_photo_alternate</span>
                  </div>
                  <p className="font-extrabold text-on-surface text-lg">Tarik gambar ke sini</p>
                  <p className="text-sm mt-2 leading-relaxed">atau klik untuk memilih file dari komputer kamu.</p>
                  <div className="mt-6 flex gap-2">
                    <span className="px-3 py-1 bg-neutral-100 rounded-full text-[10px] font-bold">JPG</span>
                    <span className="px-3 py-1 bg-neutral-100 rounded-full text-[10px] font-bold">PNG</span>
                    <span className="px-3 py-1 bg-neutral-100 rounded-full text-[10px] font-bold">WEBP</span>
                  </div>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              
              {isScanning && (
                <div className="absolute inset-0 bg-primary/10 overflow-hidden pointer-events-none">
                  <motion.div 
                    initial={{ top: '-10%' }}
                    animate={{ top: '110%' }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_rgba(249,115,22,0.8)] z-20"
                  />
                </div>
              )}
            </label>

            {!scanResult && (
              <button 
                disabled={!file || isScanning} 
                onClick={handleScan}
                className="w-full mt-6 py-4 bg-primary text-white font-extrabold rounded-2xl hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 h-16 text-lg"
              >
                {isScanning ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('loading')}...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">auto_awesome</span>
                    {t('scan')}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="col-span-7">
          <AnimatePresence mode="wait">
            {!scanResult ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-surface-container-lowest rounded-3xl p-12 border border-dashed border-neutral-200 h-full flex flex-col items-center justify-center text-center space-y-6"
              >
                <div className="w-24 h-24 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-300">
                  <span className="material-symbols-outlined text-[56px]">analytics</span>
                </div>
                <div>
                  <h4 className="text-xl font-extrabold text-on-surface">Menunggu Data Ekstraksi</h4>
                  <p className="text-sm text-secondary mt-2 max-w-sm mx-auto">Upload struk kamu di sebelah kiri, lalu klik 'Mulai Scan' untuk mendapatkan visualisasi data otomatis dari Gemini AI.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-neutral-100 flex flex-col h-full"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-extrabold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">fact_check</span>
                    Review Hasil Ekstraksi
                  </h3>
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-widest">Draft Verification</span>
                </div>

                <div className="flex-1 space-y-6">
                  <div className="p-5 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-green-200">
                      <span className="material-symbols-outlined text-[20px]">done_all</span>
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-green-900 leading-none">Berhasil Diekstrak!</p>
                      <p className="text-xs text-green-700 mt-1">Silakan tinjau dan lengkapi data di bawah ini sebelum disimpan.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-2 px-1">Nama Merchant / Toko</label>
                      <input 
                        type="text" 
                        value={scanResult.merchant || ''} 
                        onChange={(e) => setScanResult({...scanResult, merchant: e.target.value})} 
                        className="w-full px-5 py-3.5 bg-surface-container-low border border-neutral-200 rounded-2xl text-base font-bold text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                        placeholder="e.g. Starbucks Coffee"
                      />
                    </div>
                    
                    <div>
                      <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-2 px-1">Total Nominal</label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-secondary">Rp</span>
                        <input 
                          type="number" 
                          value={scanResult.amount || ''} 
                          onChange={(e) => setScanResult({...scanResult, amount: Number(e.target.value)})} 
                          className="w-full pl-12 pr-5 py-3.5 bg-surface-container-low border border-neutral-200 rounded-2xl text-base font-black text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-2 px-1">Tanggal Transaksi</label>
                      <input 
                        type="date" 
                        value={scanResult.date || ''} 
                        onChange={(e) => setScanResult({...scanResult, date: e.target.value})} 
                        className="w-full px-5 py-3.5 bg-surface-container-low border border-neutral-200 rounded-2xl text-sm font-semibold text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-2 px-1">Deskripsi Tambahan</label>
                      <input 
                        type="text" 
                        value={scanResult.description || ''} 
                        onChange={(e) => setScanResult({...scanResult, description: e.target.value})} 
                        className="w-full px-5 py-3.5 bg-surface-container-low border border-neutral-200 rounded-2xl text-sm font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                        placeholder="Beli apa saja hari ini?"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-1.5 px-1">Pilih Kategori <span className="text-red-500">*</span></label>
                      <select 
                        required
                        value={scanResult.categoryId} 
                        onChange={(e) => setScanResult({...scanResult, categoryId: e.target.value})} 
                        className={`w-full px-5 py-3.5 bg-surface-container-low border ${!scanResult.categoryId ? 'border-red-300 ring-2 ring-red-50/50' : 'border-neutral-200'} rounded-2xl text-sm font-bold text-on-surface appearance-none focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all`}
                      >
                        <option value="" disabled>Pilih Kategori</option>
                        {categories.map((c: any) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                      </select>
                      {!scanResult.categoryId && <p className="text-[10px] text-red-500 font-bold mt-1 px-1">Kategori wajib diisi!</p>}
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-2 px-1">Gunakan Dompet</label>
                      <select 
                        value={scanResult.walletId} 
                        onChange={(e) => setScanResult({...scanResult, walletId: e.target.value})} 
                        className="w-full px-5 py-3.5 bg-surface-container-low border border-neutral-200 rounded-2xl text-sm font-bold text-on-surface appearance-none focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      >
                        <option value="" disabled>Pilih Dompet</option>
                        {wallets.map((w: any) => (<option key={w.id} value={w.id}>{w.name}</option>))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-10">
                  <button 
                    disabled={isSaving || !scanResult.categoryId || !scanResult.walletId || !scanResult.merchant || !scanResult.amount}
                    onClick={handleSaveTransaction}
                    className="w-full py-5 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 hover:shadow-xl hover:shadow-green-100 transition-all disabled:opacity-50 flex justify-center items-center gap-3 text-lg"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t('loading')}...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined font-bold">check_circle</span> 
                        {t('confirm')} & {t('save')}
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-secondary font-bold uppercase tracking-widest mt-4">Pastikan semua data di atas sudah benar</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
