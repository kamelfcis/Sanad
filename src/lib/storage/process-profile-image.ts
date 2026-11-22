import sharp, { type Metadata as SharpMetadata } from 'sharp';

const MIN_DIMENSION = 128;
const OUTPUT_SIZE = 512;

export type ProcessedProfileImage = {
  buffer: Buffer;
  contentType: 'image/jpeg';
  width: number;
  height: number;
};

export async function processProfileImage(file: Blob): Promise<ProcessedProfileImage | { error: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const input = Buffer.from(arrayBuffer);

  let meta: SharpMetadata;
  try {
    meta = await sharp(input).metadata();
  } catch {
    return { error: 'تعذر قراءة الصورة. استخدم JPEG أو PNG أو WebP.' };
  }

  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    return { error: `الصورة الشخصية يجب أن تكون ${MIN_DIMENSION}×${MIN_DIMENSION} بكسل على الأقل.` };
  }

  const side = Math.min(width, height);
  const left = Math.floor((width - side) / 2);
  const top = Math.floor((height - side) / 2);

  const buffer = await sharp(input)
    .extract({ left, top, width: side, height: side })
    .resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: 'cover' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  return {
    buffer,
    contentType: 'image/jpeg',
    width: OUTPUT_SIZE,
    height: OUTPUT_SIZE,
  };
}

export function isProfilePhotoField(fieldName: string): boolean {
  return fieldName === 'profilePhoto';
}
