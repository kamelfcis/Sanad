'use client';

import { useRef, useState } from 'react';
import { X, Loader2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ImageUploaderProps {
  urls: string[];
  onUpload: (file: File) => Promise<string | null>;
  onRemove: (url: string) => void;
  uploading: boolean;
  maxFiles?: number;
  error?: string | null;
}

export function ImageUploader({
  urls,
  onUpload,
  onRemove,
  uploading,
  maxFiles = 5,
  error,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) return;
    await onUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const remaining = maxFiles - urls.length;

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors',
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50',
          remaining === 0 && 'pointer-events-none opacity-50',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
          disabled={uploading || remaining === 0}
        />
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="h-8 w-8 text-muted-foreground" />
        )}
        <div className="text-center">
          <p className="text-sm font-medium">
            {remaining === 0
              ? 'Max images reached'
              : 'Drop images here or click to browse'}
          </p>
          <p className="text-xs text-muted-foreground">
            {remaining} of {maxFiles} remaining — Max 10MB each
          </p>
        </div>
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, i) => (
            <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-md border">
              <img
                src={url}
                alt={`Upload ${i + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                onClick={() => onRemove(url)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
