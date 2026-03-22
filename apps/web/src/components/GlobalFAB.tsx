import { useState } from 'react';
import { AddTransactionModal } from './transactions/AddTransactionModal';

export function GlobalFAB() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-10 right-10 w-16 h-16 bg-primary text-white rounded-full shadow-2xl hover:scale-105 hover:bg-orange-600 transition-all flex items-center justify-center z-50 group border-4 border-white"
        aria-label="Add Transaction"
      >
        <span className="material-symbols-outlined text-[32px] group-hover:rotate-90 transition-transform duration-300">add</span>
      </button>

      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
