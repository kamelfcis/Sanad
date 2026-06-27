'use client';

import { useState } from 'react';
import { uploadCategoryIconViaApi } from '@/lib/storage/category-icon-client-upload';

interface CategoryIconUploadState {
  uploading: boolean;
  uploadedUrl: string | null;
  error: string | null;
}

export function useCategoryIconUpload() {
  const [state, setState] = useState<CategoryIconUploadState>({
    uploading: false,
    uploadedUrl: null,
    error: null,
  });

  const uploadFile = async (file: File): Promise<string | null> => {
    setState((prev) => ({ ...prev, uploading: true, error: null }));

    try {
      const publicUrl = await uploadCategoryIconViaApi(file);
      setState({ uploading: false, uploadedUrl: publicUrl, error: null });
      return publicUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setState((prev) => ({ ...prev, uploading: false, error: message }));
      return null;
    }
  };

  const reset = () => {
    setState({ uploading: false, uploadedUrl: null, error: null });
  };

  return { ...state, uploadFile, reset };
}
