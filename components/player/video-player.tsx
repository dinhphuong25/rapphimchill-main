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
  Tv,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
export type VideoFitMode = 'contain' | 'cover' | 'fill' | '4:3' | '21:9';

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
  const hasUserInteractedRef = useRef<boolean>(false);
  const lastTimeUpdateRef = useRef<number>(0);
  const lastTapRef = useRef<{ time: number; side: 'left' | 'right' | 'center' }>({ time: 0, side: 'center' });
  const singleTapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevVideoUrlRef = useRef<string>("");

  // Callback Refs to keep useEffect pure and prevent unwanted reload loops
  const initialTimeRef = useRef(initialTime);
  initialTimeRef.current = initialTime;
  const autoplayRef = useRef(autoplay);
  autoplayRef.current = autoplay;
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
  const [settingsTab, setSettingsTab] = useState<'quality' | 'speed' | 'filter' | 'fit'>('quality');
  const [videoFit, setVideoFit] = useState<VideoFitMode>('contain');
  const [containerAspect, setContainerAspect] = useState<number>(16 / 9);
  const [visualFilter, setVisualFilter] = useState<'normal' | 'oled' | 'vivid' | 'bright'>('normal');
  const [currentLevelPlaying, setCurrentLevelPlaying] = useState<number>(-1);
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);
  const [hasRenderedFirstFrame, setHasRenderedFirstFrame] = useState(false);
  const slowNetworkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const settingsMenuRef = useRef<HTMLDivElement | null>(null);
  const waitingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastBufferedRef = useRef<number>(0);
  // Anti-Ad Banner Shield (Tự động phát hiện & che dải quảng cáo bài bạc ở mép trên)
  const [adShieldMode, setAdShieldMode] = useState<'auto' | 'always' | 'off'>('auto');
  const [isAdDetected, setIsAdDetected] = useState(false);
  const [showShieldBadge, setShowShieldBadge] = useState(false);
  const detectorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const consecutiveDetectionsRef = useRef(0);
  const consecutiveMissesRef = useRef(0);
  const prevFrameLuminanceRef = useRef<Uint8Array | null>(null);
  const badgeTimerRef = useRef<NodeJS.Timeout | null>(null);



  // Auto Unmute Helper - immediately unmute and restore audio whenever called
  const attemptUnmute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!video.muted && !autoplayMutedRef.current) return;

    video.muted = false;
    const targetVolume = lastNonZeroVolumeRef.current > 0 ? lastNonZeroVolumeRef.current : 1;
    try { video.volume = targetVolume; } catch (e) {}
    setVolume(targetVolume);
    setIsMuted(false);
    autoplayMutedRef.current = false;
    try { localStorage.setItem('cinema_muted', 'false'); } catch (e) {}
  }, []);

  // Global user interaction listener to unmute cleanly on first gesture if restricted
  useEffect(() => {
    const cleanupListeners = () => {
      window.removeEventListener('click', onUserInteraction, { capture: true });
      window.removeEventListener('pointerdown', onUserInteraction, { capture: true });
      window.removeEventListener('touchstart', onUserInteraction, { capture: true });
      window.removeEventListener('touchend', onUserInteraction, { capture: true });
      window.removeEventListener('keydown', onUserInteraction, { capture: true });
    };

    const onUserInteraction = () => {
      hasUserInteractedRef.current = true;
      attemptUnmute();
      cleanupListeners();
    };

    window.addEventListener('click', onUserInteraction, { capture: true });
    window.addEventListener('pointerdown', onUserInteraction, { capture: true });
    window.addEventListener('touchstart', onUserInteraction, { capture: true });
    window.addEventListener('touchend', onUserInteraction, { capture: true });
    window.addEventListener('keydown', onUserInteraction, { capture: true });

    return cleanupListeners;
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

  // Load saved volume preferences on mount - ensure sound is ALWAYS enabled when opening
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedVol = localStorage.getItem('cinema_volume');
    const volNum = savedVol !== null ? Number(savedVol) : 1;
    const initialVol = !isNaN(volNum) && volNum > 0 && volNum <= 1 ? volNum : 1;
    
    lastNonZeroVolumeRef.current = initialVol;
    setVolume(initialVol);
    setIsMuted(false);
    try { localStorage.setItem('cinema_muted', 'false'); } catch (e) {}

    if (videoRef.current) {
      videoRef.current.volume = initialVol;
      videoRef.current.muted = false;
    }

    try {
      // Remove obsolete global visual filter key so it never leaks across movies
      localStorage.removeItem('cinema_visual_filter');
      const savedFit = localStorage.getItem('cinema_video_fit') as VideoFitMode;
      if (savedFit && ['contain', 'cover', 'fill', '4:3', '21:9'].includes(savedFit)) {
        setVideoFit(savedFit);
      }
    } catch (e) {}
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
        setIsLoading(false);
        if (hlsRef.current) {
          hlsRef.current.startLoad();
        }
        // Always play unmuted with full sound on user action
        videoRef.current.muted = false;
        setIsMuted(false);
        autoplayMutedRef.current = false;
        await videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    } catch (err: any) {
      console.warn("Play/Pause error:", err);
      if (err.name === 'NotAllowedError') {
        videoRef.current.muted = true;
        try {
          await videoRef.current.play();
        } catch (e) {
          setIsLoading(false);
          setError("Click để phát video");
        }
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
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      toast.info(`Tốc độ phát: ${rate === 1 ? '1.0x (Chuẩn)' : `${rate}x`}`);
    }
  }, []);

  const handleQualityChange = useCallback((level: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
      setQuality(level);
      if (level === -1) {
        toast.info("Chất lượng: Tự động (Thích ứng theo mạng)");
      } else {
        const selected = qualities.find(q => q.level === level);
        toast.success(`Chất lượng: ${selected?.height || ''}p Siêu Nét`);
      }
    }
  }, [qualities]);

  const handleVisualFilterChange = useCallback((filter: 'normal' | 'oled' | 'vivid' | 'bright') => {
    setVisualFilter(filter);
    const slug = movieSlugRef.current;
    if (slug) {
      try {
        if (filter === 'normal') {
          localStorage.removeItem(`cinema_visual_filter_${slug}`);
        } else {
          localStorage.setItem(`cinema_visual_filter_${slug}`, filter);
        }
      } catch (e) {}
    }
    try { localStorage.removeItem('cinema_visual_filter'); } catch (e) {}

    const label = filter === 'oled' 
      ? 'OLED Cinema Pro (Đề xuất)' 
      : filter === 'vivid' 
      ? 'Sống động (Vivid Colors)' 
      : filter === 'bright'
      ? 'Sáng rõ (Night Clarify)'
      : 'Chuẩn (Natural)';
    toast.success(`Chế độ màu: ${label}`);
  }, []);

  const handleVideoFitChange = useCallback((newFit: VideoFitMode) => {
    setVideoFit(newFit);
    try {
      localStorage.setItem('cinema_video_fit', newFit);
    } catch (e) {}

    const titles: Record<VideoFitMode, string> = {
      contain: 'Mặc định (16:9)',
      cover: 'Phóng to lấp đầy (Zoom Fill)',
      '4:3': 'Tỷ lệ 4:3 (TV/Anime)',
      '21:9': 'Điện ảnh (21:9)',
      fill: 'Kéo giãn (Stretch)',
    };
    toast.success(`Tỷ lệ: ${titles[newFit] || newFit}`);
  }, []);

  // Track container width/height ratio for responsive aspect fitting
  useEffect(() => {
    const updateAspect = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        if (w > 0 && h > 0) {
          setContainerAspect(w / h);
        }
      }
    };
    updateAspect();
    window.addEventListener('resize', updateAspect);
    return () => window.removeEventListener('resize', updateAspect);
  }, [isFullscreen]);

  // Compute CSS transform & fit styling for <video>
  const getVideoTransformStyle = useCallback((): React.CSSProperties => {
    switch (videoFit) {
      case 'cover': {
        // Trên màn hình siêu rộng (màn hình 21:9 hoặc điện thoại tràn viền), object-fit: cover tự lấp đầy
        // Trên màn 16:9 chuẩn, scale(1.334) phóng to 133.4% để cắt sạch 2 viền đen trên dưới (letterbox 2.35:1)
        const scale = containerAspect > 2.0 ? 1 : 1.334;
        return {
          objectFit: 'cover',
          transform: `translateZ(0) scale(${scale})`,
          transformOrigin: 'center center',
        };
      }
      case 'fill': {
        return {
          objectFit: 'fill',
          transform: 'translateZ(0) scale(1)',
          transformOrigin: 'center center',
        };
      }
      case '4:3': {
        // Tỷ lệ chuẩn 4:3 = 1.3333 so với 16:9 (1.7777) => co lại 75% chiều ngang
        return {
          objectFit: 'fill',
          transform: 'translateZ(0) scaleX(0.75)',
          transformOrigin: 'center center',
        };
      }
      case '21:9': {
        // Tỷ lệ chuẩn 21:9 = 2.3333 so với 16:9 (1.7777) => ép 76.2% chiều cao
        return {
          objectFit: 'fill',
          transform: 'translateZ(0) scaleY(0.762)',
          transformOrigin: 'center center',
        };
      }
      case 'contain':
      default: {
        return {
          objectFit: 'contain',
          transform: 'translateZ(0) scale(1)',
          transformOrigin: 'center center',
        };
      }
    }
  }, [videoFit, containerAspect]);

  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled && (video as any).requestPictureInPicture) {
        await (video as any).requestPictureInPicture();
      }
    } catch (err) {
      console.warn("PiP error:", err);
    }
  }, []);

  const handleBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/");
  }, [router]);

  useEffect(() => { movieNameRef.current = movieName; }, [movieName]);
  useEffect(() => { movieSlugRef.current = movieSlug; }, [movieSlug]);

  // Chế độ màu luôn mặc định là 'normal' (Chuẩn), chỉ nạp lại nếu người dùng đã chỉnh riêng cho phim này
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!movieSlug) {
      setVisualFilter('normal');
      return;
    }
    try {
      const savedForMovie = localStorage.getItem(`cinema_visual_filter_${movieSlug}`);
      if (savedForMovie && ['oled', 'vivid', 'bright'].includes(savedForMovie)) {
        setVisualFilter(savedForMovie as any);
      } else {
        setVisualFilter('normal');
      }
    } catch {
      setVisualFilter('normal');
    }
  }, [movieSlug]);
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
        case 'KeyA':
        case 'KeyZ': {
          const modes: VideoFitMode[] = ['contain', 'cover', '4:3', '21:9', 'fill'];
          setVideoFit((prev) => {
            const currentIndex = modes.indexOf(prev);
            const nextMode = modes[(currentIndex + 1) % modes.length];
            handleVideoFitChange(nextMode);
            return nextMode;
          });
          break;
        }
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
  }, [togglePlay, skip, handleVolumeChange, handleSeekCommit, toggleMute, toggleFullscreen, showControlsHandler, handleVideoFitChange]);

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
    const isIOS = typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

    // Strict inline video playback configuration for iOS Safari
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('x5-playsinline', 'true');
    video.setAttribute('x5-video-player-type', 'h5-page');
    video.playsInline = true;
    try { video.crossOrigin = "anonymous"; } catch (e) {}

    // Helper for fast, non-blocking playback start
    const playWithAutoplayFallback = () => {
      setIsLoading(false);
      if (!autoplayRef.current || !video) return;

      const savedVol = typeof window !== 'undefined' ? Number(localStorage.getItem('cinema_volume') || 1) : 1;
      const targetVol = savedVol > 0 ? savedVol : 1;
      try { video.volume = targetVol; } catch (e) {}

      const userAlreadyInteracted = (typeof navigator !== 'undefined' && (navigator as any).userActivation?.hasBeenActive) || hasUserInteractedRef.current;

      if (userAlreadyInteracted) {
        video.muted = false;
        setIsMuted(false);
        autoplayMutedRef.current = false;
        const p = video.play();
        if (p !== undefined) {
          p.then(() => {
            setIsLoading(false);
          }).catch((err) => {
            console.warn("Play blocked despite interaction, falling back to muted autoplay:", err);
            video.muted = true;
            setIsMuted(true);
            autoplayMutedRef.current = true;
            video.play().then(() => setIsLoading(false)).catch(() => setIsLoading(false));
          });
        }
      } else {
        // Attempt unmuted first; if rejected by policy, instantly fallback to muted so frames render immediately (<300ms)
        video.muted = false;
        const p = video.play();
        if (p !== undefined) {
          p.then(() => {
            setIsLoading(false);
            video.muted = false;
            setIsMuted(false);
            autoplayMutedRef.current = false;
          }).catch(() => {
            video.muted = true;
            setIsMuted(true);
            autoplayMutedRef.current = true;
            video.play().then(() => setIsLoading(false)).catch(() => setIsLoading(false));
          });
        }
      }
    };

    const targetStartPosition = initialTimeRef.current > 0 ? initialTimeRef.current : -1;

    // Seamless in-place source switch when changing episode/server (preserves decoder & avoids black flash)
    if (prevVideoUrlRef.current && prevVideoUrlRef.current !== videoUrl) {
      prevVideoUrlRef.current = videoUrl;
      setError(null);
      setIsLoading(true);
      retryCountRef.current = 0;
      didSeekInitialTimeRef.current = false;
      lastProgressSecondRef.current = -1;

      if (hlsRef.current) {
        try {
          hlsRef.current.stopLoad();
          hlsRef.current.config.startPosition = targetStartPosition;
          hlsRef.current.loadSource(videoUrl);
          hlsRef.current.startLoad(targetStartPosition);
          playWithAutoplayFallback();
          return;
        } catch (err) {
          console.warn("Seamless HLS switch fallback to reinit:", err);
        }
      } else if (isIOS && video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoUrl;
        if (targetStartPosition > 0) {
          const onMeta = () => {
            try { video.currentTime = targetStartPosition; } catch (e) {}
          };
          video.addEventListener('loadedmetadata', onMeta, { once: true });
        }
        playWithAutoplayFallback();
        return;
      }
    }

    prevVideoUrlRef.current = videoUrl;
    setHasRenderedFirstFrame(false);
    setIsSlowNetwork(false);

    // Watchdog: If initial load takes more than 3.5s, trigger active buffer recovery and flag slow network
    const slowWatchdog = setTimeout(() => {
      setIsSlowNetwork(true);
      if (hlsRef.current) {
        hlsRef.current.startLoad();
      }
    }, 3500);

    // Watchdog: If still loading after 8s, try recovery once and offer backup
    const fatalWatchdog = setTimeout(() => {
      if (hlsRef.current) {
        hlsRef.current.recoverMediaError();
        hlsRef.current.startLoad();
      }
      setIsSlowNetwork(true);
      setIsLoading(false);
    }, 8000);

    const initHls = () => {
      // 1. Prefer Native HLS for Apple iOS devices (iPhone, iPad)
      // Apple's AVPlayer handles HLS natively with hardware acceleration, avoiding MSE/ManagedMediaSource stalls
      const useNativeHls = isIOS && video.canPlayType('application/vnd.apple.mpegurl');

      if (useNativeHls) {
        const handleReady = () => { 
          setIsLoading(false);
          setIsSlowNetwork(false);
          setHasRenderedFirstFrame(true);
        };

        const handleMetadata = () => {
          setIsLoading(false);
          if (targetStartPosition > 0 && Math.abs(video.currentTime - targetStartPosition) > 1) {
            try { video.currentTime = targetStartPosition; } catch (e) {}
          }
        };

        const handleNativeError = () => { 
          if (!video.src && !video.currentSrc) return;
          console.warn("Native HLS error on video element:", video.error);
          setIsLoading(false);
          if (video.error && (video.error.code === 2 || video.error.code === 4)) {
            if (onSwitchToEmbedRef.current) {
              console.warn("Auto-switching to embed server after native HLS fatal error");
              onSwitchToEmbedRef.current();
            } else {
              setError("Không thể phát video từ nguồn mặc định. Bạn có thể bấm Thử lại hoặc chuyển sang Máy chủ Dự phòng.");
            }
          }
        };

        video.addEventListener('loadedmetadata', handleMetadata);
        video.addEventListener('loadeddata', handleReady);
        video.addEventListener('canplay', handleReady);
        video.addEventListener('canplaythrough', handleReady);
        video.addEventListener('playing', handleReady);
        video.addEventListener('error', handleNativeError);

        video.preload = "auto";
        video.src = videoUrl;
        try { video.load(); } catch (e) {}

        playWithAutoplayFallback();

        return () => {
          video.removeEventListener('loadedmetadata', handleMetadata);
          video.removeEventListener('loadeddata', handleReady);
          video.removeEventListener('canplay', handleReady);
          video.removeEventListener('canplaythrough', handleReady);
          video.removeEventListener('playing', handleReady);
          video.removeEventListener('error', handleNativeError);
        };
      } else if (HLS.isSupported()) {
        const hls = new HLS({
          enableWorker: true,
          lowLatencyMode: false,
          progressive: false,
          startFragPrefetch: true,
          autoStartLoad: true,
          startPosition: targetStartPosition,
          
          backBufferLength: 30,
          maxBufferLength: isMobile ? 60 : 90,
          maxMaxBufferLength: isMobile ? 120 : 240,
          maxBufferSize: 64 * 1024 * 1024,
          maxBufferHole: 0.5,
          highBufferWatchdogPeriod: 2,
          nudgeOffset: 0.2,
          nudgeMaxRetry: 10,
          
          startLevel: -1,
          capLevelToPlayerSize: isMobile,
          testBandwidth: true,
          
          abrEwmaDefaultEstimate: 1_200_000,
          abrBandWidthFactor: 0.8,
          abrBandWidthUpFactor: 0.7,
          
          manifestLoadingMaxRetry: 4,
          manifestLoadingRetryDelay: 500,
          levelLoadingMaxRetry: 4,
          levelLoadingRetryDelay: 500,
          fragLoadingMaxRetry: 5,
          fragLoadingRetryDelay: 500,
          fragLoadingMaxRetryTimeout: 15_000,
          
          manifestLoadingTimeOut: 8_000,
          levelLoadingTimeOut: 8_000,
          fragLoadingTimeOut: 10_000,
          
          xhrSetup: (xhr) => {
            xhr.withCredentials = false;
          }
        });
        
        hlsRef.current = hls;
        hls.attachMedia(video);
        hls.loadSource(videoUrl);

        hls.on(HLS.Events.MANIFEST_PARSED, (e, data) => {
          retryCountRef.current = 0;
          const availableQualities = data.levels
            .map((l, index) => ({ height: l.height || 0, level: index, bitrate: l.bitrate }))
            .filter(q => q.height > 0)
            .sort((a, b) => b.height - a.height);
          setQualities(availableQualities);
          playWithAutoplayFallback();
        });

        hls.on(HLS.Events.FRAG_LOADED, () => {
          setIsLoading(false);
          setIsSlowNetwork(false);
        });

        hls.on(HLS.Events.FRAG_PARSED, () => {
          setIsLoading(false);
        });

        hls.on(HLS.Events.LEVEL_LOADED, () => {
          setIsLoading(false);
        });

        hls.on(HLS.Events.LEVEL_SWITCHED, (e, data) => {
          setCurrentLevelPlaying(data.level);
        });

        hls.on(HLS.Events.ERROR, (e, data) => {
          if (data.details === HLS.ErrorDetails.BUFFER_STALLED_ERROR) {
            setIsSlowNetwork(true);
            if (hlsRef.current) hlsRef.current.startLoad();
            return;
          }
          if (data.fatal) {
            switch (data.type) {
              case HLS.ErrorTypes.NETWORK_ERROR:
                if (retryCountRef.current < 3) {
                  retryCountRef.current += 1;
                  console.warn(`HLS Network error, retrying (${retryCountRef.current}/3)...`);
                  setIsSlowNetwork(true);
                  setTimeout(() => {
                    if (hlsRef.current) hlsRef.current.startLoad();
                  }, 600 * retryCountRef.current);
                } else {
                  if (onSwitchToEmbedRef.current) {
                    console.warn("Auto-switching to embed server after HLS network errors");
                    onSwitchToEmbedRef.current();
                  } else {
                    setError("Không thể kết nối máy chủ mặc định do giờ cao điểm. Bạn có thể bấm Thử lại hoặc chuyển sang Máy chủ Dự phòng.");
                  }
                }
                break;
              case HLS.ErrorTypes.MEDIA_ERROR:
                console.warn("HLS Media error, recovering...");
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                if (onSwitchToEmbedRef.current) {
                  onSwitchToEmbedRef.current();
                } else {
                  setError("Không thể phát video từ máy chủ này.");
                }
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Fallback Native HLS for Safari without MSE
        const handleReady = () => { 
          setIsLoading(false); 
        };

        const handleMetadata = () => {
          setIsLoading(false);
          if (targetStartPosition > 0 && Math.abs(video.currentTime - targetStartPosition) > 1) {
            try { video.currentTime = targetStartPosition; } catch (e) {}
          }
        };

        const handleNativeError = () => { 
          if (!video.src && !video.currentSrc) return;
          console.warn("Native HLS error on video element:", video.error);
          setIsLoading(false);
          if (onSwitchToEmbedRef.current) {
            console.warn("Auto-switching to embed server after native HLS error");
            onSwitchToEmbedRef.current();
          } else {
            setError("Không thể phát video từ nguồn mặc định. Bạn có thể bấm Thử lại hoặc chuyển sang Máy chủ Dự phòng.");
          }
        };

        video.addEventListener('loadedmetadata', handleMetadata);
        video.addEventListener('loadeddata', handleReady);
        video.addEventListener('canplay', handleReady);
        video.addEventListener('canplaythrough', handleReady);
        video.addEventListener('playing', handleReady);
        video.addEventListener('error', handleNativeError);

        video.preload = "auto";
        video.src = videoUrl;

        playWithAutoplayFallback();

        return () => {
          video.removeEventListener('loadedmetadata', handleMetadata);
          video.removeEventListener('loadeddata', handleReady);
          video.removeEventListener('canplay', handleReady);
          video.removeEventListener('canplaythrough', handleReady);
          video.removeEventListener('playing', handleReady);
          video.removeEventListener('error', handleNativeError);
        };
      }
    };

    const cleanupNative = initHls();
    return () => { 
      clearTimeout(slowWatchdog);
      clearTimeout(fatalWatchdog);
      if (cleanupNative) cleanupNative();
    };
  }, [videoUrl]);

  // Full resource cleanup only when VideoPlayer unmounts from page
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      const v = videoRef.current;
      if (v) {
        v.removeAttribute('src');
        v.load();
      }
    };
  }, []);

  // Event Listeners for State
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => {
      const cur = video.currentTime;
      const now = performance.now();
      if (cur > 0.1 && !hasRenderedFirstFrame) {
        setHasRenderedFirstFrame(true);
      }


      // Throttle UI currentTime state updates to ~250ms to save CPU & avoid frame drops on mobile
      if (!isSeekingRef.current && (now - lastTimeUpdateRef.current >= 250 || video.ended)) {
        lastTimeUpdateRef.current = now;
        setCurrentTime(cur);
      }
      if (video.buffered.length > 0) {
        const end = video.buffered.end(video.buffered.length - 1);
        if (Math.abs(end - lastBufferedRef.current) >= 1) {
          lastBufferedRef.current = end;
          setBuffered(end);
        }
      }
      const currentSecond = Math.floor(cur);
      if (currentSecond !== lastProgressSecondRef.current) { 
        lastProgressSecondRef.current = currentSecond; 
        onProgressRef.current?.(cur, video.duration || 0); 
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
    const hideLoading = () => {
      if (waitingTimerRef.current) {
        clearTimeout(waitingTimerRef.current);
        waitingTimerRef.current = null;
      }
      if (slowNetworkTimerRef.current) {
        clearTimeout(slowNetworkTimerRef.current);
        slowNetworkTimerRef.current = null;
      }
      setIsLoading(false);
    };

    const onWaiting = () => {
      // If paused, NEVER show waiting/loading spinner!
      if (video.paused) return;

      // Smart micro-gap auto-skip: If playback hits a tiny timestamp gap in stream, jump it immediately!
      if (video.buffered.length > 0) {
        const cur = video.currentTime;
        for (let i = 0; i < video.buffered.length; i++) {
          const start = video.buffered.start(i);
          if (start > cur && start - cur <= 0.8) {
            video.currentTime = start + 0.05;
            return;
          }
        }
      }

      if (waitingTimerRef.current) clearTimeout(waitingTimerRef.current);
      waitingTimerRef.current = setTimeout(() => {
        if (!video.paused) {
          setIsLoading(true);
        }
      }, 300);

      if (slowNetworkTimerRef.current) clearTimeout(slowNetworkTimerRef.current);
      slowNetworkTimerRef.current = setTimeout(() => {
        if (!video.paused) {
          setIsSlowNetwork(true);
        }
      }, 4000);

      // Safe recovery: if stalled for 3s, trigger HLS load or resume without seek loops
      const stallTimeout = setTimeout(() => {
        if (video.paused) return;
        if (hlsRef.current) {
          hlsRef.current.startLoad();
          if (video.currentTime > 0) {
            video.currentTime += 0.1;
          }
        } else {
          try {
            if (video.readyState >= 2) {
              video.play().catch(() => {});
            }
          } catch (e) {
            console.warn("Native recovery play failed:", e);
          }
        }
      }, 3000);

      const clearWaiting = () => {
        clearTimeout(stallTimeout);
        if (slowNetworkTimerRef.current) {
          clearTimeout(slowNetworkTimerRef.current);
          slowNetworkTimerRef.current = null;
        }
        hideLoading();
      };

      video.addEventListener('playing', clearWaiting, { once: true });
      video.addEventListener('canplay', clearWaiting, { once: true });
      video.addEventListener('pause', clearWaiting, { once: true });
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

    const onPlayEvent = () => {
      setIsPlaying(true);
      setHasRenderedFirstFrame(true);
      setIsSlowNetwork(false);
      hideLoading();
    };
    const onPauseEvent = () => {
      setIsPlaying(false);
      hideLoading();
      if (waitingTimerRef.current) {
        clearTimeout(waitingTimerRef.current);
        waitingTimerRef.current = null;
      }
      if (slowNetworkTimerRef.current) {
        clearTimeout(slowNetworkTimerRef.current);
        slowNetworkTimerRef.current = null;
      }
    };

    video.addEventListener('canplay', hideLoading);
    video.addEventListener('canplaythrough', hideLoading);
    video.addEventListener('loadeddata', hideLoading);
    video.addEventListener('playing', hideLoading);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEndedEvent);
    video.addEventListener('play', onPlayEvent);
    video.addEventListener('pause', onPauseEvent);
    video.addEventListener('durationchange', () => setDuration(video.duration));
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('error', onErrorEvent);
    
    return () => {
      if (waitingTimerRef.current) {
        clearTimeout(waitingTimerRef.current);
        waitingTimerRef.current = null;
      }
      video.removeEventListener('play', onPlayEvent);
      video.removeEventListener('pause', onPauseEvent);
      video.removeEventListener('canplay', hideLoading);
      video.removeEventListener('canplaythrough', hideLoading);
      video.removeEventListener('loadeddata', hideLoading);
      video.removeEventListener('playing', hideLoading);
      video.removeEventListener('timeupdate', onTimeUpdate); 
      video.removeEventListener('ended', onEndedEvent);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('error', onErrorEvent);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [hasNextEpisode]);

  // Initial Seek Fail-safe (Hls.js config handles startPosition natively, this is a fallback for non-HLS or edge cases)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || initialTime <= 0 || didSeekInitialTimeRef.current || hlsRef.current) return;
    const seek = () => {
      if (didSeekInitialTimeRef.current || !video.duration) return;
      if (Math.abs(video.currentTime - initialTime) > 2) {
        try { video.currentTime = Math.min(initialTime, video.duration - 1); } catch (e) {}
      }
      didSeekInitialTimeRef.current = true;
    };
    if (video.readyState >= 1) {
      seek();
    } else {
      video.addEventListener('loadedmetadata', seek, { once: true });
    }
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

  // Intelligent Real-Time Ad Banner Detector Loop
  useEffect(() => {
    if (adShieldMode === 'off') {
      setIsAdDetected(false);
      setShowShieldBadge(false);
      consecutiveDetectionsRef.current = 0;
      prevFrameLuminanceRef.current = null;
      return;
    }
    if (adShieldMode === 'always') {
      setIsAdDetected(true);
      return;
    }

    const checkInterval = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.paused || video.ended || video.readyState < 2) return;

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) return;

      let detected = false;
      try {
        let canvas = detectorCanvasRef.current;
        if (!canvas) {
          canvas = document.createElement('canvas');
          canvas.width = 160;
          canvas.height = 20;
          detectorCanvasRef.current = canvas;
        }
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          // Lấy dải mép trên 5% nơi đóng dấu quảng cáo bài bạc
          const sampleHeight = Math.max(Math.round(vh * 0.05), 10);
          ctx.drawImage(video, 0, 0, vw, sampleHeight, 0, 0, 160, 20);

          const imgData = ctx.getImageData(0, 0, 160, 20);
          const data = imgData.data;

          const currentLum = new Uint8Array(160 * 20);
          let edgeTransitions = 0;
          let brightPixels = 0;
          let darkPixels = 0;

          // Quét ma trận điểm ảnh ngang
          for (let y = 2; y < 18; y++) {
            let prevLum = -1;
            for (let x = 4; x < 156; x++) {
              const idx = (y * 160 + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
              currentLum[y * 160 + x] = lum;

              if (lum > 185) brightPixels++;
              if (lum < 50) darkPixels++;

              if (prevLum >= 0) {
                const diff = Math.abs(lum - prevLum);
                if (diff > 55) edgeTransitions++;
              }
              prevLum = lum;
            }
          }

          // Kiểm tra tính tĩnh (watermark cố định trên khung hình)
          let isTemporallyStatic = false;
          const prevLum = prevFrameLuminanceRef.current;
          if (prevLum && prevLum.length === currentLum.length) {
            let diffSum = 0;
            let comparedPixels = 0;
            for (let i = 0; i < currentLum.length; i += 4) {
              if (currentLum[i] > 160 || currentLum[i] < 60) {
                diffSum += Math.abs(currentLum[i] - prevLum[i]);
                comparedPixels++;
              }
            }
            if (comparedPixels > 30) {
              const avgDiff = diffSum / comparedPixels;
              if (avgDiff < 14) {
                isTemporallyStatic = true;
              }
            }
          }
          prevFrameLuminanceRef.current = currentLum;

          // Quảng cáo cờ bạc: chữ có độ tương phản cao, mật độ cạnh chữ dày và cố định
          if (edgeTransitions >= 65 && brightPixels >= 35 && darkPixels >= 35 && isTemporallyStatic) {
            detected = true;
          }
        }
      } catch {
        // Tuyệt đối không tự suy đoán nếu canvas không đọc được
        detected = false;
      }

      if (detected) {
        consecutiveDetectionsRef.current++;
        consecutiveMissesRef.current = 0;
        // Cần ít nhất 2 lần quét liên tiếp xác nhận có dải quảng cáo tĩnh mới kích hoạt che
        if (consecutiveDetectionsRef.current >= 2) {
          setIsAdDetected((prev) => {
            if (!prev) {
              setShowShieldBadge(true);
              if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);
              badgeTimerRef.current = setTimeout(() => setShowShieldBadge(false), 3000);
            }
            return true;
          });
        }
      } else {
        consecutiveMissesRef.current++;
        // Tắt che ngay lập tức khi không còn quảng cáo
        if (consecutiveMissesRef.current >= 1) {
          consecutiveDetectionsRef.current = 0;
          prevFrameLuminanceRef.current = null;
          setIsAdDetected(false);
          setShowShieldBadge(false);
        }
      }
    }, 1500);

    return () => {
      clearInterval(checkInterval);
      if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);
    };
  }, [adShieldMode]);

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

    // If video is currently paused, tapping or clicking anywhere starts playback immediately (SYNCHRONOUS for mobile gesture permission)
    if (videoRef.current?.paused) {
      togglePlay();
      showControlsHandler();
      return;
    }

    const now = Date.now();
    const isDoubleTap = now - lastTapRef.current.time < 350 && lastTapRef.current.side === side;
    lastTapRef.current = { time: now, side };

    if (isDoubleTap) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      if (side === 'left') {
        skip(-10);
        setSkipAnimation({ side: 'left', id: Date.now() });
      } else if (side === 'right') {
        skip(10);
        setSkipAnimation({ side: 'right', id: Date.now() });
      } else {
        toggleFullscreen();
      }
      return;
    }

    // Single tap when video is already playing
    if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
    singleTapTimerRef.current = setTimeout(() => {
      singleTapTimerRef.current = null;

      // On mobile / touch screens, a single tap toggles controls visibility
      const isMobileDevice = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobileDevice) {
        if (!showControls) {
          showControlsHandler();
        } else {
          setShowControls(false);
          if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        }
        return;
      }

      if (!showControls) {
        showControlsHandler();
        return;
      }

      // If controls are currently visible and video is playing, tapping center pauses
      if (side === 'center') {
        setShortcutFeedback({ icon: 'pause', id: Date.now() });
        togglePlay();
      } else {
        setShowControls(false);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      }
    }, 280);
  };

  // 5. JSX
  return (
    <div 
      ref={containerRef} 
      className={cn(
        "relative bg-black group overflow-hidden select-none w-full aspect-video rounded-xl lg:rounded-2xl shadow-2xl touch-manipulation will-change-transform", 
        isFullscreen && "fixed inset-0 z-[99999] w-screen h-[100dvh] rounded-none aspect-auto"
      )} 
      style={{ transform: "translateZ(0)" }}
      onMouseMove={showControlsHandler} 
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onTouchStart={attemptUnmute}
      onPointerDown={attemptUnmute}
    >
      <video 
        ref={videoRef} 
        className="w-full h-full"
        style={{
          ...getVideoTransformStyle(),
          backfaceVisibility: "hidden",
          filter: visualFilter === 'oled' 
            ? 'contrast(1.20) saturate(1.24) brightness(0.96)' 
            : visualFilter === 'vivid' 
            ? 'contrast(1.10) saturate(1.42) brightness(1.02)' 
            : visualFilter === 'bright'
            ? 'contrast(1.08) saturate(1.12) brightness(1.15)'
            : 'none',
          transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), filter 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          willChange: "transform, filter",
        }}
        poster={poster} 
        playsInline 
        preload="auto" 
        autoPlay={autoplay}
        muted={isMuted}
      />

      {/* Poster Backdrop while video hasn't rendered first frame */}
      {!hasRenderedFirstFrame && poster && (
        <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden transition-opacity duration-700">
          <img
            src={poster}
            alt={movieName || "Movie Poster"}
            className="w-full h-full object-cover filter blur-md scale-105 opacity-30 pointer-events-none"
          />
          <img
            src={poster}
            alt={movieName || "Movie Poster"}
            className="w-full h-full object-contain absolute inset-0 z-10 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50 z-20 pointer-events-none" />
        </div>
      )}

      {/* Intelligent Anti-Ad Banner Shield (Tự động che dải quảng cáo bài bạc ở mép trên) */}
      <div 
        className={cn(
          "absolute top-0 left-0 right-0 z-[28] transition-all duration-500 overflow-hidden pointer-events-none",
          (adShieldMode === 'always' || (adShieldMode === 'auto' && isAdDetected))
            ? "opacity-100 h-9 sm:h-11 md:h-12" 
            : "opacity-0 h-0"
        )}
      >
        <div className="w-full h-full bg-gradient-to-b from-black via-black/85 via-65% to-transparent" />

        {/* Small subtle status badge */}
        {(adShieldMode === 'always' || isAdDetected) && (
          <div className={cn(
            "absolute top-2.5 right-3.5 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-brand-green/30 text-[11px] font-semibold text-brand-green shadow-xl transition-opacity duration-300 pointer-events-auto",
            showShieldBadge ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
          <ShieldCheck className="w-3.5 h-3.5 text-brand-green animate-pulse" />
          <span>Đã tự động che QC cờ bạc</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setAdShieldMode('off');
              toast.info("Đã tạm tắt che quảng cáo");
            }}
            className="ml-1 text-white/50 hover:text-white cursor-pointer p-0.5"
            title="Tắt che quảng cáo"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
        )}
      </div>


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
          !isPlaying && countdown === null && !error ? "opacity-100" : "opacity-0"
        )}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className={cn(
            "w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-2xl transition-transform active:scale-90 cursor-pointer",
            !isPlaying && countdown === null && !error ? "pointer-events-auto" : "pointer-events-none"
          )}
          aria-label={isPlaying ? "Tạm dừng" : "Phát"}
        >
          {isPlaying ? (
            <Pause className="w-8 h-8 sm:w-10 sm:h-10 fill-current" />
          ) : (
            <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1" />
          )}
        </button>
      </div>

      {isLoading && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-30 cursor-pointer pointer-events-auto backdrop-blur-xs"
        >
          <Loader2 className="w-12 h-12 text-brand-green animate-spin mb-3 shadow-[0_0_20px_rgba(34,197,94,0.4)]" />
          <p className="text-white/90 text-sm font-bold tracking-wide">
            {isSlowNetwork ? "Đang tăng tốc bộ đệm giờ cao điểm..." : "Đang tải video..."}
          </p>
          {isSlowNetwork && onSwitchToEmbed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSwitchToEmbed();
              }}
              className="mt-4 px-4 py-2 bg-brand-green/20 hover:bg-brand-green/30 border border-brand-green/50 text-brand-green font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>Phát ngay bằng Máy chủ Dự phòng</span>
            </button>
          )}
        </div>
      )}

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
      <div 
        onClick={(e) => e.stopPropagation()}
        className={cn("absolute bottom-0 left-0 right-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 z-50 pointer-events-none", showControls ? "opacity-100" : "opacity-0")}
      >
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
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }} 
              className="text-white hover:bg-white/10 hover:text-brand-green transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
            </Button>
            <div className="flex items-center gap-2 group/volume">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }} 
                className="text-white hover:bg-white/10 cursor-pointer"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
              <Slider value={[isMuted ? 0 : volume]} min={0} max={1} step={0.01} onValueChange={handleVolumeChange} className="w-20 cursor-pointer" />
            </div>
            <div className="text-white text-xs tabular-nums font-bold">
              {formatTime(seekTime !== null ? seekTime : currentTime)} / {formatTime(duration)}
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Resolution indicator pill */}
            <span className="hidden sm:inline-flex text-[10px] font-black text-brand-green bg-brand-green/10 border border-brand-green/25 px-2 py-0.5 rounded-full uppercase tracking-wider select-none">
              {quality === -1 ? (currentLevelPlaying >= 0 && qualities[currentLevelPlaying] ? `${qualities[currentLevelPlaying].height}p Auto` : "FHD 1080p") : `${qualities.find(q => q.level === quality)?.height || 1080}p FHD`}
            </span>

            {/* PiP Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                togglePiP();
              }}
              title="Hình trong hình (PiP)"
              className="text-white hover:bg-white/10 hover:text-brand-green cursor-pointer w-8 h-8 sm:w-9 sm:h-9"
            >
              <Tv className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>

            {/* Settings Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setShowSettings(!showSettings);
              }}
              title="Cài đặt phát & Chất lượng"
              className={cn(
                "text-white hover:bg-white/10 cursor-pointer w-8 h-8 sm:w-9 sm:h-9 transition-all duration-300",
                showSettings && "text-brand-green rotate-45 bg-white/10"
              )}
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>

            {/* Fullscreen Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }} 
              title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
              className="text-white hover:bg-white/10 cursor-pointer w-8 h-8 sm:w-9 sm:h-9"
            >
              {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Glassmorphism Settings Menu */}
      {showSettings && (
        <div
          ref={settingsMenuRef}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute bottom-12 sm:bottom-14 right-2 sm:right-4 z-[60] w-72 sm:w-80 max-h-[calc(100%-3.25rem)] flex flex-col bg-[#121212]/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-3 text-white shadow-[0_10px_40px_rgba(0,0,0,0.85)] animate-in fade-in zoom-in-95 duration-200 pointer-events-auto select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2 px-1 shrink-0">
            <span className="text-xs font-bold text-white/90 uppercase tracking-wider flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-brand-green" />
              Cài đặt phát & Chất lượng
            </span>
            <span className="text-[10px] font-bold text-brand-green bg-brand-green/10 border border-brand-green/20 px-2 py-0.5 rounded-full">
              {quality === -1 ? (currentLevelPlaying >= 0 && qualities[currentLevelPlaying] ? `${qualities[currentLevelPlaying].height}p Auto` : "FHD Auto") : `${qualities.find(q => q.level === quality)?.height || 1080}p`}
            </span>
          </div>

          {/* Tab selector */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-white/5 rounded-xl mb-2 text-[11px] font-semibold shrink-0">
            <button
              onClick={() => setSettingsTab('quality')}
              className={cn("py-1 rounded-lg transition-all cursor-pointer", settingsTab === 'quality' ? "bg-brand-green text-black font-bold shadow" : "text-white/70 hover:text-white")}
            >
              Nét
            </button>
            <button
              onClick={() => setSettingsTab('speed')}
              className={cn("py-1 rounded-lg transition-all cursor-pointer", settingsTab === 'speed' ? "bg-brand-green text-black font-bold shadow" : "text-white/70 hover:text-white")}
            >
              Tốc độ
            </button>
            <button
              onClick={() => setSettingsTab('filter')}
              className={cn("py-1 rounded-lg transition-all cursor-pointer", settingsTab === 'filter' ? "bg-brand-green text-black font-bold shadow" : "text-white/70 hover:text-white")}
            >
              Màu
            </button>
            <button
              onClick={() => setSettingsTab('fit')}
              className={cn("py-1 rounded-lg transition-all cursor-pointer", settingsTab === 'fit' ? "bg-brand-green text-black font-bold shadow" : "text-white/70 hover:text-white")}
            >
              Tỷ lệ
            </button>
          </div>

          {/* Tab Content: Quality */}
          {settingsTab === 'quality' && (
            <div className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto pr-1">
              <button
                onClick={() => handleQualityChange(-1)}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                  quality === -1 ? "bg-brand-green/15 text-brand-green font-bold border border-brand-green/30" : "hover:bg-white/5 text-white/80"
                )}
              >
                <span>Tự động (Thích ứng theo mạng)</span>
                {quality === -1 && <Check className="w-3.5 h-3.5 text-brand-green" />}
              </button>
              {qualities.length > 0 ? (
                qualities.map((q) => (
                  <button
                    key={q.level}
                    onClick={() => handleQualityChange(q.level)}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                      quality === q.level ? "bg-brand-green/15 text-brand-green font-bold border border-brand-green/30" : "hover:bg-white/5 text-white/80"
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      {q.height >= 1080 ? `${q.height}p FHD (Siêu Nét)` : `${q.height}p HD`}
                      {q.height >= 1080 && <span className="text-[9px] bg-brand-green/20 text-brand-green px-1.5 py-0.2 rounded font-black">PRO</span>}
                    </span>
                    {quality === q.level && <Check className="w-3.5 h-3.5 text-brand-green" />}
                  </button>
                ))
              ) : (
                <div className="px-2.5 py-1.5 text-xs text-white/60 bg-white/5 rounded-xl flex items-center justify-between">
                  <span>FHD 1080p (Chất lượng gốc cao nhất)</span>
                  <Check className="w-3.5 h-3.5 text-brand-green" />
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Speed */}
          {settingsTab === 'speed' && (
            <div className="grid grid-cols-3 gap-1.5 flex-1 min-h-0 overflow-y-auto pr-1 py-1">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  onClick={() => handlePlaybackRateChange(rate)}
                  className={cn(
                    "py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center",
                    playbackRate === rate ? "bg-brand-green text-black font-bold shadow" : "bg-white/5 hover:bg-white/10 text-white/80"
                  )}
                >
                  {rate === 1 ? "1.0x Chuẩn" : `${rate}x`}
                </button>
              ))}
            </div>
          )}

          {/* Tab Content: Color & Visual Filter */}
          {settingsTab === 'filter' && (
            <div className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleVisualFilterChange('normal');
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                  visualFilter === 'normal' 
                    ? "bg-brand-green/20 text-brand-green font-bold border border-brand-green/40 shadow-[0_0_15px_rgba(32,214,107,0.15)]" 
                    : "hover:bg-white/5 text-white/80 border border-transparent"
                )}
              >
                <div className="flex flex-col items-start text-left">
                  <span>Chuẩn (Natural)</span>
                  <span className="text-[10px] text-white/40">Màu sắc gốc mặc định</span>
                </div>
                {visualFilter === 'normal' && <Check className="w-4 h-4 text-brand-green shrink-0" />}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleVisualFilterChange('oled');
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                  visualFilter === 'oled' 
                    ? "bg-brand-green/20 text-brand-green font-bold border border-brand-green/40 shadow-[0_0_15px_rgba(32,214,107,0.15)]" 
                    : "hover:bg-white/5 text-white/80 border border-transparent"
                )}
              >
                <div className="flex flex-col items-start text-left">
                  <span className="flex items-center gap-1.5">
                    OLED Cinema Pro
                    <span className="text-[9px] bg-amber-500/25 text-amber-300 px-1.5 py-0.2 rounded font-black border border-amber-500/30">ĐỀ XUẤT</span>
                  </span>
                  <span className="text-[10px] text-white/40">Đen sâu, tương phản cao, rõ cảnh tối</span>
                </div>
                {visualFilter === 'oled' && <Check className="w-4 h-4 text-brand-green shrink-0" />}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleVisualFilterChange('vivid');
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                  visualFilter === 'vivid' 
                    ? "bg-brand-green/20 text-brand-green font-bold border border-brand-green/40 shadow-[0_0_15px_rgba(32,214,107,0.15)]" 
                    : "hover:bg-white/5 text-white/80 border border-transparent"
                )}
              >
                <div className="flex flex-col items-start text-left">
                  <span>Sống động (Vivid Colors)</span>
                  <span className="text-[10px] text-white/40">Rực rỡ, thích hợp Anime & Hoạt hình</span>
                </div>
                {visualFilter === 'vivid' && <Check className="w-4 h-4 text-brand-green shrink-0" />}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleVisualFilterChange('bright');
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                  visualFilter === 'bright' 
                    ? "bg-brand-green/20 text-brand-green font-bold border border-brand-green/40 shadow-[0_0_15px_rgba(32,214,107,0.15)]" 
                    : "hover:bg-white/5 text-white/80 border border-transparent"
                )}
              >
                <div className="flex flex-col items-start text-left">
                  <span>Sáng rõ (Night Clarify)</span>
                  <span className="text-[10px] text-white/40">Tăng sáng, làm rõ cảnh đêm & phim kinh dị</span>
                </div>
                {visualFilter === 'bright' && <Check className="w-4 h-4 text-brand-green shrink-0" />}
              </button>
            </div>
          )}

          {/* Tab Content: Aspect Ratio */}
          {settingsTab === 'fit' && (
            <div className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto pr-1">
              {[
                { id: 'contain', title: 'Mặc định (16:9)', desc: 'Giữ đúng tỷ lệ gốc chuẩn 16:9' },
                { id: 'cover', title: 'Phóng to lấp đầy (Zoom Fill)', desc: 'Cắt viền đen trên dưới (Zoom 1.33x)' },
                { id: '4:3', title: 'Tỷ lệ 4:3', desc: 'Chuẩn TV & Anime cổ điển' },
                { id: '21:9', title: 'Điện ảnh (21:9)', desc: 'Chuẩn chiếu rạp CinemaScope' },
                { id: 'fill', title: 'Kéo giãn (Stretch)', desc: 'Lấp đầy toàn bộ khung phát' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleVideoFitChange(item.id as VideoFitMode)}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                    videoFit === item.id ? "bg-brand-green/15 text-brand-green font-bold border border-brand-green/30" : "hover:bg-white/5 text-white/80"
                  )}
                >
                  <div className="flex flex-col items-start text-left">
                    <span>{item.title}</span>
                    <span className="text-[10px] text-white/40">{item.desc}</span>
                  </div>
                  {videoFit === item.id && <Check className="w-3.5 h-3.5 text-brand-green" />}
                </button>
              ))}
            </div>
          )}

          {/* Quick Anti-Ad Banner Shield Controller */}
          <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between px-1 text-xs shrink-0">
            <span className="flex items-center gap-1.5 text-white/80 font-medium">
              <ShieldCheck className={cn("w-3.5 h-3.5", adShieldMode !== 'off' ? "text-brand-green" : "text-white/40")} />
              Che QC cờ bạc
            </span>
            <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10 text-[10px]">
              {(['auto', 'always', 'off'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAdShieldMode(mode);
                    toast.success(
                      mode === 'auto'
                        ? 'Che QC: Tự động khi phát hiện'
                        : mode === 'always'
                        ? 'Che QC: Luôn che mép trên'
                        : 'Che QC: Đã tắt'
                    );
                  }}
                  className={cn(
                    "px-2 py-0.5 rounded cursor-pointer font-bold transition-all",
                    adShieldMode === mode ? "bg-brand-green text-black" : "text-white/60 hover:text-white"
                  )}
                >
                  {mode === 'auto' ? 'Tự động' : mode === 'always' ? 'Luôn che' : 'Tắt'}
                </button>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
