import { 
  Github, 
  Linkedin, 
  LayoutDashboard, 
  ScanLine, 
  History, 
  Target, 
  ShieldCheck,
  X
} from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const contentMapping = {
  id: {
    title: 'Bantuan & Tentang',
    intro: 'ArthaFlow Finance adalah proyek pribadi yang dibuat oleh Celvin Andra Maulana untuk membantu mahasiswa dan profesional mengelola keuangan mereka dengan presisi.',
    featuresTitle: 'Panduan Fitur',
    features: [
      {
        title: 'Dashboard Cerdas',
        icon: LayoutDashboard,
        content: 'Pantau kesehatan finansial Anda dengan grafik distribusi pengeluaran yang interaktif.'
      },
      {
        title: 'AI Scan Struk',
        icon: ScanLine,
        content: 'Scan struk belanja Anda dan biarkan AI mengekstrak nominal, tanggal, dan item secara otomatis.'
      },
      {
        title: 'Manajer Transaksi',
        icon: History,
        content: 'Catat pengeluaran dan pemasukan harian dengan kategori yang terorganisir.'
      },
      {
        title: 'Pantau Anggaran',
        icon: Target,
        content: 'Tetapkan batas pengeluaran bulanan dan lihat progresnya secara real-time.'
      },
      {
        title: 'Identitas Aman',
        icon: ShieldCheck,
        content: 'Akses data Anda dengan aman menggunakan proteksi Google OAuth.'
      }
    ],
    footer: 'Handcrafted by Celvin Andra Maulana',
    close: 'Tutup Panduan'
  },
  en: {
    title: 'Help & About',
    intro: 'ArthaFlow Finance is a personal project handcrafted by Celvin Andra Maulana to help students and professionals manage their finances with precision.',
    featuresTitle: 'Feature Guide',
    features: [
      {
        title: 'Smart Dashboard',
        icon: LayoutDashboard,
        content: 'Monitor your financial health with interactive spending distribution charts.'
      },
      {
        title: 'AI Scan Receipt',
        icon: ScanLine,
        content: 'Scan your receipts and let AI automatically extract amounts, dates, and items.'
      },
      {
        title: 'Transaction Manager',
        icon: History,
        content: 'Log daily expenses and income with organized categories.'
      },
      {
        title: 'Budget Tracking',
        icon: Target,
        content: 'Set monthly spending limits and monitor progress in real-time.'
      },
      {
        title: 'Secure Identity',
        icon: ShieldCheck,
        content: 'Access your data securely using Google OAuth protection.'
      }
    ],
    footer: 'Handcrafted by Celvin Andra Maulana',
    close: 'Close Guide'
  }
};

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const { language } = useLanguage();
  const t = contentMapping[language as keyof typeof contentMapping] || contentMapping.en;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-surface-container-lowest rounded-3xl w-full max-w-[600px] max-h-[90vh] shadow-2xl relative overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-8 pb-4 flex justify-between items-start border-b border-neutral-100">
          <div className="pr-12">
            <h2 className="text-3xl font-black tracking-tight text-on-surface">{t.title}</h2>
            <p className="text-sm text-secondary mt-2 leading-relaxed italic">
              "{t.intro}"
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-secondary absolute top-8 right-8">
            <X size={24} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-5 custom-scrollbar">
          <h3 className="text-[10px] font-black text-secondary tracking-widest uppercase mb-2">{t.featuresTitle}</h3>
          
          <div className="grid gap-3">
            {t.features.map((feature) => (
              <div key={feature.title} className="p-4 bg-surface-container-low border border-neutral-100/50 rounded-2xl hover:border-primary/20 hover:shadow-md transition-all group">
                <div className="flex gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-all h-fit">
                    <feature.icon size={20} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-on-surface mb-0.5 flex items-center gap-2">
                      {feature.title}
                    </h4>
                    <p className="text-sm text-secondary leading-relaxed font-medium">{feature.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer - Socials */}
        <div className="p-8 border-t border-neutral-100 bg-neutral-50/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <a 
                href="https://github.com/celvin-am" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:scale-105 transition-all active:scale-95 shadow-lg shadow-neutral-200"
              >
                <Github size={18} />
                GitHub
              </a>
              <a 
                href="https://www.linkedin.com/in/celvinandramaulana/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 px-4 py-2.5 bg-[#0077b5] text-white rounded-xl text-xs font-bold hover:scale-105 transition-all active:scale-95 shadow-lg shadow-blue-100"
              >
                <Linkedin size={18} />
                LinkedIn
              </a>
            </div>
            
            <div className="text-right">
              <button 
                onClick={onClose}
                className="text-xs font-black text-secondary hover:text-primary transition-colors uppercase tracking-widest block mb-1"
              >
                {t.close}
              </button>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-tighter italic">
                {t.footer}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
