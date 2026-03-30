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

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    icon: 'category',
    color: 'bg-gray-500',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE' | 'BOTH',
  });

  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get('/categories');
      return res.data;
    },
  });

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || '',
        email: session.user.email || '',
      });
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
      await queryClient.invalidateQueries({ queryKey: ['session'] });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      window.location.href = '/sign-in';
    } catch (err) {
      console.error('Failed to logout', err);
      alert(t('deleteAccountFailed'));
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    const uploadData = new FormData();
    uploadData.append('image', file);

    setIsUploading(true);

    try {
      const res = await apiClient.patch('/settings/profile-picture', uploadData);

      if (res.data?.success) {
        window.location.reload();
      }
    } catch (err: any) {
      console.error('Upload failed', err);
      console.error('Upload response:', err?.response?.data);
      alert(t('uploadProfilePictureFailed'));
    } finally {
      setIsUploading(false);
      e.target.value = '';
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
        link.setAttribute(
          'download',
          `arthaflow-export-${new Date().toISOString().split('T')[0]}.${format}`
        );
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Empty file received');
      }
    } catch (err: any) {
      console.error('Failed to export', err);
      alert(t('exportFailed'));
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
      alert(t('deleteAccountFailed'));
    } finally {
      setIsProcessLoading(false);
    }
  };

  const handleResetData = async () => {
    setIsProcessLoading(true);
    try {
      await apiClient.post('/settings/reset-data');
      queryClient.invalidateQueries();
      setIsDeleteModalOpen(false);
      setDangerAction(null);
      alert(t('resetDataSuccess'));
    } catch (err) {
      console.error('Failed to reset data', err);
      alert(t('resetDataFailed'));
    } finally {
      setIsProcessLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/categories', categoryFormData);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCategoryModalOpen(false);
      setCategoryFormData({
        name: '',
        icon: 'category',
        color: 'bg-gray-500',
        type: 'EXPENSE',
      });
    } catch (err) {
      console.error('Failed to create category', err);
      alert(t('createCategoryFailed'));
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    try {
      await apiClient.patch(`/categories/${editingCategory.id}`, categoryFormData);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsEditCategoryModalOpen(false);
      setEditingCategory(null);
      setCategoryFormData({
        name: '',
        icon: 'category',
        color: 'bg-gray-500',
        type: 'EXPENSE',
      });
    } catch (err) {
      console.error('Failed to update category', err);
      alert(t('updateCategoryFailed'));
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm(t('deleteCategoryConfirm'))) return;
    try {
      await apiClient.delete(`/categories/${id}`);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    } catch (err) {
      console.error('Failed to delete category', err);
    }
  };

  const icons = [
    'restaurant',
    'directions_car',
    'shopping_bag',
    'memory',
    'payments',
    'local_hospital',
    'fitness_center',
    'school',
    'flight',
    'movie',
    'home',
    'work',
    'star',
    'favorite',
    'category',
  ];

  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-orange-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-gray-500',
  ];

  const profileImageSrc = session?.user?.image
    ? session.user.image.startsWith('http')
      ? session.user.image
      : `${apiClient.defaults.baseURL?.replace('/api', '')}${session.user.image}`
    : '';

  return (
    <div className="space-y-5 lg:space-y-8">
      <div>
        <p className="text-xs text-secondary font-medium mb-1">
          {t('dashboard')} / <span className="text-on-surface">{t('settings')}</span>
        </p>
        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
          {t('settings')}
        </h1>
        <p className="text-sm text-secondary mt-1">{t('settingsDescription')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl p-5 lg:p-7 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <h3 className="text-lg font-extrabold text-on-surface">{t('profile')}</h3>

            {isEditing ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-sm font-bold text-secondary hover:underline"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="text-sm font-bold text-primary hover:underline"
                >
                  {isSaving ? t('loading') : t('saveChanges')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="self-start sm:self-auto text-sm font-bold text-primary hover:underline"
              >
                {t('edit')} {t('profile')}
              </button>
            )}
          </div>

          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <div className="relative mx-auto md:mx-0">
              <div className="h-24 w-24 rounded-2xl border-2 border-white bg-gradient-to-br from-primary/10 to-primary/20 shadow-sm overflow-hidden flex items-center justify-center">
                {isUploading ? (
                  <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                ) : profileImageSrc ? (
                  <img
                    src={profileImageSrc}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-primary text-[40px]">
                    person
                  </span>
                )}
              </div>

              <label className="absolute -bottom-1 -right-1 cursor-pointer rounded-full bg-primary p-1.5 text-white shadow-lg transition-transform hover:scale-110 active:scale-95">
                <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  disabled={isUploading}
                />
              </label>
            </div>

            <div className="flex-1 w-full space-y-4">
              <div>
                <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-widest text-secondary">
                  {t('fullName')}
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full min-h-[52px] rounded-xl border border-neutral-200 bg-surface-container-low px-4 py-3 text-base font-semibold text-on-surface outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-70"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-widest text-secondary">
                  {t('emailAddress')}
                </label>
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="w-full min-h-[52px] rounded-xl border border-neutral-200 bg-surface-container-low px-4 py-3 text-base font-semibold text-on-surface disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-5 lg:p-7 shadow-sm flex flex-col gap-5">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <span className="material-symbols-outlined text-[20px]">payments</span>
              </div>
              <h3 className="text-lg font-extrabold text-on-surface">{t('currency')}</h3>
            </div>

            <p className="mb-4 text-sm text-secondary">{t('currencyDescription')}</p>

            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="w-full min-h-[52px] rounded-xl border border-neutral-200 bg-surface-container-low px-4 py-3 text-base font-semibold text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="IDR">IDR – Rupiah Indonesia</option>
              <option value="USD">USD – US Dollar</option>
              <option value="EUR">EUR – Euro</option>
              <option value="SGD">SGD – Singapore Dollar</option>
              <option value="JPY">JPY – Japanese Yen</option>
              <option value="MYR">MYR – Malaysian Ringgit</option>
            </select>
          </div>

          <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
              {t('previewFormat')}
            </span>
            <p className="mt-1 text-2xl font-black text-primary">
              {formatCurrency(1250000)}
            </p>
          </div>

          <div className="border-t border-neutral-100 pt-5">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-black text-red-600 transition-all hover:bg-red-100 active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              {t('logout')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl p-5 lg:p-7 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <div className="rounded-lg bg-secondary/10 p-2 text-secondary">
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </div>
            <h3 className="text-lg font-extrabold text-on-surface">{t('appearance')}</h3>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-bold text-on-surface">{t('categories')}</h4>
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="rounded-lg bg-primary/10 p-1.5 text-primary transition-colors hover:bg-primary/20"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>

              <div className="max-h-[320px] space-y-2 overflow-y-auto pr-2">
                {isCategoriesLoading ? (
                  <p className="text-sm text-secondary">{t('loading')}</p>
                ) : categories.length === 0 ? (
                  <p className="text-sm italic text-secondary">{t('noData')}</p>
                ) : (
                  categories.map((cat: any) => (
                    <div
                      key={cat.id}
                      className="group flex items-center gap-3 rounded-xl bg-surface-container-low px-4 py-3 transition-all hover:shadow-md"
                    >
                      <div className={`h-3 w-3 rounded-full ${cat.color} shadow-sm`} />
                      <span className="material-symbols-outlined text-[18px] text-secondary">
                        {cat.icon}
                      </span>
                      <span className="flex-1 text-sm font-semibold text-on-surface">
                        {cat.name}
                      </span>

                      {!cat.isDefault && (
                        <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingCategory(cat);
                              setCategoryFormData({
                                name: cat.name,
                                icon: cat.icon,
                                color: cat.color,
                                type: cat.type,
                              });
                              setIsEditCategoryModalOpen(true);
                            }}
                            className="rounded p-1.5 text-secondary hover:bg-neutral-200"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="rounded p-1.5 text-red-500 hover:bg-red-100"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="mb-3 text-sm font-bold text-on-surface">{t('language')}</h4>
                <div className="group relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary transition-colors group-focus-within:text-primary">
                    <span className="material-symbols-outlined text-[20px]">language</span>
                  </div>

                  <select
                    value={language}
                    onChange={(e) => {
                      const newLang = e.target.value as any;
                      setLanguage(newLang);
                      updatePreference('language', newLang);
                    }}
                    className="w-full min-h-[52px] appearance-none rounded-xl border border-neutral-200 bg-surface-container-low pl-12 pr-10 py-3 text-base lg:text-sm font-bold text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="id">Bahasa Indonesia</option>
                    <option value="en">English (United States)</option>
                  </select>

                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-secondary">
                    <span className="material-symbols-outlined text-[18px]">expand_more</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-bold text-on-surface">{t('dateFormat')}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setDateFormat(fmt)}
                      className={`rounded-xl py-3 text-[11px] font-black tracking-tight transition-all ${
                        dateFormat === fmt
                          ? 'bg-primary text-white shadow-lg shadow-primary/20'
                          : 'border border-neutral-200 bg-surface-container-low text-secondary hover:bg-neutral-100'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-neutral-100 pt-4">
                <button
                  onClick={() => setIsHelpOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary/10 px-4 py-3 text-sm font-black text-secondary transition-all hover:bg-secondary/20 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[20px]">help_outline</span>
                  {t('help')}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-5 lg:p-7 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <span className="material-symbols-outlined text-[20px]">cloud_download</span>
            </div>
            <h3 className="text-lg font-extrabold text-on-surface">{t('exportData')}</h3>
          </div>

          <p className="mb-6 text-sm leading-relaxed text-secondary">
            {t('exportDescription')}
          </p>

          <div className="space-y-3">
            <button
              onClick={() => handleExport('pdf')}
              disabled={isExporting !== null}
              className="flex w-full items-center gap-4 rounded-xl bg-red-800 px-5 py-4 text-white shadow-md transition-all hover:bg-red-700 active:scale-95 disabled:opacity-50"
            >
              <div className="rounded-lg bg-red-600 p-2">
                <span className="material-symbols-outlined text-[20px] text-white">
                  picture_as_pdf
                </span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-black">
                  {isExporting === 'pdf' ? t('generating') : t('exportPdf')}
                </p>
                <p className="text-[10px] font-bold text-red-200 opacity-80">
                  {t('comprehensiveReport')}
                </p>
              </div>
            </button>

            <button
              onClick={() => handleExport('csv')}
              disabled={isExporting !== null}
              className="flex w-full items-center gap-4 rounded-xl bg-green-800 px-5 py-4 text-white shadow-md transition-all hover:bg-green-700 active:scale-95 disabled:opacity-50"
            >
              <div className="rounded-lg bg-green-600 p-2">
                <span className="material-symbols-outlined text-[20px] text-white">
                  table_chart
                </span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-black">
                  {isExporting === 'csv' ? t('generating') : t('exportCsv')}
                </p>
                <p className="text-[10px] font-bold text-green-200 opacity-80">
                  {t('rawDataExcel')}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6 rounded-2xl border border-red-100 bg-red-50 p-5 lg:p-8">
        <div className="flex flex-col gap-4 border-b border-red-200/50 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="text-base font-black uppercase tracking-tight text-red-600">
              {t('resetFinancialData')}
            </h4>
            <p className="mt-1 text-xs font-semibold text-red-500">
              {t('resetFinancialDataDesc')}
            </p>
          </div>

          <button
            onClick={() => {
              setDangerAction('RESET');
              setIsDeleteModalOpen(true);
            }}
            className="w-full rounded-xl border-2 border-red-200 bg-white px-8 py-3 text-sm font-black text-red-600 transition-all hover:bg-red-50 active:scale-95 md:w-auto"
          >
            {t('resetData')}
          </button>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="text-base font-black uppercase tracking-tight text-red-600">
              {t('deleteAccount')}
            </h4>
            <p className="mt-1 text-xs font-semibold text-red-500">
              {t('deleteAccountDesc')}
            </p>
          </div>

          <button
            onClick={() => {
              setDangerAction('DELETE');
              setIsDeleteModalOpen(true);
            }}
            className="w-full rounded-xl bg-red-600 px-8 py-3 text-sm font-black text-white shadow-lg shadow-red-200 transition-all hover:bg-red-700 active:scale-95 md:w-auto"
          >
            {t('delete')} {t('profile')}
          </button>
        </div>
      </div>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm p-4">
          <div className="flex min-h-full items-center justify-center">
            <div className="w-full max-w-[420px] rounded-2xl border-t-4 border-red-600 bg-surface-container-lowest p-6 lg:p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
              <h2 className="mb-4 text-xl font-black text-red-600">
                {dangerAction === 'RESET'
                  ? t('confirmResetData')
                  : t('confirmDeleteAccount')}
                ?
              </h2>

              <p className="mb-4 text-sm font-medium leading-relaxed text-secondary">
                {dangerAction === 'RESET'
                  ? t('resetFinancialDataDesc')
                  : t('deleteAccountWarning')}
              </p>

              <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4">
                <p className="flex items-center gap-2 text-xs font-black text-red-600">
                  <span className="material-symbols-outlined text-[18px]">warning</span>
                  {t('permanentActionWarning')}
                </p>
              </div>

              {dangerAction === 'DELETE' && (
                <div className="mb-6">
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-secondary">
                    {t('typeDeleteToConfirm')}
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={language === 'id' ? 'HAPUS' : 'DELETE'}
                    className="w-full rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-base font-bold text-red-600 outline-none placeholder:text-red-200 focus:ring-2 focus:ring-red-200"
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
                  className="rounded-xl bg-neutral-100 py-3.5 text-sm font-black text-secondary transition-colors hover:bg-neutral-200"
                >
                  {t('cancel')}
                </button>

                <button
                  disabled={
                    isProcessLoading ||
                    (dangerAction === 'DELETE' &&
                      confirmText !== (language === 'id' ? 'HAPUS' : 'DELETE'))
                  }
                  onClick={dangerAction === 'RESET' ? handleResetData : handleDeleteAccount}
                  className="rounded-xl bg-red-600 py-3.5 text-sm font-black text-white shadow-xl shadow-red-100 transition-all hover:bg-red-700 disabled:grayscale disabled:opacity-50"
                >
                  {isProcessLoading
                    ? t('processing')
                    : dangerAction === 'RESET'
                    ? t('resetData')
                    : t('deleteAccount')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm p-4">
          <div className="flex min-h-full items-center justify-center">
            <div className="w-full max-w-[450px] rounded-2xl bg-surface-container-lowest p-6 lg:p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
              <h2 className="mb-6 text-xl font-black text-on-surface">
                {t('add')} {t('category')}
              </h2>

              <form onSubmit={handleCreateCategory} className="space-y-5">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-secondary">
                    {t('categoryName')}
                  </label>
                  <input
                    required
                    type="text"
                    value={categoryFormData.name}
                    onChange={(e) =>
                      setCategoryFormData({ ...categoryFormData, name: e.target.value })
                    }
                    placeholder="e.g. Alat Lab"
                    className="w-full rounded-xl border border-neutral-200 bg-surface-container-low px-4 py-3.5 text-base font-bold outline-none transition-all focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-secondary">
                      {t('type')}
                    </label>
                    <select
                      value={categoryFormData.type}
                      onChange={(e) =>
                        setCategoryFormData({
                          ...categoryFormData,
                          type: e.target.value as any,
                        })
                      }
                      className="w-full rounded-xl border border-neutral-200 bg-surface-container-low px-4 py-3.5 text-base font-bold outline-none transition-all focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="EXPENSE">{t('expenseType')}</option>
                      <option value="INCOME">{t('incomeType')}</option>
                      <option value="BOTH">{t('bothType')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-secondary">
                      {t('color')}
                    </label>
                    <div className="flex flex-wrap gap-2 rounded-xl border border-neutral-200 bg-surface-container-low p-2.5">
                      {colors.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCategoryFormData({ ...categoryFormData, color: c })}
                          className={`h-6 w-6 rounded-full transition-all ${c} ${
                            categoryFormData.color === c
                              ? 'scale-110 ring-2 ring-primary ring-offset-2 shadow-lg'
                              : 'hover:scale-110'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-secondary">
                    {t('icon')}
                  </label>
                  <div className="flex max-h-[140px] flex-wrap gap-2 overflow-y-auto rounded-xl border border-neutral-200 bg-surface-container-low p-3">
                    {icons.map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCategoryFormData({ ...categoryFormData, icon: i })}
                        className={`rounded-xl p-2.5 text-secondary transition-all hover:bg-neutral-200 ${
                          categoryFormData.icon === i ? 'bg-primary text-white shadow-lg' : ''
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">{i}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="w-full rounded-xl bg-neutral-100 py-3.5 text-sm font-black text-secondary transition-colors hover:bg-neutral-200"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={!categoryFormData.name.trim()}
                    className="w-full rounded-xl bg-primary py-3.5 text-sm font-black text-white shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {t('create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isEditCategoryModalOpen && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm p-4">
          <div className="flex min-h-full items-center justify-center">
            <div className="w-full max-w-[450px] rounded-2xl bg-surface-container-lowest p-6 lg:p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
              <h2 className="mb-6 text-xl font-black text-on-surface">
                {t('edit')} {t('category')}
              </h2>

              <form onSubmit={handleUpdateCategory} className="space-y-5">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-secondary">
                    {t('categoryName')}
                  </label>
                  <input
                    required
                    type="text"
                    value={categoryFormData.name}
                    onChange={(e) =>
                      setCategoryFormData({ ...categoryFormData, name: e.target.value })
                    }
                    placeholder="e.g. Alat Lab"
                    className="w-full rounded-xl border border-neutral-200 bg-surface-container-low px-4 py-3.5 text-base font-bold outline-none transition-all focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-secondary">
                      {t('type')}
                    </label>
                    <select
                      value={categoryFormData.type}
                      onChange={(e) =>
                        setCategoryFormData({
                          ...categoryFormData,
                          type: e.target.value as any,
                        })
                      }
                      className="w-full rounded-xl border border-neutral-200 bg-surface-container-low px-4 py-3.5 text-base font-bold outline-none transition-all focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="EXPENSE">{t('expenseType')}</option>
                      <option value="INCOME">{t('incomeType')}</option>
                      <option value="BOTH">{t('bothType')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-secondary">
                      {t('color')}
                    </label>
                    <div className="flex flex-wrap gap-2 rounded-xl border border-neutral-200 bg-surface-container-low p-2.5">
                      {colors.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCategoryFormData({ ...categoryFormData, color: c })}
                          className={`h-6 w-6 rounded-full transition-all ${c} ${
                            categoryFormData.color === c
                              ? 'scale-110 ring-2 ring-primary ring-offset-2 shadow-lg'
                              : 'hover:scale-110'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-secondary">
                    {t('icon')}
                  </label>
                  <div className="flex max-h-[140px] flex-wrap gap-2 overflow-y-auto rounded-xl border border-neutral-200 bg-surface-container-low p-3">
                    {icons.map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCategoryFormData({ ...categoryFormData, icon: i })}
                        className={`rounded-xl p-2.5 text-secondary transition-all hover:bg-neutral-200 ${
                          categoryFormData.icon === i ? 'bg-primary text-white shadow-lg' : ''
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">{i}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditCategoryModalOpen(false);
                      setEditingCategory(null);
                    }}
                    className="w-full rounded-xl bg-neutral-100 py-3.5 text-sm font-black text-secondary transition-colors hover:bg-neutral-200"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={!categoryFormData.name.trim()}
                    className="w-full rounded-xl bg-primary py-3.5 text-sm font-black text-white shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {t('saveChanges')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}