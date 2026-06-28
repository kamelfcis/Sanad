'use client';

import { useState } from 'react';
import { OptimizedImage } from '@/components/shared/optimized-image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileText, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface ApplicationDocument {
  url: string;
  label: string;
}

function isPdfUrl(url: string): boolean {
  return /\.pdf(\?|$)/i.test(url);
}

function DocumentTile({
  doc,
  onClick,
}: {
  doc: ApplicationDocument;
  onClick: () => void;
}) {
  const isPdf = isPdfUrl(doc.url);

  if (isPdf) {
    return (
      <a
        href={doc.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50 p-4 transition-colors hover:border-[#FF6B00]/40 hover:bg-[#FF6B00]/5"
      >
        <FileText className="h-10 w-10 text-[#FF6B00]/70" />
        <span className="line-clamp-2 text-center text-xs font-medium text-zinc-700">{doc.label}</span>
        <ExternalLink className="h-3.5 w-3.5 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100" />
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-square overflow-hidden rounded-xl border border-zinc-200/80 bg-zinc-100 transition-all hover:border-[#FF6B00]/40 hover:shadow-md"
    >
      <OptimizedImage
        src={doc.url}
        alt={doc.label}
        fill
        className="object-cover transition-transform group-hover:scale-105"
        sizes="(max-width: 640px) 50vw, 200px"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-2">
        <p className="truncate text-xs font-medium text-white">{doc.label}</p>
      </div>
    </button>
  );
}

interface TechnicianApplicationGalleryProps {
  documents: ApplicationDocument[];
  viewDocumentLabel: string;
  emptyLabel: string;
  className?: string;
}

export function TechnicianApplicationGallery({
  documents,
  viewDocumentLabel,
  emptyLabel,
  className,
}: TechnicianApplicationGalleryProps) {
  const [lightbox, setLightbox] = useState<ApplicationDocument | null>(null);

  if (documents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{emptyLabel}</p>
    );
  }

  return (
    <>
      <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3', className)}>
        {documents.map((doc) => (
          <DocumentTile
            key={doc.url}
            doc={doc}
            onClick={() => {
              if (!isPdfUrl(doc.url)) setLightbox(doc);
            }}
          />
        ))}
      </div>

      <Dialog open={!!lightbox} onOpenChange={(open) => !open && setLightbox(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>{lightbox?.label ?? viewDocumentLabel}</DialogTitle>
          </DialogHeader>
          {lightbox && !isPdfUrl(lightbox.url) ? (
            <div className="relative mx-auto aspect-[4/3] w-full max-h-[70vh] bg-zinc-100">
              <OptimizedImage
                src={lightbox.url}
                alt={lightbox.label}
                fill
                className="object-contain"
                sizes="90vw"
                blur={false}
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
