/**
 * Cloudinary Upload Service — NaticBox
 * Uses unsigned uploads (no API secret exposed in frontend).
 * Requires an "unsigned" upload preset in Cloudinary dashboard:
 *   → console.cloudinary.com → Settings → Upload → Upload Presets
 *   → Create preset named "natic_unsigned" with Mode: Unsigned
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET = 'natic_unsigned';

export interface CloudinaryUploadResult {
  url: string;         // HTTPS secure URL
  publicId: string;    // Cloudinary public ID (for deletion)
  name: string;        // Original filename
  type: string;        // MIME type
  size: number;        // File size in bytes
  format: string;      // Image format (jpg, png, etc.)
  width?: number;
  height?: number;
}

/**
 * Upload any file to Cloudinary using unsigned upload.
 * Works without authentication — safe for public forms and profile photos.
 * @param file - File object to upload
 * @param folder - Cloudinary folder path (e.g. "naticbox/profile_photos/uid")
 */
export async function uploadToCloudinary(
  file: File,
  folder = 'naticbox'
): Promise<CloudinaryUploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  const resourceType = file.type.startsWith('video/') ? 'video' : 'auto';
  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Cloudinary upload failed (${response.status}). Verifica que el preset "natic_unsigned" exista y sea Unsigned en tu panel de Cloudinary.`);
  }

  const data = await response.json();

  return {
    url: data.secure_url,
    publicId: data.public_id,
    name: file.name,
    type: file.type,
    size: file.size,
    format: data.format,
    width: data.width,
    height: data.height,
  };
}

/**
 * Upload a profile photo to Cloudinary.
 * Automatically stores in naticbox/profile_photos/{userId}.
 * Returns an optimized 400×400 face-cropped URL.
 */
export async function uploadProfilePhoto(file: File, userId: string): Promise<string> {
  const result = await uploadToCloudinary(file, `naticbox/profile_photos/${userId}`);
  // Optimize for profile display: 400×400 face crop, auto quality and format
  return result.url.replace('/upload/', '/upload/c_fill,g_face,w_400,h_400,q_auto,f_auto/');
}

/**
 * Get a thumbnail URL for a Cloudinary image.
 * @param url   - Full Cloudinary URL
 * @param width - Desired width in px (default 80)
 * @param height - Desired height in px (default 80)
 */
export function getCloudinaryThumbnail(url: string, width = 80, height = 80): string {
  if (!url || !url.includes('cloudinary.com')) return url;
  // Insert transformation before /upload/
  return url.replace('/upload/', `/upload/c_fill,w_${width},h_${height},q_auto,f_auto/`);
}

/**
 * Check if Cloudinary is properly configured.
 */
export function isCloudinaryConfigured(): boolean {
  return !!CLOUD_NAME && CLOUD_NAME !== 'undefined';
}
