import { Recitation, PlayerState } from '../types';
import { offlineAudioService } from './OfflineAudioService';
import { SupabaseService } from './SupabaseService';

export type PlayerEventListener = (state: PlayerState) => void;

export const formatDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export class AudioService {
  private static instance: AudioService;
  private audio: HTMLAudioElement | null = null;
  private listeners: Set<PlayerEventListener> = new Set();
  
  private state: PlayerState = {
    currentRecitation: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    playbackSpeed: 1.0,
    volume: 1.0,
    isMuted: false,
    queue: [],
    queueIndex: -1
  };

  private constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio();
      this.setupAudioListeners();
    }
  }

  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  private setupAudioListeners() {
    if (!this.audio) return;

    this.audio.addEventListener('play', () => {
      this.state.isPlaying = true;
      this.notifyListeners();
    });

    this.audio.addEventListener('pause', () => {
      this.state.isPlaying = false;
      this.notifyListeners();
    });

    let lastUpdateTime = 0;
    this.audio.addEventListener('timeupdate', () => {
      if (this.audio) {
        this.state.currentTime = this.audio.currentTime;
        if (this.audio.duration && !isNaN(this.audio.duration)) {
          this.state.duration = this.audio.duration;
        }
        const now = Date.now();
        if (now - lastUpdateTime > 250) {
          lastUpdateTime = now;
          this.notifyListeners();
        }
      }
    });

    this.audio.addEventListener('loadedmetadata', () => {
      if (this.audio && !isNaN(this.audio.duration)) {
        this.state.duration = this.audio.duration;
        this.notifyListeners();
      }
    });

    this.audio.addEventListener('ended', () => {
      this.playNext();
    });

    this.audio.addEventListener('error', async (e) => {
      console.warn('Audio playback error for current recitation:', e);
      if (this.state.currentRecitation && this.audio) {
        // 1. Check for offline cached copy
        const localSource = await offlineAudioService.getPlayableAudioUrl(this.state.currentRecitation.id);
        if (localSource && this.audio.src !== localSource) {
          this.audio.src = localSource;
          this.audio.play().catch(() => {});
          return;
        }
      }
      this.state.isPlaying = false;
      this.notifyListeners();
    });
  }

  public subscribe(listener: PlayerEventListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const currentState = this.getState();
    this.listeners.forEach((listener) => listener(currentState));
  }

  public getState(): PlayerState {
    return { ...this.state };
  }

  public async playRecitation(recitation: Recitation, newQueue: Recitation[] = []) {
    if (!this.audio) return;

    const isSameRecitation = this.state.currentRecitation?.id === recitation.id;

    if (isSameRecitation) {
      if (this.state.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
      return;
    }

    // Set queue
    if (newQueue.length > 0) {
      this.state.queue = newQueue;
      this.state.queueIndex = newQueue.findIndex((r) => r.id === recitation.id);
    } else if (this.state.queue.length === 0) {
      this.state.queue = [recitation];
      this.state.queueIndex = 0;
    }

    this.state.currentRecitation = recitation;
    this.state.duration = recitation.duration;
    this.state.currentTime = 0;

    // Resolve offline playable audio URL or streaming URL
    let playableSource = await offlineAudioService.getPlayableAudioUrl(recitation.id, recitation.audioUrl);
    if (!playableSource || !SupabaseService.isValidAudioSource(playableSource)) {
      playableSource = SupabaseService.resolveAudioUrl(recitation);
    }

    if (!playableSource || !SupabaseService.isValidAudioSource(playableSource)) {
      console.warn('No valid audio source found for recitation:', recitation.id);
      this.state.isPlaying = false;
      this.notifyListeners();
      return;
    }

    this.audio.src = playableSource;
    this.audio.playbackRate = this.state.playbackSpeed;
    this.audio.volume = this.state.volume;
    
    this.audio.play().catch((err) => {
      console.warn('Auto-play was blocked or stream pending:', err);
    });

    this.notifyListeners();
  }

  public play() {
    if (this.audio && this.state.currentRecitation) {
      this.audio.play().catch((err) => console.warn('Play error:', err));
    }
  }

  public pause() {
    if (this.audio) {
      this.audio.pause();
    }
  }

  public stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.src = '';
    }
    this.state.currentRecitation = null;
    this.state.isPlaying = false;
    this.state.currentTime = 0;
    this.state.duration = 0;
    this.notifyListeners();
  }

  public togglePlayPause() {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public seek(seconds: number) {
    if (this.audio) {
      this.audio.currentTime = Math.max(0, Math.min(seconds, this.state.duration || seconds));
      this.state.currentTime = this.audio.currentTime;
      this.notifyListeners();
    }
  }

  public setSpeed(speed: number) {
    this.state.playbackSpeed = speed;
    if (this.audio) {
      this.audio.playbackRate = speed;
    }
    this.notifyListeners();
  }

  public setVolume(volume: number) {
    this.state.volume = Math.max(0, Math.min(1, volume));
    if (this.audio) {
      this.audio.volume = this.state.volume;
      this.state.isMuted = this.state.volume === 0;
    }
    this.notifyListeners();
  }

  public toggleMute() {
    if (!this.audio) return;
    if (this.state.isMuted) {
      this.audio.volume = this.state.volume || 1;
      this.state.isMuted = false;
    } else {
      this.audio.volume = 0;
      this.state.isMuted = true;
    }
    this.notifyListeners();
  }

  public playNext() {
    if (this.state.queue.length === 0) return;
    const nextIndex = (this.state.queueIndex + 1) % this.state.queue.length;
    const nextRecitation = this.state.queue[nextIndex];
    if (nextRecitation) {
      this.state.queueIndex = nextIndex;
      this.playRecitation(nextRecitation, this.state.queue);
    }
  }

  public playPrevious() {
    if (this.state.queue.length === 0) return;
    const prevIndex = (this.state.queueIndex - 1 + this.state.queue.length) % this.state.queue.length;
    const prevRecitation = this.state.queue[prevIndex];
    if (prevRecitation) {
      this.state.queueIndex = prevIndex;
      this.playRecitation(prevRecitation, this.state.queue);
    }
  }

  public static formatDuration(seconds: number): string {
    return formatDuration(seconds);
  }
}

export const audioService = AudioService.getInstance();
