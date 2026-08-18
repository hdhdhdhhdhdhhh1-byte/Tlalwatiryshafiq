const STORAGE_BASE_URL = 'https://ixkganrxtkywypvqkqkn.supabase.co/storage/v1';

/**
 * Normalizes any image URL (Direct, Supabase Storage, Google Drive share URL, or fallback).
 */
export function normalizeImageUrl(
  imagePath?: string | null,
  defaultBucket: string = 'profile-images',
  fallbackPlaceholder?: string
): string {
  if (!imagePath || !imagePath.trim()) {
    return fallbackPlaceholder || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&fit=crop&crop=face';
  }

  const raw = imagePath.trim();

  // 1. Handle Google Drive Share URLs
  if (raw.includes('drive.google.com') || raw.includes('docs.google.com')) {
    const fileIdMatch =
      raw.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      raw.match(/[?&]id=([a-zA-Z0-9_-]+)/);

    if (fileIdMatch && fileIdMatch[1]) {
      const fileId = fileIdMatch[1];
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }

  // 2. Direct HTTP/HTTPS or Blob/Data URLs
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('blob:') || raw.startsWith('data:image')) {
    return raw;
  }

  // 3. Supabase Storage Path (e.g. 'profile-images/uuid.png' or 'uuid.png')
  const cleanPath = raw.startsWith('/') ? raw.slice(1) : raw;
  const parts = cleanPath.split('/');
  
  if (parts.length >= 2) {
    const bucket = parts[0];
    const objectPath = parts.slice(1).join('/');
    return `${STORAGE_BASE_URL}/object/public/${bucket}/${objectPath}`;
  }

  return `${STORAGE_BASE_URL}/object/public/${defaultBucket}/${cleanPath}`;
}

/**
 * Convert Google Drive audio share links to direct streaming URLs
 */
export function transformGoogleDriveAudioUrl(url: string): string {
  if (!url || (!url.includes('drive.google.com') && !url.includes('docs.google.com'))) {
    return url;
  }
  const fileIdMatch =
    url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    url.match(/[?&]id=([a-zA-Z0-9_-]+)/);

  if (fileIdMatch && fileIdMatch[1]) {
    const fileId = fileIdMatch[1];
    return `https://docs.google.com/uc?export=download&id=${fileId}`;
  }
  return url;
}

/**
 * Strictly validates whether a given string is a valid playable audio URL source.
 * Rejects regular web pages, search engines, HTML documents, etc.
 */
export function isValidAudioUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (
    !trimmed.startsWith('http://') &&
    !trimmed.startsWith('https://') &&
    !trimmed.startsWith('blob:') &&
    !trimmed.startsWith('data:audio')
  ) {
    return false;
  }
  const lower = trimmed.toLowerCase();

  // Reject non-audio web pages and general websites
  if (
    lower.includes('supabase.com/dashboard') ||
    lower.includes('google.com/search') ||
    lower.includes('google.com/url') ||
    lower.includes('share.google') ||
    lower.includes('youtube.com/watch') ||
    lower.includes('youtu.be') ||
    lower.includes('facebook.com') ||
    lower.includes('twitter.com') ||
    lower.includes('x.com') ||
    lower.includes('instagram.com') ||
    lower.includes('tiktok.com') ||
    lower.includes('example.com') ||
    lower.endsWith('.html') ||
    lower.endsWith('.htm') ||
    lower.endsWith('.php') ||
    lower.endsWith('.asp') ||
    lower.endsWith('.aspx') ||
    lower.endsWith('.jsp')
  ) {
    return false;
  }

  // Google Drive audio links
  if (lower.includes('drive.google.com') || lower.includes('docs.google.com')) {
    const hasId = /\/file\/d\/([a-zA-Z0-9_-]+)/.test(trimmed) || /[?&]id=([a-zA-Z0-9_-]+)/.test(trimmed);
    return hasId;
  }

  // Storage audio path (handles public, sign, authenticated, and tokenized signed URLs)
  const isStorageAudio = trimmed.includes('/storage/v1/object/') &&
    (trimmed.includes('audio') || trimmed.includes('.mp3') || trimmed.includes('.m4a') || trimmed.includes('.wav') || trimmed.includes('.ogg') || trimmed.includes('.aac') || trimmed.includes('.flac') || trimmed.includes('.webm') || trimmed.includes('.opus') || trimmed.includes('token='));

  // Standard audio extensions (with optional query parameters)
  const hasAudioExtension = /\.(mp3|m4a|wav|ogg|aac|webm|flac|opus|weba)(\?.*)?$/i.test(trimmed);

  // Blob or Base64 audio
  const isBlobOrData = trimmed.startsWith('blob:') || trimmed.startsWith('data:audio');

  return hasAudioExtension || isStorageAudio || isBlobOrData;
}

/**
 * Safely resolves audio URL for a recitation record.
 * Follows strict priority order:
 * 1. Storage Path / File (audio_storage_path / audioStoragePath)
 * 2. External Audio URL (external_audio_url / externalAudioUrl)
 * 3. Direct audio_url / audioUrl
 * 4. NEVER returns default/fallback/surah audio. Returns empty string if no valid audio exists.
 */
export function normalizeAudioUrl(record?: {
  audio_storage_path?: string | null;
  audioStoragePath?: string | null;
  external_audio_url?: string | null;
  externalAudioUrl?: string | null;
  audio_url?: string | null;
  audioUrl?: string | null;
  [key: string]: any;
}): string {
  if (!record) return '';

  // 1. Highest Priority: Check storage path (uploaded binary file)
  const storagePath = record.audio_storage_path || record.audioStoragePath;
  if (
    storagePath &&
    typeof storagePath === 'string' &&
    storagePath.trim() &&
    storagePath.trim() !== 'recitation-audio/sample.mp3' &&
    storagePath.trim() !== 'recitation-audio/default.mp3'
  ) {
    const trimmedPath = storagePath.trim();

    // 1a. If already a full URL or blob URL
    if (
      trimmedPath.startsWith('http://') ||
      trimmedPath.startsWith('https://') ||
      trimmedPath.startsWith('blob:') ||
      trimmedPath.startsWith('data:')
    ) {
      // NEVER allow /object/public/submission-audio/
      if (trimmedPath.includes('/storage/v1/object/public/submission-audio/')) {
        return '';
      }
      if (isValidAudioUrl(trimmedPath)) {
        return trimmedPath;
      }
    } else {
      // 1b. Relative storage path (e.g. 'recitation-audio/rec_123.mp3' or 'submission-audio/sub_123.mp3')
      const cleanPath = trimmedPath.startsWith('/') ? trimmedPath.slice(1) : trimmedPath;
      const parts = cleanPath.split('/').filter(Boolean);

      // submission-audio is private: DO NOT construct a public URL (requires Signed URL via async getPlayableAudioUrl)
      if (parts[0] === 'submission-audio' || cleanPath.startsWith('sub_')) {
        return '';
      }

      let storageUrl = '';
      if (parts.length >= 2) {
        storageUrl = `${STORAGE_BASE_URL}/object/public/${parts[0]}/${parts.slice(1).join('/')}`;
      } else {
        storageUrl = `${STORAGE_BASE_URL}/object/public/recitation-audio/${cleanPath}`;
      }

      if (isValidAudioUrl(storageUrl)) {
        return storageUrl;
      }
    }
  }

  // 2. Second Priority: Check external audio URL
  const external = record.external_audio_url || record.externalAudioUrl;
  if (external && typeof external === 'string' && external.trim()) {
    const trimmedExt = external.trim();
    if (!trimmedExt.includes('/storage/v1/object/public/submission-audio/')) {
      const directExt = transformGoogleDriveAudioUrl(trimmedExt);
      if (isValidAudioUrl(directExt)) {
        return directExt;
      }
    }
  }

  // 3. Third Priority: Check audio_url direct field
  const directAudioUrl = record.audio_url || record.audioUrl;
  if (directAudioUrl && typeof directAudioUrl === 'string' && directAudioUrl.trim()) {
    const trimmedDirect = directAudioUrl.trim();
    if (!trimmedDirect.includes('/storage/v1/object/public/submission-audio/')) {
      const directExt = transformGoogleDriveAudioUrl(trimmedDirect);
      if (isValidAudioUrl(directExt)) {
        return directExt;
      }
    }
  }

  // 4. No valid audio source exists - return empty string (DO NOT FALLBACK TO SURAH AUDIO)
  return '';
}
