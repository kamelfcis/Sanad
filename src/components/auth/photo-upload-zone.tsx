'use client';

import { useRef, useState } from 'react';
import { Upload, X, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { compressRegistrationPhoto } from '@/lib/images/compress-registration-photo';

interface PhotoUploadZoneProps {
  label: string;
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}

export function PhotoUploadZone({ label, value, onChange, error }: PhotoUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setIsCompressing(true);
    try {
      const compressed = await compressRegistrationPhoto(file);
      onChange(compressed);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(compressed);
    } catch {
      onChange(file);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } finally {
      setIsCompressing(false);
    }
  };

  const clear = () => {
    onChange(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label={label}
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative flex min-h-[120px] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 transition-colors',
          error ? 'border-destructive bg-destructive/5' : 'border-border hover:border-primary/50 hover:bg-primary/5',
          value && 'border-primary/40 bg-primary/5',
        )}
      >
        {isCompressing ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs text-text-muted">جاري تحسين حجم الصورة…</span>
          </>
        ) : preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt={label} className="h-20 w-20 rounded-lg object-cover" />
            <span className="flex items-center gap-1 text-xs font-medium text-primary">
              <Check className="h-3.5 w-3.5" />
              تم الرفع
            </span>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6 text-text-muted" />
            <span className="text-sm font-medium text-text-primary">{label}</span>
            <span className="text-xs text-text-muted">📤 اضغط للرفع</span>
          </>
        )}
      </button>
      {value && (
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1 text-xs text-destructive hover:underline"
        >
          <X className="h-3 w-3" />
          إزالة الصورة
        </button>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
