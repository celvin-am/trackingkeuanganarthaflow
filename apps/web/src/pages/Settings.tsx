import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api-client';
import { useSession, authClient } from '../lib/auth';
import { useSettings } from '../lib/SettingsContext';
import { useLanguage } from '../lib/LanguageContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HelpModal } from '../components/common/HelpModal';

export function Settings() {
  const { data: session } = useSession();
  const { currency, setCurrency, formatCurrency, dateFormat, setDateFormat } = useSettings();
  const { language, setLanguage, t } = useLanguage();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [dangerAction, setDangerAction] = useState<'RESET' | 'DELETE' | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [isProcessLoading, setIsProcessLoading] = useState(false);

  // Category Management State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    icon: 'category',
    color: 'bg-gray-500',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE' | 'BOTH'
  });

  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get('/categories');
      return res.data;
    }
  });

  useEffect(() => {
    if (session?.user) {
      setFormData({ name: session.user.name || '', email: session.user.email || '' });
    }
  }, [session]);

  const updatePreference = async (key: string, value: string) => {
    try {
      await apiClient.patch('/settings', { [key]: value });
    } catch (err) {
      console.error('Failed to update preference', err);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await authClient.updateUser({
        name: formData.name,
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['session'] });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    
    const file = e.target.files[0];
    const uploadData = new FormData();
    uploadData.append('image', file);
    
    setIsUploading(true);
    try {
      const res = await apiClient.patch('/settings/profile-picture', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        // Invalidate session query to trigger reactivity in Header and other components
        await queryClient.invalidateQueries({ queryKey: ['session'] });
        // Optional: Trigger authClient getSession to refresh internal state
        await authClient.getSession();
      }
    } catch (err) {
      console.error('Upload failed', err);
      alert('Gagal mengunggah foto profil.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(format);
    try {
      const res = await apiClient.get(`/export/${format}`, { responseType: 'blob' });
      if (res.data.size > 0) {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `arthaflow-export-${new Date().toISOString().split('T')[0]}.${format}`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Empty file received');
      }
    } catch (err: any) {
      console.error('Failed to export', err);
      alert('Gagal mengekspor data. Silakan coba lagi.');
    } finally {
      setIsExporting(null);
    }
  };

  const handleDeleteAccount = async () => {
    setIsProcessLoading(true);
    try {
      await apiClient.delete('/settings/account');
      await authClient.signOut();
      window.location.href = '/sign-in';
    } catch (err) {
      console.error('Failed to delete account', err);
      alert('Gagal menghapus akun.');
    } finally {
      setIsProcessLoading(false);
    }
  };

  const handleResetData = async () => {
    setIsProcessLoading(true);
    try {
      await apiClient.post('/settings/reset-data');
      queryClient.invalidateQueries(); // Clear everything
      setIsDeleteModalOpen(false);
      setDangerAction(null);
      alert('Data keuangan Anda telah di-reset.');
    } catch (err) {
      console.error('Failed to reset data', err);
      alert('Gagal me-reset data.');
    } finally {
      setIsProcessLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Sedang membuat kategori...', categoryFormData);
    try {
      await apiClient.post('/categories', categoryFormData);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCategoryModalOpen(false);
      setCategoryFormData({ name: '', icon: 'category', color: 'bg-gray-500', type: 'EXPENSE' });
      console.log('Kategori berhasil dibuat!');
    } catch (err) {
      console.error('Failed to create category', err);
      alert('Gagal membuat kategori. Silakan cek koneksi backend.');
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    console.log('Sedang mengupdate kategori...', categoryFormData);
    try {
      await apiClient.patch(`/categories/${editingCategory.id}`, categoryFormData);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsEditCategoryModalOpen(false);
      setEditingCategory(null);
      setCategoryFormData({ name: '', icon: 'category', color: 'bg-gray-500', type: 'EXPENSE' });
      console.log('Kategori berhasil diupdate!');
    } catch (err) {
      console.error('Failed to update category', err);
      alert('Gagal mengupdate kategori.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await apiClient.delete(`/categories/${id}`);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    } catch (err) {
      console.error('Failed to delete category', err);
    }
  };

  const icons = ['restaurant', 'directions_car', 'shopping_bag', 'memory', 'payments', 'local_hospital', 'fitness_center', 'school', 'flight', 'movie', 'home', 'work', 'star', 'favorite', 'category'];
  const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-indigo-500', 'bg-teal-500', 'bg-cyan-500', 'bg-gray-500'];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <p className="text-xs text-secondary font-medium mb-1">{t('dashboard')} / <span className="text-on-surface">{t('settings')}</span></p>
        <h1 className="text-3xl font-extrabold tracking-tight">{t('settings')}</h1>
        <p className="text-sm text-secondary mt-1">Manage your personal preferences and account configuration.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Section */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-7 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-extrabold text-on-surface">{t('profile')}</h3>
            {isEditing ? (
              <div className="flex gap-4">
                <button onClick={() => setIsEditing(false)} className="text-sm font-bold text-secondary hover:underline">{t('cancel')}</button>
                <button onClick={handleSaveProfile} disabled={isSaving} className="text-sm font-bold text-primary hover:underline">{isSaving ? t('loading') : t('saveChanges')}</button>
              </div>
            ) : (
              <button onClick={() => setIsEditing(true)} className="text-sm font-bold text-primary hover:underline">{t('edit')} {t('profile')}</button>
            )}
          </div>
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                {isUploading ? (
                  <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                ) : session?.user?.image ? (
                  <img 
                    src={session.user.image.startsWith('http') ? session.user.image : `${apiClient.defaults.baseURL?.replace('/api', '')}${session.user.image}?t=${Date.now()}`} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="material-symbols-outlined text-primary text-[40px]">person</span>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 p-1.5 bg-primary text-white rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform active:scale-95">
                <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleProfilePictureUpload} disabled={isUploading} />
              </label>
            </div>
            <div className="flex-1 w-full space-y-4">
              <div>
                <label className="text-[10px] font-extrabold text-secondary uppercase tracking-widest block mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  disabled={!isEditing}
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-neutral-200 rounded-xl text-sm font-semibold text-on-surface disabled:opacity-70 focus:ring-2 focus:ring-primary/20 outline-none" 
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold text-secondary uppercase tracking-widest block mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  disabled={true}
                  value={formData.email}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-neutral-200 rounded-xl text-sm font-semibold text-on-surface disabled:opacity-50" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Currency Section */}
        <div className="bg-surface-container-lowest rounded-xl p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <span className="material-symbols-outlined text-[20px]">payments</span>
              </div>
              <h3 className="text-lg font-extrabold text-on-surface">{t('currency')}</h3>
            </div>
            <p className="text-xs text-secondary mb-4">
              Choose your primary currency for financial reporting and dashboard displays.
            </p>
            <select 
              value={currency} 
              onChange={e => setCurrency(e.target.value as any)}
              className="w-full px-4 py-3 bg-surface-container-low border border-neutral-200 rounded-xl text-sm font-semibold text-on-surface appearance-none mb-4 outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="IDR">IDR – Rupiah Indonesia</option>
              <option value="USD">USD – US Dollar</option>
              <option value="EUR">EUR – Euro</option>
              <option value="SGD">SGD – Singapore Dollar</option>
              <option value="JPY">JPY – Japanese Yen</option>
              <option value="MYR">MYR – Malaysian Ringgit</option>
            </select>
          </div>
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Preview Format</span>
            <p className="text-2xl font-black text-primary mt-1">{formatCurrency(1250000)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appearance & Preferences Section */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-7 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </div>
            <h3 className="text-lg font-extrabold text-on-surface">{t('appearance')}</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Categories Management */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-on-surface">{t('categories')}</h4>
                <button 
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {isCategoriesLoading ? (
                  <p className="text-xs text-secondary">{t('loading')}</p>
                ) : categories.length === 0 ? (
                  <p className="text-xs text-secondary italic">{t('noData')}</p>
                ) : categories.map((cat: any) => (
                  <div key={cat.id} className="flex items-center gap-3 px-4 py-3 bg-surface-container-low rounded-xl group hover:shadow-md transition-all">
                    <div className={`w-3 h-3 rounded-full ${cat.color} shadow-sm`} />
                    <span className="material-symbols-outlined text-[18px] text-secondary">{cat.icon}</span>
                    <span className="text-sm font-semibold text-on-surface flex-1">{cat.name}</span>
                    {!cat.isDefault && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setEditingCategory(cat);
                            setCategoryFormData({
                              name: cat.name,
                              icon: cat.icon,
                              color: cat.color,
                              type: cat.type
                            });
                            setIsEditCategoryModalOpen(true);
                          }}
                          className="p-1.5 hover:bg-neutral-200 rounded text-secondary"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1.5 hover:bg-red-100 rounded text-red-500"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Internationalization */}
            <div className="space-y-6">
              {/* Language Switcher */}
              <div>
                <h4 className="text-sm font-bold text-on-surface mb-3">{t('language')}</h4>
                <div className="relative group">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary transition-colors">
                     <span className="material-symbols-outlined text-[20px]">language</span>
                   </div>
                   <select 
                    value={language}
                    onChange={(e) => {
                      const newLang = e.target.value as any;
                      setLanguage(newLang);
                      updatePreference('language', newLang);
                    }}
                    className="w-full pl-12 pr-4 py-3 bg-surface-container-low border border-neutral-200 rounded-xl text-sm font-bold text-on-surface appearance-none outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                   >
                    <option value="id">Bahasa Indonesia</option>
                    <option value="en">English (United States)</option>
                   </select>
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">
                     <span className="material-symbols-outlined text-[18px]">expand_more</span>
                   </div>
                </div>
              </div>

              {/* Date Format */}
              <div>
                <h4 className="text-sm font-bold text-on-surface mb-3">{t('dateFormat')}</h4>
                <div className="grid grid-cols-3 gap-2">
                  {(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] as const).map(fmt => (
                    <button 
                      key={fmt}
                      onClick={() => setDateFormat(fmt)}
                      className={`py-2.5 rounded-xl text-[10px] font-black tracking-tighter transition-all ${dateFormat === fmt ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface-container-low border border-neutral-200 text-secondary hover:bg-neutral-100'}`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Help Button */}
              <div className="pt-4 border-t border-neutral-100">
                 <button 
                  onClick={() => setIsHelpOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-secondary/10 text-secondary rounded-xl font-black text-sm hover:bg-secondary/20 transition-all active:scale-95"
                 >
                   <span className="material-symbols-outlined text-[20px]">help_outline</span>
                   {t('help')}
                 </button>
              </div>
            </div>
          </div>
        </div>

        {/* Export Section */}
        <div className="bg-surface-container-lowest rounded-xl p-7 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <span className="material-symbols-outlined text-[20px]">cloud_download</span>
            </div>
            <h3 className="text-lg font-extrabold text-on-surface">{t('exportData')}</h3>
          </div>
          <p className="text-xs text-secondary mb-6 leading-relaxed">Download your complete transaction history securely for external analysis or tax reporting.</p>
          <div className="space-y-3">
            <button 
              onClick={() => handleExport('pdf')}
              disabled={isExporting !== null}
              className="w-full flex items-center gap-4 px-5 py-4 bg-red-800 text-white rounded-xl hover:bg-red-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <div className="p-2 bg-red-600 rounded-lg">
                <span className="material-symbols-outlined text-white text-[20px]">picture_as_pdf</span>
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-black">{isExporting === 'pdf' ? 'Generating...' : 'Export PDF'}</p>
                <p className="text-[10px] text-red-200 opacity-80 font-bold">Comprehensive Report</p>
              </div>
            </button>
            <button 
              onClick={() => handleExport('csv')}
              disabled={isExporting !== null}
              className="w-full flex items-center gap-4 px-5 py-4 bg-green-800 text-white rounded-xl hover:bg-green-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <div className="p-2 bg-green-600 rounded-lg">
                <span className="material-symbols-outlined text-white text-[20px]">table_chart</span>
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-black">{isExporting === 'csv' ? 'Generating...' : 'Export CSV'}</p>
                <p className="text-[10px] text-green-200 opacity-80 font-bold">Raw Data (Excel)</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 rounded-2xl p-8 border border-red-100 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-red-200/50 pb-6">
          <div>
            <h4 className="text-base font-black text-red-600 uppercase tracking-tight">Reset Financial Data</h4>
            <p className="text-xs text-red-500 font-semibold mt-1">Hapus semua transaksi, budget, dan dompet. Akun Anda akan tetap aktif.</p>
          </div>
          <button 
            onClick={() => {
              setDangerAction('RESET');
              setIsDeleteModalOpen(true);
            }}
            className="w-full md:w-auto px-8 py-3 bg-white border-2 border-red-200 text-red-600 rounded-xl font-black text-sm hover:bg-red-50 transition-all active:scale-95"
          >
            Reset Data
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-black text-red-600 uppercase tracking-tight">Delete Account</h4>
            <p className="text-xs text-red-500 font-semibold mt-1">{t('deleteAccountDesc')}</p>
          </div>
          <button 
            onClick={() => {
              setDangerAction('DELETE');
              setIsDeleteModalOpen(true);
            }}
            className="w-full md:w-auto px-8 py-3 bg-red-600 text-white rounded-xl font-black text-sm hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-95"
          >
            {t('delete')} {t('profile')}
          </button>
        </div>
      </div>

      {/* Modals */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest p-8 rounded-2xl w-full max-w-[420px] shadow-2xl border-t-4 border-red-600 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-black text-red-600 mb-4">
              {dangerAction === 'RESET' ? 'Konfirmasi Reset Data' : t('confirmDeleteAccount')}?
            </h2>
            
            <p className="text-sm text-secondary mb-4 leading-relaxed font-medium">
              {dangerAction === 'RESET' 
                ? 'Seluruh riwayat transaksi, budget, dan dompet Anda akan dihapus secara permanen dari server ArthaFlow Finance.' 
                : t('deleteAccountWarning')
              }
            </p>

            <div className="p-4 bg-red-50 rounded-xl border border-red-100 mb-6">
              <p className="text-xs text-red-600 font-black flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                Tindakan ini permanen dan tidak dapat dibatalkan.
              </p>
            </div>

            {dangerAction === 'DELETE' && (
              <div className="mb-6">
                <label className="text-[10px] font-black text-secondary uppercase tracking-widest block mb-2">
                  Ketik "HAPUS" untuk konfirmasi
                </label>
                <input 
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="HAPUS"
                  className="w-full px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm font-bold text-red-600 focus:ring-2 focus:ring-red-200 outline-none placeholder:text-red-200"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDangerAction(null);
                  setConfirmText('');
                }} 
                className="py-3.5 bg-neutral-100 font-black rounded-xl text-sm text-secondary hover:bg-neutral-200 transition-colors"
                >Batal</button>
              <button 
                disabled={isProcessLoading || (dangerAction === 'DELETE' && confirmText !== 'HAPUS')}
                onClick={dangerAction === 'RESET' ? handleResetData : handleDeleteAccount} 
                className="py-3.5 bg-red-600 text-white font-black rounded-xl text-sm hover:bg-red-700 shadow-xl shadow-red-100 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  {isProcessLoading ? 'Memproses...' : (dangerAction === 'RESET' ? 'Reset Data' : 'Hapus Akun')}
                </button>
            </div>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest p-8 rounded-2xl w-full max-w-[450px] shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-black mb-6 text-on-surface">{t('add')} {t('category')}</h2>
            <form onSubmit={handleCreateCategory} className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-secondary uppercase tracking-widest block mb-2">Category Name</label>
                <input 
                  required
                  type="text" 
                  value={categoryFormData.name}
                  onChange={e => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  placeholder="e.g. Alat Lab" 
                  className="w-full px-4 py-3.5 bg-surface-container-low border border-neutral-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-secondary uppercase tracking-widest block mb-2">Type</label>
                  <select 
                    value={categoryFormData.type}
                    onChange={e => setCategoryFormData({ ...categoryFormData, type: e.target.value as any })}
                    className="w-full px-4 py-3.5 bg-surface-container-low border border-neutral-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                    <option value="BOTH">Both</option>
                  </select>
                </div>
                <div>
                   <label className="text-[10px] font-black text-secondary uppercase tracking-widest block mb-2">Color</label>
                   <div className="flex flex-wrap gap-2 p-2.5 bg-surface-container-low border border-neutral-200 rounded-xl">
                      {colors.map(c => (
                        <button 
                          key={c}
                          type="button"
                          onClick={() => setCategoryFormData({ ...categoryFormData, color: c })}
                          className={`w-6 h-6 rounded-full ${c} ${categoryFormData.color === c ? 'ring-2 ring-primary ring-offset-2 scale-110 shadow-lg' : 'hover:scale-110'} transition-all`}
                        />
                      ))}
                   </div>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-secondary uppercase tracking-widest block mb-2">Icon</label>
                <div className="flex flex-wrap gap-2 p-3 bg-surface-container-low border border-neutral-200 rounded-xl max-h-[140px] overflow-y-auto custom-scrollbar">
                  {icons.map(i => (
                    <button 
                      key={i}
                      type="button"
                      onClick={() => setCategoryFormData({ ...categoryFormData, icon: i })}
                      className={`p-2.5 rounded-xl hover:bg-neutral-200 text-secondary transition-all ${categoryFormData.icon === i ? 'bg-primary text-white shadow-lg' : ''}`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{i}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button 
                  type="button" 
                  onClick={() => setIsCategoryModalOpen(false)} 
                  className="flex-1 py-3.5 bg-neutral-100 font-black rounded-xl text-sm text-secondary hover:bg-neutral-200 transition-colors"
                >{t('cancel')}</button>
                <button type="submit" disabled={!categoryFormData.name.trim()} className="flex-1 py-3.5 bg-primary text-white font-black rounded-xl text-sm shadow-xl shadow-primary/20 disabled:opacity-50 transition-all active:scale-95">{t('create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest p-8 rounded-2xl w-full max-w-[450px] shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-black mb-6 text-on-surface">{t('edit')} {t('category')}</h2>
            <form onSubmit={handleUpdateCategory} className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-secondary uppercase tracking-widest block mb-2">Category Name</label>
                <input 
                  required
                  type="text" 
                  value={categoryFormData.name}
                  onChange={e => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  placeholder="e.g. Alat Lab" 
                  className="w-full px-4 py-3.5 bg-surface-container-low border border-neutral-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-secondary uppercase tracking-widest block mb-2">Type</label>
                  <select 
                    value={categoryFormData.type}
                    onChange={e => setCategoryFormData({ ...categoryFormData, type: e.target.value as any })}
                    className="w-full px-4 py-3.5 bg-surface-container-low border border-neutral-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                    <option value="BOTH">Both</option>
                  </select>
                </div>
                <div>
                   <label className="text-[10px] font-black text-secondary uppercase tracking-widest block mb-2">Color</label>
                   <div className="flex flex-wrap gap-2 p-2.5 bg-surface-container-low border border-neutral-200 rounded-xl">
                      {colors.map(c => (
                        <button 
                          key={c}
                          type="button"
                          onClick={() => setCategoryFormData({ ...categoryFormData, color: c })}
                          className={`w-6 h-6 rounded-full ${c} ${categoryFormData.color === c ? 'ring-2 ring-primary ring-offset-2 scale-110 shadow-lg' : 'hover:scale-110'} transition-all`}
                        />
                      ))}
                   </div>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-secondary uppercase tracking-widest block mb-2">Icon</label>
                <div className="flex flex-wrap gap-2 p-3 bg-surface-container-low border border-neutral-200 rounded-xl max-h-[140px] overflow-y-auto custom-scrollbar">
                  {icons.map(i => (
                    <button 
                      key={i}
                      type="button"
                      onClick={() => setCategoryFormData({ ...categoryFormData, icon: i })}
                      className={`p-2.5 rounded-xl hover:bg-neutral-200 text-secondary transition-all ${categoryFormData.icon === i ? 'bg-primary text-white shadow-lg' : ''}`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{i}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsEditCategoryModalOpen(false);
                    setEditingCategory(null);
                  }} 
                  className="flex-1 py-3.5 bg-neutral-100 font-black rounded-xl text-sm text-secondary hover:bg-neutral-200 transition-colors"
                >{t('cancel')}</button>
                <button type="submit" disabled={!categoryFormData.name.trim()} className="flex-1 py-3.5 bg-primary text-white font-black rounded-xl text-sm shadow-xl shadow-primary/20 disabled:opacity-50 transition-all active:scale-95">{t('saveChanges')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
