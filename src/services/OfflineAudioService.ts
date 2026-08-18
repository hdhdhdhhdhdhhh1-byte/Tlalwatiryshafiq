/**
 * OfflineAudioService
 * Real local storage and offline playback management for Quranic recitations.
 * Uses browser IndexedDB and CacheStorage to store audio binary blobs locally.
 */

import { Recitation } from '../types';

export interface OfflineRecitationRecord {
  id: string;
  reciterId: string;
  reciterName: string;
  reciterAvatar: string;
  reciterCountry: string;
  surahNumber: number;
  surahNameArabic: string;
  surahNameEnglish: string;
  ayahRange?: string;
  riwayah: string;
  duration: number;
  durationFormatted: string;
  audioUrl: string;
  audioBlob: Blob;
  sizeBytes: number;
  downloadedAt: number;
}

const DB_NAME = 'tilawatak_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'offline_recitations';

class OfflineAudioService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private memoryCacheUrls: Map<string, string> = new Map();
  private downloadedIdSet: Set<string> = new Set();
  private listeners: Set<(downloadedIds: Set<string>) => void> = new Set();
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAllKeys();

      req.onsuccess = () => {
        const keys = req.result as string[];
        this.downloadedIdSet = new Set(keys);
        this.isInitialized = true;
        this.notifyListeners();
      };
    } catch (e) {
      console.warn('OfflineAudioService IndexedDB init warning:', e);
      this.isInitialized = true;
    }
  }

  public subscribe(listener: (downloadedIds: Set<string>) => void): () => void {
    this.listeners.add(listener);
    listener(new Set(this.downloadedIdSet));
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    const copy = new Set(this.downloadedIdSet);
    this.listeners.forEach((fn) => fn(copy));
  }

  public isDownloaded(recitationId: string): boolean {
    return this.downloadedIdSet.has(recitationId);
  }

  public getDownloadedIds(): Set<string> {
    return new Set(this.downloadedIdSet);
  }

  /**
   * Download and save audio to local IndexedDB
   */
  public async downloadRecitation(recitation: Recitation, onProgress?: (percent: number) => void): Promise<boolean> {
    try {
      if (this.isDownloaded(recitation.id)) {
        return true;
      }

      onProgress?.(10);
      const response = await fetch(recitation.audioUrl, {
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch audio stream: HTTP ${response.status}`);
      }

      onProgress?.(50);
      const blob = await response.blob();
      onProgress?.(80);

      const record: OfflineRecitationRecord = {
        id: recitation.id,
        reciterId: recitation.reciterId,
        reciterName: recitation.reciterName,
        reciterAvatar: recitation.reciterAvatar,
        reciterCountry: recitation.reciterCountry,
        surahNumber: recitation.surahNumber,
        surahNameArabic: recitation.surahNameArabic,
        surahNameEnglish: recitation.surahNameEnglish,
        ayahRange: recitation.ayahRange,
        riwayah: recitation.riwayah,
        duration: recitation.duration,
        durationFormatted: recitation.durationFormatted,
        audioUrl: recitation.audioUrl,
        audioBlob: blob,
        sizeBytes: blob.size,
        downloadedAt: Date.now()
      };

      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      // Cache blob URL in memory for fast offline access
      const blobUrl = URL.createObjectURL(blob);
      this.memoryCacheUrls.set(recitation.id, blobUrl);

      this.downloadedIdSet.add(recitation.id);
      this.notifyListeners();
      onProgress?.(100);
      return true;
    } catch (error) {
      console.warn(`Error downloading recitation ${recitation.id}:`, error);
      return false;
    }
  }

  /**
   * Get an offline playable audio source URL (blob:...)
   */
  public async getPlayableAudioUrl(recitationId: string, fallbackUrl?: string): Promise<string> {
    // 1. Check in-memory cached blob URL
    if (this.memoryCacheUrls.has(recitationId)) {
      return this.memoryCacheUrls.get(recitationId)!;
    }

    // 2. Fetch from IndexedDB
    try {
      const db = await this.getDB();
      const record = await new Promise<OfflineRecitationRecord | null>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(recitationId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });

      if (record && record.audioBlob) {
        const url = URL.createObjectURL(record.audioBlob);
        this.memoryCacheUrls.set(recitationId, url);
        return url;
      }
    } catch (e) {
      console.warn('Could not read from IndexedDB:', e);
    }

    // 3. Fallback to online stream URL
    return fallbackUrl || '';
  }

  /**
   * Delete downloaded recitation to free device storage
   */
  public async removeDownloaded(recitationId: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(recitationId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      if (this.memoryCacheUrls.has(recitationId)) {
        URL.revokeObjectURL(this.memoryCacheUrls.get(recitationId)!);
        this.memoryCacheUrls.delete(recitationId);
      }

      this.downloadedIdSet.delete(recitationId);
      this.notifyListeners();
      return true;
    } catch (e) {
      console.warn(`Error deleting offline recitation ${recitationId}:`, e);
      return false;
    }
  }

  /**
   * Retrieve list of all offline recitations
   */
  public async getAllDownloaded(): Promise<OfflineRecitationRecord[]> {
    try {
      const db = await this.getDB();
      return await new Promise<OfflineRecitationRecord[]>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }
}

export const offlineAudioService = new OfflineAudioService();
