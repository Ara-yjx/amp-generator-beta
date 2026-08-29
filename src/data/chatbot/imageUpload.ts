import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_PENDING_IMAGES,
} from './constants';
import { formatBytes } from './chatbotUtils';
import type { PendingUpload, StoredAttachment } from './types';

function normalizeImageFormat(file: File): string {
  const mime = file.type || '';
  if (mime === 'image/jpeg') {
    return 'jpeg';
  }
  if (mime.startsWith('image/')) {
    return mime.slice('image/'.length);
  }

  const name = file.name || '';
  const ext = name.includes('.') ? name.split('.').pop()?.toLowerCase() : '';
  return ext === 'jpg' ? 'jpeg' : ext || 'png';
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Validates, base64 encodes, and generates a preview URL for an uploaded image file.
 * @param file - File selected by user
 */
export async function createPendingUpload(file: File): Promise<PendingUpload> {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    throw new Error(`Unsupported file type: ${file.type || file.name}`);
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`File too large: ${file.name} exceeds ${formatBytes(MAX_IMAGE_BYTES)}`);
  }

  const dataUrl = await fileToDataUrl(file);
  const base64Payload = dataUrl.includes(',') ? dataUrl.split(',', 2)[1] : '';
  if (!base64Payload) {
    throw new Error(`Could not encode file: ${file.name}`);
  }

  return {
    id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name || 'image',
    format: normalizeImageFormat(file),
    mediaType: file.type,
    size: file.size,
    bytesBase64: base64Payload,
    previewUrl: URL.createObjectURL(file),
  };
}

/**
 * Validates and appends selected files to the pending uploads queue.
 * Enforces maximum image upload limits.
 * @param files - Array of files to attach
 * @param pendingImages - Existing queued images
 */
export async function addFilesToPendingImages(
  files: File[],
  pendingImages: PendingUpload[],
): Promise<{ uploads: PendingUpload[]; truncated: boolean }> {
  const normalizedFiles = files.filter(Boolean);
  if (normalizedFiles.length === 0) {
    return { uploads: pendingImages, truncated: false };
  }

  const remaining = MAX_PENDING_IMAGES - pendingImages.length;
  if (remaining <= 0) {
    throw new Error(`You can attach up to ${MAX_PENDING_IMAGES} images at a time.`);
  }

  const acceptedFiles = normalizedFiles.slice(0, remaining);
  const newUploads: PendingUpload[] = [];
  try {
    for (const file of acceptedFiles) {
      newUploads.push(await createPendingUpload(file));
    }
  } catch (error) {
    newUploads.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    throw error;
  }

  return {
    uploads: pendingImages.concat(newUploads),
    truncated: normalizedFiles.length > acceptedFiles.length,
  };
}

/**
 * Releases memory for an object preview URL.
 * @param upload - Target pending upload
 */
export function revokeUploadPreview(upload: PendingUpload | undefined): void {
  if (!upload?.previewUrl) {
    return;
  }
  try {
    URL.revokeObjectURL(upload.previewUrl);
  } catch {
    /* noop */
  }
}

/**
 * Creates a shallow clone of a pending upload item.
 * @param upload - Target pending upload
 */
export function cloneUpload(upload: PendingUpload): PendingUpload {
  return { ...upload };
}

/**
 * Converts a PendingUpload into a StoredAttachment (stripping transient data).
 * @param upload - Pending upload
 */
export function toStoredAttachment(upload: PendingUpload): StoredAttachment {
  return {
    id: upload.id,
    name: upload.name,
    format: upload.format,
    mediaType: upload.mediaType,
    size: upload.size,
  };
}
