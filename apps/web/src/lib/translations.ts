export const translations = {
  en: {
    // Sidebar
    dashboard: 'Dashboard',
    transactions: 'Transactions',
    wallets: 'Wallets',
    budgets: 'Budgets',
    scan: 'Scan',
    settings: 'Settings',
    help: 'Help',
    logout: 'Logout',
    // Greetings
    goodMorning: 'Good Morning',
    goodAfternoon: 'Good Afternoon',
    goodEvening: 'Good Evening',
    goodNight: 'Good Night',
    
    // Dashboard Stats
    totalBalance: 'Total Balance',
    monthlyIncome: 'Monthly Income',
    monthlyExpense: 'Monthly Expense',
    healthScore: 'Health Score',
    realTimePortfolio: 'Real-time overall portfolio',
    thisMonthEarnings: "This month's earnings",
    thisMonthSpending: "This month's spending",
    excellent: 'EXCELLENT',
    good: 'GOOD',
    needsWork: 'NEEDS WORK',
    
    // Dashboard Charts
    expenseDistribution: 'Expense Distribution',
    monthlyComparison: 'Monthly Comparison',
    balanceTrend: 'Balance Trend',
    income: 'Income',
    expense: 'Expense',
    total: 'Total',
    noData: 'No data yet, let\'s record your first transaction!',
    
    // Transactions
    searchPlaceholder: 'Search transactions...',
    allCategories: 'All Categories',
    allWallets: 'All Wallets',
    addTransaction: 'Add Transaction',
    date: 'Date',
    description: 'Description',
    category: 'Category',
    wallet: 'Wallet',
    amount: 'Amount',
    actions: 'Actions',
    previous: 'Previous',
    next: 'Next',
    
    // Settings
    profile: 'Profile',
    appearance: 'Appearance',
    language: 'Language',
    currency: 'Currency',
    dateFormat: 'Date Format',
    saveChanges: 'Save Changes',
    selectLanguage: 'Select Language',
    all: 'All',
    
    // Buttons/Misc
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    loading: 'Loading...',
    recurring: 'Recurring',
    manualEntry: 'Manual Entry',
    categories: 'Categories',
    add: 'Add',
    create: 'Create',
    exportData: 'Export Data',
    deleteAccountDesc: 'Permanently delete your account and all financial data',
    confirmDeleteAccount: 'Permanently Delete Account',
    deleteAccountWarning: 'This action cannot be undone. All your transactions, wallets, budgets, and profile data will be permanently removed from our servers.',
  },
  id: {
    // Sidebar
    dashboard: 'Dasbor',
    transactions: 'Transaksi',
    wallets: 'Dompet',
    budgets: 'Anggaran',
    scan: 'Pindai',
    settings: 'Pengaturan',
    help: 'Bantuan',
    logout: 'Keluar',
    // Greetings
    goodMorning: 'Selamat Pagi',
    goodAfternoon: 'Selamat Siang',
    goodEvening: 'Selamat Sore',
    goodNight: 'Selamat Malam',
    
    // Dashboard Stats
    totalBalance: 'Total Saldo',
    monthlyIncome: 'Pemasukan Bulan Ini',
    monthlyExpense: 'Pengeluaran Bulan Ini',
    healthScore: 'Skor Kesehatan',
    realTimePortfolio: 'Portofolio keseluruhan real-time',
    thisMonthEarnings: 'Pendapatan bulan ini',
    thisMonthSpending: 'Pengeluaran bulan ini',
    excellent: 'SANGAT BAIK',
    good: 'BAIK',
    needsWork: 'PERLU PERBAIKAN',
    
    // Dashboard Charts
    expenseDistribution: 'Distribusi Pengeluaran',
    monthlyComparison: 'Perbandingan Bulanan',
    balanceTrend: 'Tren Saldo',
    income: 'Pemasukan',
    expense: 'Pengeluaran',
    total: 'Total',
    noData: 'Belum ada data, yuk catat transaksi pertama kamu!',
    
    // Transactions
    searchPlaceholder: 'Cari transaksi...',
    allCategories: 'Semua Kategori',
    allWallets: 'Semua Dompet',
    addTransaction: 'Tambah Transaksi',
    date: 'Tanggal',
    description: 'Deskripsi',
    category: 'Kategori',
    wallet: 'Dompet',
    amount: 'Jumlah',
    actions: 'Aksi',
    previous: 'Sebelumnya',
    next: 'Berikutnya',
    
    // Settings
    profile: 'Profil',
    appearance: 'Tampilan',
    language: 'Bahasa',
    currency: 'Mata Uang',
    dateFormat: 'Format Tanggal',
    saveChanges: 'Simpan Perubahan',
    selectLanguage: 'Pilih Bahasa',
    all: 'Semua',
    
    // Buttons/Misc
    confirm: 'Konfirmasi',
    cancel: 'Batal',
    save: 'Simpan',
    edit: 'Ubah',
    delete: 'Hapus',
    loading: 'Memuat...',
    recurring: 'Rutin',
    manualEntry: 'Manual',
    categories: 'Kategori',
    add: 'Tambah',
    create: 'Buat',
    exportData: 'Ekspor Data',
    deleteAccountDesc: 'Hapus akun dan semua data keuangan Anda secara permanen',
    confirmDeleteAccount: 'Hapus Akun Permanen',
    deleteAccountWarning: 'Tindakan ini tidak dapat dibatalkan. Semua data transaksi, dompet, anggaran, dan profil Anda akan dihapus selamanya dari server kami.',
  }
};

export type Language = 'en' | 'id';
export type TranslationKey = keyof typeof translations.en;
