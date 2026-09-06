"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import HLS from 'hls.js';
import { pipStore } from "@/lib/pip-store";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ArrowLeft,
  Loader2,
  SkipForward,
  SkipBack,
  ChevronsRight,
  ChevronsLeft,
  Settings,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface VideoPlayerProps {
  videoUrl: string;
  autoplay?: boolean;
  poster?: string;
  initialTime?: number;
  onError?: (error: any) => void;
  onEnded?: () => void;
  onSwitchToEmbed?: () => void;
  onProgress?: (currentTime: number, duration: number) => void;
  hasNextEpisode?: boolean;
  onNextEpisode?: () => void;
  movieName?: string;
  movieSlug?: string;
}

const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function VideoPlayer({
  videoUrl,
  autoplay = true,
  poster,
  initialTime = 0,
  onError,
  onEnded,
  onSwitchToEmbed,
  onProgress,
  hasNextEpisode,
  onNextEpisode,
  movieName,
  movieSlug,
}: VideoPlayerProps) {
  // 1. REFS (Defined at the very top)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<HLS | null>(null);
  const router = useRouter();

  const movieNameRef = useRef(movieName);
  const movieSlugRef = useRef(movieSlug);
  const videoUrlRef = useRef(videoUrl);
  const posterRef = useRef(poster);
  
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef<number>(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastProgressSecondRef = useRef<number>(-1);
  const didSeekInitialTimeRef = useRef<boolean>(false);
  const autoplayMutedRef = useRef<boolean>(false);
  const lastNonZeroVolumeRef = useRef<number>(1);

  // Callback Refs to keep useEffect pure and prevent unwanted reload loops
  const onSwitchToEmbedRef = useRef(onSwitchToEmbed);
  onSwitchToEmbedRef.current = onSwitchToEmbed;
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;
  const onNextEpisodeRef = useRef(onNextEpisode);
  onNextEpisodeRef.current = onNextEpisode;
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // 2. STATES
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [seekTime, setSeekTime] = useState<number | null>(null);
  const isSeekingRef = useRef<boolean>(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buffered, setBuffered] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState<number>(-1);
  const [qualities, setQualities] = useState<{ height: number, level: number }[]>([]);
  const retryCountRef = useRef(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [skipAnimation, setSkipAnimation] = useState<{ side: 'left' | 'right', id: number } | null>(null);
  const [shortcutFeedback, setShortcutFeedback] = useState<{
    icon: 'play' | 'pause' | 'volume' | 'mute' | 'seek';
    text?: string;
    id: number;
  } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement | null>(null);
  const waitingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastBufferedRef = useRef<number>(0);

  // Auto Unmute Helper - only unmute if forced muted by autoplay
  const attemptUnmute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (autoplayMutedRef.current) {
      video.muted = false;
      const targetVolume = lastNonZeroVolumeRef.current > 0 ? lastNonZeroVolumeRef.current : 1;
      try { video.volume = targetVolume; } catch (e) {}
      setVolume(targetVolume);
      setIsMuted(false);
      autoplayMutedRef.current = false;
    }
  }, []);

  // Global first user interaction listener to unmute cleanly
  useEffect(() => {
    const onUserInteraction = () => {
      attemptUnmute();
    };

    window.addEventListener('click', onUserInteraction, { capture: true, once: true });
    window.addEventListener('pointerdown', onUserInteraction, { capture: true, once: true });
    window.addEventListener('keydown', onUserInteraction, { capture: true, once: true });

    return () => {
      window.removeEventListener('click', onUserInteraction, { capture: true });
      window.removeEventListener('pointerdown', onUserInteraction, { capture: true });
      window.removeEventListener('keydown', onUserInteraction, { capture: true });
    };
  }, [attemptUnmute]);

  // Close settings menu on outside click
  useEffect(() => {
    if (!showSettings) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [showSettings]);

  // Load saved volume preferences on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedVol = localStorage.getItem('cinema_volume');
    const savedMuted = localStorage.getItem('cinema_muted') === 'true';
    const volNum = savedVol !== null ? Number(savedVol) : 1;
    const initialVol = !isNaN(volNum) && volNum >= 0 && volNum <= 1 ? volNum : 1;
    
    if (initialVol > 0) lastNonZeroVolumeRef.current = initialVol;
    setVolume(savedMuted ? 0 : initialVol);
    setIsMuted(savedMuted);

    if (videoRef.current) {
      videoRef.current.volume = initialVol;
      videoRef.current.muted = savedMuted;
    }
  }, []);

  // 3. ACTIONS (Strictly defined before any useEffect)
  const showControlsHandler = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (videoRef.current && !videoRef.current.paused && countdown === null && !showSettings) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [countdown, showSettings]);

  const togglePlay = useCallback(async () => {
    if (!videoRef.current) return;
    attemptUnmute();

    try {
      if (videoRef.current.paused) {
        if (hlsRef.current) {
          hlsRef.current.startLoad();
        }
        await videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    } catch (err: any) {
      console.warn("Play/Pause error:", err);
      if (err.name === 'NotAllowedError') {
        videoRef.current.muted = true;
        setIsMuted(true);
        autoplayMutedRef.current = true;
        videoRef.current.play().catch(() => {
          setError("Click để phát video");
        });
      } else if (err.name === 'AbortError') {
        console.warn("Play request was interrupted");
      }
    }
    showControlsHandler();
  }, [attemptUnmute, showControlsHandler]);

  const skip = useCallback((seconds: number) => {
    if (videoRef.current) {
      const maxDuration = videoRef.current.duration || 999999;
      const newTime = Math.max(0, Math.min(maxDuration, videoRef.current.currentTime + seconds));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      showControlsHandler();
    }
  }, [showControlsHandler]);

  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0];
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
      if (newVolume > 0) {
        lastNonZeroVolumeRef.current = newVolume;
        localStorage.setItem('cinema_volume', String(newVolume));
        localStorage.setItem('cinema_muted', 'false');
      } else {
        localStorage.setItem('cinema_muted', 'true');
      }
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
      autoplayMutedRef.current = false;
    }
  }, []);

  const handleSeekChange = useCallback((value: number[]) => {
    isSeekingRef.current = true;
    setSeekTime(value[0]);
    showControlsHandler();
  }, [showControlsHandler]);

  const handleSeekCommit = useCallback((value: number[]) => {
    const targetTime = value[0];
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
    }
    setCurrentTime(targetTime);
    setSeekTime(null);
    setTimeout(() => {
      isSeekingRef.current = false;
    }, 250);
    showControlsHandler();
  }, [showControlsHandler]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
      localStorage.setItem('cinema_muted', String(nextMuted));
      if (nextMuted) {
        if (videoRef.current.volume > 0) {
          lastNonZeroVolumeRef.current = videoRef.current.volume;
        }
        setVolume(0);
      } else {
        const restoredVolume = Math.max(0.1, lastNonZeroVolumeRef.current || 1);
        videoRef.current.volume = restoredVolume;
        setVolume(restoredVolume);
        localStorage.setItem('cinema_volume', String(restoredVolume));
      }
      autoplayMutedRef.current = false;
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current || !videoRef.current) return;
    
    try {
      // Check for iOS Safari specifically
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const video = videoRef.current;
      
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement || 
        (document as any).webkitFullscreenElement || 
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      if (!isCurrentlyFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        } else if (isIOS && (video as any).webkitEnterFullscreen) {
          // Special case for iPhone: use native video fullscreen
          (video as any).webkitEnterFullscreen();
          return; // The browser handles the state for native video fullscreen
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, []);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    if (videoRef.current) { videoRef.current.playbackRate = rate; setPlaybackRate(rate); }
  }, []);

  const handleQualityChange = useCallback((level: number) => {
    if (hlsRef.current) { hlsRef.current.currentLevel = level; setQuality(level); }
  }, []);

  const handleBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/");
  }, [router]);

  // 4. EFFECTS (All defined after actions)

  useEffect(() => { movieNameRef.current = movieName; }, [movieName]);
  useEffect(() => { movieSlugRef.current = movieSlug; }, [movieSlug]);
  useEffect(() => { videoUrlRef.current = videoUrl; }, [videoUrl]);
  useEffect(() => { posterRef.current = poster; }, [poster]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) return;
      if (!videoRef.current) return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      
      const showFeedback = (icon: 'play' | 'pause' | 'volume' | 'mute' | 'seek', text?: string) => {
        setShortcutFeedback({ icon, text, id: Date.now() });
      };

      switch (e.code) {
        case 'Space': case 'KeyK': togglePlay(); break;
        case 'ArrowRight': case 'KeyL': skip(10); setSkipAnimation({ side: 'right', id: Date.now() }); break;
        case 'ArrowLeft': case 'KeyJ': skip(-10); setSkipAnimation({ side: 'left', id: Date.now() }); break;
        case 'ArrowUp':
          const volUp = Math.min(videoRef.current.volume + 0.1, 1);
          handleVolumeChange([volUp]); showFeedback('volume', `${Math.round(volUp * 100)}%`); break;
        case 'ArrowDown':
          const volDown = Math.max(videoRef.current.volume - 0.1, 0);
          handleVolumeChange([volDown]); showFeedback('volume', `${Math.round(volDown * 100)}%`); break;
        case 'KeyF': toggleFullscreen(); break;
        case 'KeyM': toggleMute(); showFeedback(videoRef.current.muted ? 'mute' : 'volume'); break;
        case 'Digit1': case 'Digit2': case 'Digit3': case 'Digit4': case 'Digit5':
        case 'Digit6': case 'Digit7': case 'Digit8': case 'Digit9': case 'Digit0':
          const percent = e.code === 'Digit0' ? 0 : parseInt(e.code.replace('Digit', '')) * 10;
          if (videoRef.current.duration) { handleSeekCommit([(percent / 100) * videoRef.current.duration]); showFeedback('seek', `${percent}%`); }
          break;
      }
      showControlsHandler();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, skip, handleVolumeChange, handleSeekCommit, toggleMute, toggleFullscreen, showControlsHandler]);

  // Clear shortcut feedback automatically
  useEffect(() => {
    if (shortcutFeedback) {
      const timer = setTimeout(() => setShortcutFeedback(null), 800);
      return () => clearTimeout(timer);
    }
  }, [shortcutFeedback]);

  // HLS/Video Setup
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;
    setError(null); 
    setIsLoading(true);
    retryCountRef.current = 0;
    didSeekInitialTimeRef.current = false;
    lastProgressSecondRef.current = -1;

    // Detect mobile and iOS Safari
    const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    // Strict inline video playback configuration for iOS Safari
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('x5-playsinline', 'true');
    video.setAttribute('x5-video-player-type', 'h5-page');

    const initHls = () => {
      if (HLS.isSupported()) {
        const hls = new HLS({
          enableWorker: true,
          lowLatencyMode: false,
          progressive: !isMobile,
          startFragPrefetch: true,
          
          backBufferLength: isMobile ? 15 : 30,
          maxBufferLength: isMobile ? 45 : 120,
          maxMaxBufferLength: isMobile ? 120 : 600,
          maxBufferSize: isMobile ? 30 * 1000 * 1000 : 128 * 1024 * 1024,
          maxBufferHole: 0.5,
          highBufferWatchdogPeriod: 2,
          nudgeOffset: 0.2,
          nudgeMaxRetry: 5,
          
          startLevel: -1,
          capLevelToPlayerSize: isMobile,
          testBandwidth: true,
          
          abrEwmaDefaultEstimate: isMobile ? 1_500_000 : 2_000_000,
          abrBandWidthFactor: 0.85,
          abrBandWidthUpFactor: 0.7,
          abrEwmaFastLive: 3,
          abrEwmaSlowLive: 9,
          
          manifestLoadingMaxRetry: 6,
          manifestLoadingRetryDelay: 500,
          levelLoadingMaxRetry: 6,
          levelLoadingRetryDelay: 500,
          fragLoadingMaxRetry: 8,
          fragLoadingRetryDelay: 500,
          fragLoadingMaxRetryTimeout: 64_000,
          
          manifestLoadingTimeOut: 12_000,
          levelLoadingTimeOut: 12_000,
          fragLoadingTimeOut: 15_000,
          
          xhrSetup: (xhr) => {
            xhr.withCredentials = false;
          }
        });
        
        hlsRef.current = hls;
        hls.loadSource(videoUrl);
        hls.attachMedia(video);

        hls.on(HLS.Events.MANIFEST_PARSED, (e, data) => {
          setIsLoading(false);
          retryCountRef.current = 0;
          
          const availableQualities = data.levels
            .map((l, index) => ({ height: l.height || 0, level: index, bitrate: l.bitrate }))
            .filter(q => q.height > 0)
            .sort((a, b) => b.height - a.height);
          setQualities(availableQualities);
          
          if (autoplay) {
            const isUserMuted = typeof window !== 'undefined' && localStorage.getItem('cinema_muted') === 'true';
            const savedVol = typeof window !== 'undefined' ? Number(localStorage.getItem('cinema_volume') || 1) : 1;
            const targetVol = savedVol > 0 ? savedVol : 1;

            try { video.volume = targetVol; } catch (e) {}
            video.muted = isUserMuted;

            video.play().catch(() => {
              // If unmuted autoplay is blocked by browser policy
              if (!isUserMuted) {
                autoplayMutedRef.current = true;
                video.muted = true;
                setIsMuted(true);
                video.play().catch(() => setIsLoading(false));
              } else {
                setIsLoading(false);
              }
            });
          }
        });

        hls.on(HLS.Events.ERROR, (e, data) => {
          if (data.details === HLS.ErrorDetails.BUFFER_STALLED_ERROR) {
            // Buffer stalled - kickstart load
            if (hlsRef.current) hlsRef.current.startLoad();
            return;
          }
          if (data.fatal) {
            switch (data.type) {
              case HLS.ErrorTypes.NETWORK_ERROR:
                if (retryCountRef.current < 5) {
                  retryCountRef.current += 1;
                  console.warn(`HLS Network error, retrying (${retryCountRef.current}/5)...`);
                  setTimeout(() => {
                    if (hlsRef.current) hlsRef.current.startLoad();
                  }, 800 * retryCountRef.current);
                } else {
                  setError("Lỗi kết nối máy chủ. Vui lòng chuyển sang máy chủ dự phòng.");
                  if (onSwitchToEmbedRef.current) {
                    setTimeout(() => onSwitchToEmbedRef.current?.(), 2000);
                  }
                }
                break;
              case HLS.ErrorTypes.MEDIA_ERROR:
                console.warn("HLS Media error, recovering...");
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                setError("Không thể phát video từ máy chủ này.");
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoUrl;
        video.load();

        const handleLoadedMetadata = () => { 
          setIsLoading(false); 
          if (autoplay) {
            const isUserMuted = typeof window !== 'undefined' && localStorage.getItem('cinema_muted') === 'true';
            const savedVol = typeof window !== 'undefined' ? Number(localStorage.getItem('cinema_volume') || 1) : 1;
            const targetVol = savedVol > 0 ? savedVol : 1;
            try { video.volume = targetVol; } catch (e) {}

            // iOS Safari strictly requires initial autoplay to be muted
            if (isUserMuted || isIOS) {
              video.muted = true;
              autoplayMutedRef.current = !isUserMuted;
              setIsMuted(true);
              video.play().catch(() => setIsLoading(false));
            } else {
              video.muted = false;
              video.play().catch(() => {
                autoplayMutedRef.current = true;
                video.muted = true;
                setIsMuted(true);
                video.play().catch(() => setIsLoading(false));
              });
            }
          }
        };

        const handleCanPlay = () => {
          setIsLoading(false);
        };

        const handleNativeError = () => {
          if (!video.src && !video.currentSrc) return;
          setIsLoading(false);
          setError("Không thể phát video từ nguồn này. Đang chuyển sang máy chủ dự phòng...");
          if (onSwitchToEmbedRef.current) {
            setTimeout(() => onSwitchToEmbedRef.current?.(), 1500);
          }
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('error', handleNativeError);

        return () => {
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);
          video.removeEventListener('canplay', handleCanPlay);
          video.removeEventListener('error', handleNativeError);
        };
      }
    };
    const cleanupNative = initHls();
    return () => { 
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (cleanupNative) cleanupNative();
      video.removeAttribute('src');
      video.load();
    };
  }, [videoUrl, autoplay]);

  // Event Listeners for State
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => {
      if (!isSeekingRef.current) {
        setCurrentTime(video.currentTime);
      }
      if (video.buffered.length > 0) {
        const end = video.buffered.end(video.buffered.length - 1);
        if (Math.abs(end - lastBufferedRef.current) >= 1) {
          lastBufferedRef.current = end;
          setBuffered(end);
        }
      }
      const currentSecond = Math.floor(video.currentTime);
      if (currentSecond !== lastProgressSecondRef.current) { 
        lastProgressSecondRef.current = currentSecond; 
        onProgressRef.current?.(video.currentTime, video.duration || 0); 
      }
    };
    const onEndedEvent = () => {
      if (hasNextEpisode && onNextEpisodeRef.current) {
        setCountdown(5);
        countdownIntervalRef.current = setInterval(() => {
          setCountdown(p => {
            if (p === null || p <= 1) { 
              if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current); 
              onNextEpisodeRef.current?.(); 
              return null; 
            }
            return p - 1;
          });
        }, 1000);
      } else {
        onEndedRef.current?.();
      }
    };
    const onWaiting = () => {
      if (waitingTimerRef.current) clearTimeout(waitingTimerRef.current);
      // Debounce loading spinner by 400ms to avoid flashing spinner on tiny micro-stalls
      waitingTimerRef.current = setTimeout(() => {
        setIsLoading(true);
      }, 400);

      // Stall guard: Nếu xoay vòng quá 5s thì thử khôi phục
      const stallTimeout = setTimeout(() => {
        if (video.paused) return;
        console.warn("Video stalled, attempting recovery...");
        if (hlsRef.current) {
          hlsRef.current.recoverMediaError();
          hlsRef.current.startLoad();
        } else {
          // Native iOS stall recovery: unfreeze by nudging time or re-triggering play
          try {
            if (video.readyState >= 2) {
              video.play().catch(() => {});
            } else if (video.currentTime > 0) {
              video.currentTime = video.currentTime + 0.15;
              video.play().catch(() => {});
            }
          } catch (e) {
            console.warn("Native iOS recovery failed:", e);
          }
        }
      }, 5000);
      video.addEventListener('playing', () => {
        clearTimeout(stallTimeout);
        if (waitingTimerRef.current) {
          clearTimeout(waitingTimerRef.current);
          waitingTimerRef.current = null;
        }
        setIsLoading(false);
      }, { once: true });
    };

    const onErrorEvent = () => {
      if (!video.currentSrc && !video.src) return;
      const err = video.error;
      if (!err) return;
      console.error("Native video error:", err);
      if (err.code === 4) {
        setError("Trình phát mặc định gặp sự cố hoặc định dạng không được hỗ trợ.");
      } else {
        setError("Đã có lỗi xảy ra khi phát video.");
      }
      onErrorRef.current?.(err);
    };

    const hideLoading = () => {
      if (waitingTimerRef.current) {
        clearTimeout(waitingTimerRef.current);
        waitingTimerRef.current = null;
      }
      setIsLoading(false);
    };

    video.addEventListener('canplay', hideLoading);
    video.addEventListener('canplaythrough', hideLoading);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEndedEvent);
    video.addEventListener('play', () => setIsPlaying(true));
    video.addEventListener('pause', () => setIsPlaying(false));
    video.addEventListener('durationchange', () => setDuration(video.duration));
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', hideLoading);
    video.addEventListener('error', onErrorEvent);
    
    return () => {
      if (waitingTimerRef.current) {
        clearTimeout(waitingTimerRef.current);
        waitingTimerRef.current = null;
      }
      video.removeEventListener('canplay', hideLoading);
      video.removeEventListener('canplaythrough', hideLoading);
      video.removeEventListener('playing', hideLoading);
      video.removeEventListener('timeupdate', onTimeUpdate); 
      video.removeEventListener('ended', onEndedEvent);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('error', onErrorEvent);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [hasNextEpisode]);

  // Initial Seek
  useEffect(() => {
    const video = videoRef.current;
    if (!video || initialTime <= 0) return;
    const seek = () => { if (didSeekInitialTimeRef.current || !video.duration) return; video.currentTime = Math.min(initialTime, video.duration - 1); didSeekInitialTimeRef.current = true; };
    video.addEventListener('loadedmetadata', seek);
    setTimeout(seek, 1000);
    return () => video.removeEventListener('loadedmetadata', seek);
  }, [initialTime]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement || 
        (document as any).webkitFullscreenElement || 
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // PiP Storage Cleanup
  useEffect(() => {
    return () => {
      const v = videoRef.current;
      if (v && !v.paused && v.currentTime > 3 && videoUrlRef.current && movieSlugRef.current) {
        pipStore.set({ videoUrl: videoUrlRef.current, movieName: movieNameRef.current || '', movieSlug: movieSlugRef.current, poster: posterRef.current, currentTime: v.currentTime });
      }
    };
  }, []);

  // Smart Click / Touch
  const handleSmartClick = (e: React.MouseEvent<HTMLDivElement>, side: 'left' | 'right' | 'center') => {
    e.stopPropagation();
    attemptUnmute();

    // Use e.detail for double tap detection
    if (e.detail >= 2) {
      if (side === 'left') { skip(-10); setSkipAnimation({ side: 'left', id: Date.now() }); }
      else if (side === 'right') { skip(10); setSkipAnimation({ side: 'right', id: Date.now() }); }
      else toggleFullscreen();
      return;
    }

    if (!showControls) {
      showControlsHandler();
      return;
    }

    // If controls are currently visible, tapping center toggles play/pause
    if (side === 'center') {
      const willPlay = videoRef.current?.paused;
      setShortcutFeedback({ icon: willPlay ? 'play' : 'pause', id: Date.now() });
      togglePlay();
    } else {
      setShowControls(false);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    }
  };

  // 5. JSX
  return (
    <div 
      ref={containerRef} 
      className={cn(
        "relative bg-black group overflow-hidden select-none w-full aspect-video rounded-xl lg:rounded-2xl shadow-2xl touch-manipulation", 
        isFullscreen && "fixed inset-0 z-[99999] w-screen h-[100dvh] rounded-none aspect-auto"
      )} 
      onMouseMove={showControlsHandler} 
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video 
        ref={videoRef} 
        className="w-full h-full object-contain" 
        poster={poster} 
        playsInline 
        preload="auto" 
      />
      
      {/* Floating Unmute Button if browser forced autoplay muted */}
      {autoplayMutedRef.current && isMuted && (
        <div className="absolute top-4 left-4 z-50 animate-bounce">
          <button
            onClick={(e) => {
              e.stopPropagation();
              attemptUnmute();
            }}
            className="flex items-center gap-2 bg-brand-green hover:bg-brand-green-hover text-cinema-bg font-extrabold text-xs px-3.5 py-2 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.5)] cursor-pointer transition-transform hover:scale-105 active:scale-95"
          >
            <Volume2 className="w-4 h-4" />
            <span>Bấm để bật âm thanh</span>
          </button>
        </div>
      )}

      <div className="absolute inset-0 flex z-10">
        <div className="w-[35%] h-full z-20 cursor-pointer" onClick={(e) => handleSmartClick(e, 'left')} />
        <div className="w-[30%] h-full z-20 cursor-pointer" onClick={(e) => handleSmartClick(e, 'center')} />
        <div className="w-[35%] h-full z-20 cursor-pointer" onClick={(e) => handleSmartClick(e, 'right')} />
      </div>

      {skipAnimation && (
        <div key={skipAnimation.id} className={cn("absolute top-0 bottom-0 flex items-center justify-center w-[30%] z-30 bg-white/5 pointer-events-none animate-in fade-in zoom-in duration-300", skipAnimation.side === 'left' ? "left-0 rounded-r-full" : "right-0 rounded-l-full")} onAnimationEnd={() => setSkipAnimation(null)}>
          <div className="flex flex-col items-center text-white">
            {skipAnimation.side === 'left' ? <><ChevronsLeft className="w-12 h-12" /><span>-10s</span></> : <><ChevronsRight className="w-12 h-12" /><span>+10s</span></>}
          </div>
        </div>
      )}

      {shortcutFeedback && (
        <div key={shortcutFeedback.id} className="absolute inset-0 flex items-center justify-center z-[55] pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300 fill-mode-forwards">
            <div className="p-4 bg-white/10 rounded-full">
              {shortcutFeedback.icon === 'play' && <Play className="w-8 h-8 text-white fill-white" />}
              {shortcutFeedback.icon === 'pause' && <Pause className="w-8 h-8 text-white fill-white" />}
              {shortcutFeedback.icon === 'volume' && <Volume2 className="w-8 h-8 text-white" />}
              {shortcutFeedback.icon === 'mute' && <VolumeX className="w-8 h-8 text-red-500" />}
              {shortcutFeedback.icon === 'seek' && <ChevronsRight className="w-8 h-8 text-white" />}
            </div>
            {shortcutFeedback.text && <span className="text-xl font-bold text-white tracking-widest">{shortcutFeedback.text}</span>}
          </div>
        </div>
      )}

      {/* Big Center Play/Pause Button for Mobile & Desktop */}
      <div 
        className={cn(
          "absolute inset-0 flex items-center justify-center z-40 pointer-events-none transition-opacity duration-300",
          showControls && !isLoading && countdown === null && !error ? "opacity-100" : "opacity-0"
        )}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-2xl pointer-events-auto transition-transform active:scale-90 cursor-pointer"
          aria-label={isPlaying ? "Tạm dừng" : "Phát"}
        >
          {isPlaying ? (
            <Pause className="w-8 h-8 sm:w-10 sm:h-10 fill-current" />
          ) : (
            <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1" />
          )}
        </button>
      </div>

      {isLoading && <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-20 pointer-events-none"><Loader2 className="w-12 h-12 text-primary animate-spin mb-4" /><p className="text-white/80 text-sm font-bold">Đang tải video...</p></div>}

      {countdown !== null && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-[60] backdrop-blur-md">
          <h3 className="text-2xl font-bold text-white mb-2">Tập tiếp theo sau</h3>
          <div className="text-6xl font-black text-primary mb-8 animate-pulse">{countdown}s</div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => { if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current); setCountdown(null); }} className="rounded-full px-8">Hủy</Button>
            <Button className="bg-primary text-black font-bold rounded-full px-8" onClick={onNextEpisode}>Phát ngay</Button>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 px-6 text-center backdrop-blur-md">
          <div className="bg-white/10 p-4 rounded-full mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-white/90 text-sm md:text-base font-semibold mb-6 max-w-md">{error}</p>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                if (hlsRef.current) {
                  hlsRef.current.loadSource(videoUrl);
                  hlsRef.current.startLoad();
                } else if (videoRef.current) {
                  videoRef.current.src = videoUrl;
                  videoRef.current.load();
                }
              }}
              variant="outline"
              className="text-white border-white/20 hover:bg-white/10 font-bold"
            >
              Thử lại
            </Button>
            {onSwitchToEmbed && (
              <Button onClick={() => onSwitchToEmbedRef.current?.()} className="bg-primary text-black font-bold">
                Phát bằng Máy chủ Dự phòng
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Bottom controls bar */}
      <div className={cn("absolute bottom-0 left-0 right-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 z-50 pointer-events-none", showControls ? "opacity-100" : "opacity-0")}>
        <div className="px-4 pb-0 pointer-events-auto">
          <Slider 
            value={[seekTime !== null ? seekTime : currentTime]} 
            min={0} 
            max={duration > 0 ? duration : 100} 
            step={1}
            onValueChange={handleSeekChange} 
            onValueCommit={handleSeekCommit} 
            className="py-4 cursor-pointer" 
          />
        </div>
        <div className="px-4 pb-4 flex items-center justify-between gap-4 pointer-events-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={togglePlay} className="text-white hover:bg-white/10 hover:text-brand-green transition-colors cursor-pointer">{isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}</Button>
            <div className="flex items-center gap-2 group/volume">
              <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-white/10 cursor-pointer">{isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</Button>
              <Slider value={[isMuted ? 0 : volume]} min={0} max={1} step={0.01} onValueChange={handleVolumeChange} className="w-20 cursor-pointer" />
            </div>
            <div className="text-white text-xs tabular-nums font-bold">
              {formatTime(seekTime !== null ? seekTime : currentTime)} / {formatTime(duration)}
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Playback Speed Quick Cycle Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const rates = [0.75, 1, 1.25, 1.5, 2];
                const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
                handlePlaybackRateChange(rates[nextIdx]);
              }}
              className="text-white/90 hover:text-white hover:bg-white/15 text-[11px] sm:text-xs font-bold px-2 py-1 rounded-lg border border-white/10 transition-colors cursor-pointer"
              title="Tốc độ phát"
            >
              {playbackRate}x
            </button>

            {/* Quality & Settings Menu */}
            <div className="relative" ref={settingsMenuRef}>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettings(prev => !prev);
                }}
                className={cn(
                  "text-white hover:bg-white/10 transition-colors cursor-pointer w-8 h-8 sm:w-9 sm:h-9",
                  showSettings && "bg-white/20 text-brand-green"
                )}
                title="Cài đặt chất lượng & tốc độ"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>

              {/* Settings Floating Panel */}
              {showSettings && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-11 right-0 w-60 sm:w-64 bg-[#0d1117]/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-3 shadow-[0_10px_40px_rgba(0,0,0,0.85)] z-50 text-white animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-2.5"
                >
                  {/* Quality Selection */}
                  <div className="flex flex-col gap-1">
                    <div className="text-[10px] sm:text-[11px] font-bold text-white/50 uppercase tracking-wider px-1">
                      Chất lượng video
                    </div>
                    <div className="flex flex-col gap-0.5 max-h-36 overflow-y-auto pr-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          handleQualityChange(-1);
                          setShowSettings(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer",
                          quality === -1
                            ? "bg-brand-green/20 text-brand-green font-bold"
                            : "hover:bg-white/10 text-white/80"
                        )}
                      >
                        <span>Tự động (Tối ưu tốc độ)</span>
                        {quality === -1 && <Check className="w-3.5 h-3.5 text-brand-green" />}
                      </button>
                      {qualities.map((q) => (
                        <button
                          key={q.level}
                          type="button"
                          onClick={() => {
                            handleQualityChange(q.level);
                            setShowSettings(false);
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer",
                            quality === q.level
                              ? "bg-brand-green/20 text-brand-green font-bold"
                              : "hover:bg-white/10 text-white/80"
                          )}
                        >
                          <span>{q.height}p {q.height >= 1080 ? "Full HD" : q.height >= 720 ? "HD" : ""}</span>
                          {quality === q.level && <Check className="w-3.5 h-3.5 text-brand-green" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-[1px] bg-white/10" />

                  {/* Playback Speed */}
                  <div className="flex flex-col gap-1">
                    <div className="text-[10px] sm:text-[11px] font-bold text-white/50 uppercase tracking-wider px-1">
                      Tốc độ phát
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => {
                            handlePlaybackRateChange(rate);
                            setShowSettings(false);
                          }}
                          className={cn(
                            "py-1 rounded-md text-xs font-bold transition-colors cursor-pointer text-center",
                            playbackRate === rate
                              ? "bg-brand-green text-cinema-bg"
                              : "bg-white/5 hover:bg-white/15 text-white/80"
                          )}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white hover:bg-white/10 cursor-pointer w-8 h-8 sm:w-9 sm:h-9">
              {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
