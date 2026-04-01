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
    intro:
      'ArthaFlow Finance adalah proyek pribadi yang dibuat oleh Celvin Andra Maulana untuk membantu mahasiswa dan profesional mengelola keuangan mereka dengan presisi.',
    featuresTitle: 'Panduan Fitur',
    features: [
      {
        title: 'Dashboard Cerdas',
        icon: LayoutDashboard,
        content:
          'Pantau kesehatan finansial Anda dengan grafik distribusi pengeluaran yang interaktif.'
      },
      {
        title: 'AI Scan Struk',
        icon: ScanLine,
        content:
          'Scan struk belanja Anda dan biarkan AI mengekstrak nominal, tanggal, dan item secara otomatis.'
      },
      {
        title: 'Manajer Transaksi',
        icon: History,
        content:
          'Catat pengeluaran dan pemasukan harian dengan kategori yang terorganisir.'
      },
      {
        title: 'Pantau Anggaran',
        icon: Target,
        content:
          'Tetapkan batas pengeluaran bulanan dan lihat progresnya secara real-time.'
      },
      {
        title: 'Identitas Aman',
        icon: ShieldCheck,
        content:
          'Akses data Anda dengan aman menggunakan proteksi Google OAuth.'
      }
    ],
    footer: 'Handcrafted by Celvin Andra Maulana',
    close: 'Tutup Panduan'
  },
  en: {
    title: 'Help & About',
    intro:
      'ArthaFlow Finance is a personal project handcrafted by Celvin Andra Maulana to help students and professionals manage their finances with precision.',
    featuresTitle: 'Feature Guide',
    features: [
      {
        title: 'Smart Dashboard',
        icon: LayoutDashboard,
        content:
          'Monitor your financial health with interactive spending distribution charts.'
      },
      {
        title: 'AI Scan Receipt',
        icon: ScanLine,
        content:
          'Scan your receipts and let AI automatically extract amounts, dates, and items.'
      },
      {
        title: 'Transaction Manager',
        icon: History,
        content:
          'Log daily expenses and income with organized categories.'
      },
      {
        title: 'Budget Tracking',
        icon: Target,
        content:
          'Set monthly spending limits and monitor progress in real-time.'
      },
      {
        title: 'Secure Identity',
        icon: ShieldCheck,
        content:
          'Access your data securely using Google OAuth protection.'
      }
    ],
    footer: 'Handcrafted by Celvin Andra Maulana',
    close: 'Close Guide'
  }
};

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const { language } = useLanguage();
  const t =
    contentMapping[language as keyof typeof contentMapping] || contentMapping.en;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-300">
      <div className="flex min-h-full items-end justify-center sm:items-center">
        <div className="flex w-full max-w-[640px] max-h-[92dvh] flex-col overflow-hidden rounded-[28px] bg-surface-container-lowest shadow-2xl">
          {/* Header */}
          <div className="relative border-b border-neutral-100 px-5 pb-4 pt-5 sm:px-8 sm:pb-5 sm:pt-7">
            <div className="pr-12 sm:pr-14">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-on-surface">
                {t.title}
              </h2>
              <p className="mt-2 text-sm text-secondary leading-relaxed">
                {t.intro}
              </p>
            </div>

            <button
              onClick={onClose}
              className="absolute right-4 top-4 sm:right-6 sm:top-6 rounded-full p-2 text-secondary transition-colors hover:bg-neutral-100"
              aria-label={t.close}
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-secondary">
              {t.featuresTitle}
            </h3>

            <div className="grid gap-3">
              {t.features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-neutral-100/60 bg-surface-container-low p-4 transition-all hover:border-primary/20 hover:shadow-sm"
                >
                  <div className="flex gap-3 sm:gap-4">
                    <div className="h-fit rounded-xl bg-primary/10 p-2.5 text-primary shrink-0">
                      <feature.icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="mb-1 text-sm sm:text-base font-extrabold text-on-surface">
                        {feature.title}
                      </h4>
                      <p className="text-sm leading-relaxed text-secondary">
                        {feature.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-neutral-100 bg-neutral-50/60 px-5 py-4 sm:px-8 sm:py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="https://github.com/celvin-am"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-xs font-bold text-white transition-all hover:scale-[1.02] active:scale-95"
                >
                  <Github size={16} />
                  GitHub
                </a>

                <a
                  href="https://www.linkedin.com/in/celvinandramaulana/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0077b5] px-4 py-2.5 text-xs font-bold text-white transition-all hover:scale-[1.02] active:scale-95"
                >
                  <Linkedin size={16} />
                  LinkedIn
                </a>
              </div>

              <div className="flex flex-col items-start gap-2 sm:items-end">
                <button
                  onClick={onClose}
                  className="text-xs font-black uppercase tracking-widest text-secondary transition-colors hover:text-primary"
                >
                  {t.close}
                </button>
                <p className="text-[10px] font-bold uppercase tracking-tight text-neutral-400 italic">
                  {t.footer}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}