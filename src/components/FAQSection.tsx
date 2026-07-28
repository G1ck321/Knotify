import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, HelpCircle, ShieldCheck } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 'compliance',
    category: 'DRESS CODE',
    question: 'Are these ties guaranteed to be chapel-compliant?',
    answer: 'Yes, definitely. Every tie listed on Knotify is checked against Covenant University’s dress code rules. We filter out incorrect widths, loud designs, and informal patterns so you can pass lobby inspections with zero stress.'
  },
  {
    id: 'delivery',
    category: 'HOW IT WORKS',
    question: 'How does the lobby delivery work?',
    answer: 'Once you reserve a tie, you will immediately get the seller’s residence hall, wing, room number, and phone number. Then, you can simply meet up in your lobby (like Daniel, Peter, PG, Esther, or Lydia Hall) to grab your tie.'
  },
  {
    id: 'pricing',
    category: 'PRICING',
    question: 'How much do ties on Knotify cost?',
    answer: 'Prices are very cheap and student-friendly, usually between ₦500 and ₦2,500. Knotify is built by students for students, so you get great ties without paying expensive off-campus prices.'
  },
  {
    id: 'selling',
    category: 'SELLING',
    question: 'Can any student sell their ties here?',
    answer: 'Yes! Any current student can sell their ties. If you have extra ties or are a graduating senior wanting to sell your dress wear, just click "Become a Seller", fill in your room info, and list your ties.'
  },
  {
    id: 'payment',
    category: 'PAYMENT',
    question: 'How do I pay the seller?',
    answer: 'To keep things simple and secure, you pay the seller directly when you meet them in the lobby. You can pay with cash or do a quick bank transfer on your phone.'
  },
  {
    id: 'returns',
    category: 'RETURNS',
    question: 'What if I don’t like the tie when I see it?',
    answer: 'Since you meet up in person, you can inspect the tie’s condition, color, and length before paying. Make sure you are completely satisfied with the tie before sending the money.'
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggleFAQ = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  return (
    <section 
      className="py-24 px-4 sm:px-6 lg:px-8 bg-[#FFFEF2] border-b border-brand-border relative overflow-hidden" 
      id="faq-section"
    >
      {/* Exquisite Architectural Lines */}
      <div className="absolute inset-0 bg-[radial-gradient(#8C1D4010_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Header Block with Vintage Double-Border Badge */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center justify-center px-4 py-1 border border-brand-secondary/30 relative before:absolute before:inset-0.5 before:border before:border-brand-secondary/10 before:pointer-events-none mx-auto mb-1 bg-brand-primary/5 rounded-xs">
            <span className="text-[9px] font-mono uppercase tracking-[0.35em] text-brand-secondary font-bold">
              KNOTIFY SERVICE DESK
            </span>
          </div>
          
          <h2 className="font-display font-black text-3xl sm:text-5xl text-brand-primary uppercase tracking-tight">
            GOT QUESTIONS, WE HAVE ANSWERS
          </h2>
          <div className="h-[1px] w-14 bg-brand-secondary/40 mx-auto"></div>
          <p className="text-xs sm:text-sm font-sans text-brand-primary/65 max-w-lg mx-auto leading-relaxed">
            Everything you need to know about secure student exchanges, dress code rules, and lobby meeting spots on Knotify.
          </p>
        </div>

        {/* 6 Elegant Premium FAQ Accordions */}
        <div className="space-y-4 max-w-3xl mx-auto" id="faq-accordions-container">
          {FAQ_DATA.map((item) => {
            const isOpen = openIndex === item.id;
            return (
              <div 
                key={item.id}
                className={`border rounded-sm transition-all duration-300 ${
                  isOpen 
                    ? 'border-brand-secondary bg-brand-primary/[0.02] shadow-[0_4px_20px_rgba(140,29,64,0.05)]' 
                    : 'border-brand-border hover:border-brand-secondary/40 bg-white shadow-xs'
                }`}
              >
                <button
                  onClick={() => toggleFAQ(item.id)}
                  className="w-full text-left p-5 sm:p-6 flex items-start justify-between gap-4 cursor-pointer focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <div className="pr-2">
                    <span className="font-display font-bold text-sm sm:text-base text-brand-primary tracking-wide block uppercase">
                      {item.question}
                    </span>
                  </div>
                  
                  <span className={`shrink-0 mt-3 p-1 rounded-full border border-brand-border transition-transform duration-300 ${
                    isOpen ? 'rotate-180 bg-brand-secondary/10 border-brand-secondary/20 text-brand-secondary' : 'text-brand-primary/50'
                  }`}>
                    <ChevronDown size={14} />
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-6 sm:px-6 sm:pb-7 pt-1 border-t border-brand-border/30">
                        <p className="text-xs sm:text-sm text-brand-primary/75 leading-relaxed font-sans max-w-2xl">
                          {item.answer}
                        </p>
                        
                        {/* Interactive Compliance Label Badge if complying */}
                        {item.id === 'compliance' && (
                          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-[10px] font-mono text-emerald-800 rounded-xs border border-emerald-100">
                            <ShieldCheck size={11} />
                            <span>100% REGULATION-COMPLIANT GUARANTEE</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
