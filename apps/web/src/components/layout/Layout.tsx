import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area, offset by sidebar width */}
      <div className="ml-[260px] min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 px-10 py-8">
          {children}
        </main>
      </div>

      {/* FAB Button */}
      <button className="fixed bottom-10 right-10 flex items-center gap-3 px-8 py-4 bg-primary-container text-white rounded-full font-bold shadow-2xl shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all z-50 text-sm">
        <span className="material-symbols-outlined text-[20px]">add</span>
        <span>Tambah Transaksi</span>
      </button>
    </div>
  );
}
