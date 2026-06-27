'use client';

import { useMemo, useRef, useState } from 'react';
import { Loader2, Search, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CATEGORY_PRESET_ICON_KEYS,
  categoryIconMap,
  type CategoryIconType,
} from '@/lib/icons/category-icons';
import { CategoryIconDisplay } from '@/components/shared/category-icon-display';
import { useCategoryIconUpload } from '@/hooks/use-category-icon-upload';

interface CategoryIconPickerProps {
  icon: string;
  iconType: CategoryIconType;
  onChange: (value: { icon: string; iconType: CategoryIconType }) => void;
  labels: {
    title: string;
    preset: string;
    upload: string;
    search: string;
    preview: string;
    uploadHint: string;
    uploading: string;
    remove: string;
  };
}

export function CategoryIconPicker({ icon, iconType, onChange, labels }: CategoryIconPickerProps) {
  const [mode, setMode] = useState<CategoryIconType>(iconType);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useCategoryIconUpload();

  const filteredIcons = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return CATEGORY_PRESET_ICON_KEYS;
    return CATEGORY_PRESET_ICON_KEYS.filter((key) => key.includes(query));
  }, [search]);

  const handleModeChange = (next: CategoryIconType) => {
    setMode(next);
    if (next === 'preset') {
      const fallback = icon && categoryIconMap[icon] ? icon : 'snowflake';
      onChange({ icon: fallback, iconType: 'preset' });
      upload.reset();
    } else if (upload.uploadedUrl) {
      onChange({ icon: upload.uploadedUrl, iconType: 'upload' });
    } else if (iconType === 'upload' && icon) {
      onChange({ icon, iconType: 'upload' });
    } else {
      onChange({ icon: '', iconType: 'upload' });
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 1024 * 1024) return;
    const url = await upload.uploadFile(file);
    if (url) {
      onChange({ icon: url, iconType: 'upload' });
    }
  };

  const previewIcon = mode === 'upload' ? (upload.uploadedUrl ?? (iconType === 'upload' ? icon : '')) : icon;

  return (
    <div className="space-y-3" data-testid="category-icon-picker">
      <div className="flex items-center justify-between gap-3">
        <Label>{labels.title}</Label>
        <div className="inline-flex rounded-lg border border-[#E2E8F0] bg-white p-0.5">
          <button
            type="button"
            data-testid="category-icon-mode-preset"
            onClick={() => handleModeChange('preset')}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-colors',
              mode === 'preset'
                ? 'bg-[#FF6B00] text-white'
                : 'text-[#64748B] hover:bg-[#FF6B00]/10 hover:text-[#FF6B00]',
            )}
          >
            {labels.preset}
          </button>
          <button
            type="button"
            data-testid="category-icon-mode-upload"
            onClick={() => handleModeChange('upload')}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-colors',
              mode === 'upload'
                ? 'bg-[#FF6B00] text-white'
                : 'text-[#64748B] hover:bg-[#FF6B00]/10 hover:text-[#FF6B00]',
            )}
          >
            {labels.upload}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-[#F8FAFC]/90 px-3 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-[#94A3B8]">
          {labels.preview}
        </span>
        {previewIcon ? (
          <span data-testid="category-icon-preview">
            <CategoryIconDisplay icon={previewIcon} iconType={mode} size="lg" variant="avatar" />
          </span>
        ) : (
          <span className="text-sm text-[#94A3B8]">—</span>
        )}
      </div>

      {mode === 'preset' ? (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={labels.search}
              className="ps-9"
              data-testid="category-icon-search"
            />
          </div>
          <div
            className="grid max-h-48 grid-cols-6 gap-2 overflow-y-auto rounded-xl border border-[#E2E8F0] p-2 sm:grid-cols-8"
            data-testid="category-icon-grid"
          >
            {filteredIcons.map((key) => {
              const Icon = categoryIconMap[key];
              const selected = icon === key;
              return (
                <button
                  key={key}
                  type="button"
                  title={key}
                  data-testid={`category-icon-option-${key}`}
                  aria-pressed={selected}
                  onClick={() => onChange({ icon: key, iconType: 'preset' })}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg border transition-colors',
                    selected
                      ? 'border-[#FF6B00] bg-[#FF6B00]/10 text-[#FF6B00]'
                      : 'border-transparent bg-white text-[#64748B] hover:border-[#FF6B00]/30 hover:bg-[#FF6B00]/5 hover:text-[#FF6B00]',
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div
            onClick={() => inputRef.current?.click()}
            className={cn(
              'flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-5 transition-colors',
              upload.uploading
                ? 'pointer-events-none border-[#E2E8F0] opacity-70'
                : 'border-[#E2E8F0] hover:border-[#FF6B00]/40 hover:bg-[#FF6B00]/5',
            )}
            data-testid="category-icon-upload-dropzone"
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
                e.target.value = '';
              }}
            />
            {upload.uploading ? (
              <Loader2 className="h-7 w-7 animate-spin text-[#64748B]" />
            ) : (
              <Upload className="h-7 w-7 text-[#64748B]" />
            )}
            <p className="text-center text-sm text-[#64748B]">
              {upload.uploading ? labels.uploading : labels.uploadHint}
            </p>
          </div>
          {upload.error ? <p className="text-xs text-destructive">{upload.error}</p> : null}
          {previewIcon && mode === 'upload' ? (
            <button
              type="button"
              onClick={() => {
                upload.reset();
                onChange({ icon: '', iconType: 'upload' });
              }}
              className="inline-flex items-center gap-1 text-xs text-[#64748B] hover:text-destructive"
            >
              <X className="h-3 w-3" />
              {labels.remove}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
