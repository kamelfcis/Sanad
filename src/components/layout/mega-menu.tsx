'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Zap, Wrench, Wind, Hammer, PaintBucket, Home, ArrowLeft } from 'lucide-react';

const categories = [
  { icon: Zap, title: 'كهرباء', description: 'جميع أعمال الكهرباء والتمديدات', color: '#FF6B00', specialty: 'electrical' },
  { icon: Wrench, title: 'سباكة', description: 'تركيب وإصلاح السباكة', color: '#194E5B', specialty: 'plumbing' },
  { icon: Wind, title: 'تكييف', description: 'تركيب وصيانة المكيفات', color: '#FF8A34', specialty: 'ac-repair' },
  { icon: Hammer, title: 'نجارة', description: 'أعمال النجارة والأثاث', color: '#10B981', specialty: 'carpentry' },
  { icon: PaintBucket, title: 'دهان', description: 'دهان وديكور المنزل', color: '#8B5CF6', specialty: 'painting' },
  { icon: Home, title: 'صيانة منزلية', description: 'خدمات الصيانة الشاملة', color: '#EF4444', specialty: 'general-maintenance' },
];

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MegaMenu({ isOpen, onClose }: MegaMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onMouseLeave={onClose}
          className="absolute inset-x-0 top-full z-50 pt-3"
        >
          <div className="mx-auto w-[680px] rounded-2xl border border-border bg-card p-5 shadow-xl shadow-black/5 dark:shadow-black/20">
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">تصفح الخدمات</h3>
              <Link
                href="/services"
                onClick={onClose}
                className="flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-accent"
              >
                الكل
                <ArrowLeft className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <Link
                  key={cat.specialty}
                  href={`/services?specialty=${encodeURIComponent(cat.specialty)}`}
                  onClick={onClose}
                  className="group flex flex-col items-center gap-3 rounded-xl p-5 text-center transition-all duration-200 hover:bg-muted"
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
                    style={{ backgroundColor: `${cat.color}12` }}
                  >
                    <cat.icon className="h-6 w-6" style={{ color: cat.color }} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
                      {cat.title}
                    </h4>
                    <p className="mt-0.5 text-xs text-text-secondary">{cat.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
