const MAX_LONG_EDGE_PX = 1600;
const JPEG_QUALITY = 0.82;
const TARGET_BYTES = Math.floor(1.2 * 1024 * 1024);

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('تعذر قراءة الصورة'));
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

async function encodeCanvas(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob | null> {
  const webp = await canvasToBlob(canvas, 'image/webp', quality);
  if (webp) return webp;
  return canvasToBlob(canvas, 'image/jpeg', quality);
}

function scaleDimensions(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const long = Math.max(width, height);
  if (long <= maxEdge) return { width, height };
  const ratio = maxEdge / long;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

/**
 * Resize and re-encode registration photos so three fit under Vercel's ~4.5 MB body limit.
 */
export async function compressRegistrationPhoto(file: File): Promise<File> {
  if (typeof document === 'undefined') {
    return file;
  }

  const img = await loadImageFromFile(file);
  const { width, height } = scaleDimensions(img.naturalWidth, img.naturalHeight, MAX_LONG_EDGE_PX);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);

  let quality = JPEG_QUALITY;
  let blob = await encodeCanvas(canvas, quality);

  while (blob && blob.size > TARGET_BYTES && quality > 0.45) {
    quality -= 0.08;
    blob = await encodeCanvas(canvas, quality);
  }

  if (!blob) {
    return file;
  }

  if (blob.size >= file.size && file.size <= TARGET_BYTES) {
    return file;
  }

  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
  return new File([blob], `${baseName}.${ext}`, {
    type: blob.type,
    lastModified: Date.now(),
  });
}
