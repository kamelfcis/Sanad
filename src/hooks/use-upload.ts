'use client';

import { useState } from 'react';
import { uploadFileViaApi } from '@/lib/storage/client-upload';

interface UploadState {
  uploading: boolean;
  uploadedUrls: string[];
  error: string | null;
}

export function useUpload() {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    uploadedUrls: [],
    error: null,
  });

  const uploadFile = async (file: File): Promise<string | null> => {
    setState((prev) => ({ ...prev, uploading: true, error: null }));

    try {
      const publicUrl = await uploadFileViaApi(file);

      setState((prev) => ({
        ...prev,
        uploading: false,
        uploadedUrls: [...prev.uploadedUrls, publicUrl],
      }));

      return publicUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setState((prev) => ({ ...prev, uploading: false, error: message }));
      return null;
    }
  };

  const removeUrl = (url: string) => {
    setState((prev) => ({
      ...prev,
      uploadedUrls: prev.uploadedUrls.filter((u) => u !== url),
    }));
  };

  const reset = () => {
    setState({ uploading: false, uploadedUrls: [], error: null });
  };

  return { ...state, uploadFile, removeUrl, reset };
}
