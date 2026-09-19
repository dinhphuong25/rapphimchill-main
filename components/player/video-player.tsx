"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import HLS from 'hls.js';
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
  FastForward,
  X,
  Sun,
  Subtitles,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { AdRange, fetchAndParseAllAdRanges, extractAllAdRangesFromFragments } from "@/lib/ad-parser";
export type VideoFitMode = 'contain' | 'cover' | 'fill' | '4:3' | '21:9';

export interface SubtitleCue {
  id: number;
  start: number;
  end: number;
  text: string;
}

function parseSubtitles(content: string): SubtitleCue[] {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\n+/);
  const cues: SubtitleCue[] = [];
  let idCounter = 0;

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (!lines.length) continue;

    const timeIndex = lines.findIndex((l) => l.includes('-->'));
    if (timeIndex === -1) continue;

    const timeLine = lines[timeIndex];
    const [startStr, endStr] = timeLine.split('-->').map((s) => s.trim());
    if (!startStr || !endStr) continue;

    const parseTime = (t: string) => {
      const clean = t.replace(',', '.').trim();
      const parts = clean.split(':');
      if (parts.length === 3) {
        return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
      } else if (parts.length === 2) {
        return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
      }
      return 0;
    };

    const start = parseTime(startStr);
    const end = parseTime(endStr);
    const textLines = lines.slice(timeIndex + 1).join('\n').replace(/<[^>]+>/g, '').trim();

    if (textLines && end > start) {
      cues.push({
        id: ++idCounter,
        start,
        end,
        text: textLines,
      });
    }
  }

  return cues;
}

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
  const isPlayingRef = useRef<boolean>(false);
  const currentTimeRef = useRef<number>(0);
  
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
  const [isAutoplayMuted, setIsAutoplayMuted] = useState(false);
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
  const [settingsTab, setSettingsTab] = useState<'quality' | 'speed' | 'sub' | 'filter' | 'fit'>('quality');
  const [videoFit, setVideoFit] = useState<VideoFitMode>('contain');
  const [containerAspect, setContainerAspect] = useState<number>(16 / 9);
  const [visualFilter, setVisualFilter] = useState<'normal' | 'oled' | 'vivid' | 'bright'>('normal');

  // Mobile Touch Gestures & Screen Brightness
  const [brightness, setBrightness] = useState<number>(100);
  const [gestureHUD, setGestureHUD] = useState<{
    type: 'brightness' | 'volume' | 'seek';
    value: number;
    delta?: number;
  } | null>(null);
  const gestureHUDTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{
    x: number;
    y: number;
    time: number;
    zone: 'left' | 'center' | 'right';
    startBrightness: number;
    startVolume: number;
    startTime: number;
    lockedGesture: 'brightness' | 'volume' | 'seek' | null;
  } | null>(null);
  const targetSeekRef = useRef<number | null>(null);

  // Auto-Failover Buffer Recovery
  const stallCountRef = useRef<number>(0);
  const failoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // External Subtitles (.SRT / .VTT)
  const [customCues, setCustomCues] = useState<SubtitleCue[]>([]);
  const [subtitleEnabled, setSubtitleEnabled] = useState<boolean>(true);
  const [subtitleSize, setSubtitleSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [subtitleBg, setSubtitleBg] = useState<'transparent' | 'dim' | 'black'>('dim');
  const subtitleFileInputRef = useRef<HTMLInputElement | null>(null);
  const [currentLevelPlaying, setCurrentLevelPlaying] = useState<number>(-1);
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);
  const [hasRenderedFirstFrame, setHasRenderedFirstFrame] = useState(false);
  const slowNetworkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const settingsMenuRef = useRef<HTMLDivElement | null>(null);
  const waitingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialSlowWatchdogRef = useRef<NodeJS.Timeout | null>(null);
  const initialFatalWatchdogRef = useRef<NodeJS.Timeout | null>(null);
  const lastBufferedRef = useRef<number>(0);

  const clearInitialWatchdogs = useCallback(() => {
    if (initialSlowWatchdogRef.current) {
      clearTimeout(initialSlowWatchdogRef.current);
      initialSlowWatchdogRef.current = null;
    }
    if (initialFatalWatchdogRef.current) {
      clearTimeout(initialFatalWatchdogRef.current);
      initialFatalWatchdogRef.current = null;
    }
    setIsSlowNetwork(false);
  }, []);
  // Anti-Ad Banner Shield (Tự động phát hiện & che dải quảng cáo bài bạc ở mép trên - không hiện thông báo phiền)
  const [adShieldMode, setAdShieldMode] = useState<'auto' | 'always' | 'off'>('auto');
  const [isAdDetected, setIsAdDetected] = useState(false);
  const detectorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const consecutiveDetectionsRef = useRef(0);
  const consecutiveMissesRef = useRef(0);
  const prevFrameLuminanceRef = useRef<Uint8Array | null>(null);

  const handleSetAdShieldMode = useCallback((mode: 'auto' | 'always' | 'off') => {
    setAdShieldMode(mode);
    try {
      localStorage.setItem('cinema_ad_shield', mode);
    } catch (e) {}
  }, []);

  // Auto-Skip Video Ads (Tự động phát hiện & bỏ qua các đoạn video clip quảng cáo nổ hũ/cá độ chèn cắt ngang phim)
  const [autoSkipAds, setAutoSkipAds] = useState<boolean>(true);
  const adRangesRef = useRef<AdRange[]>([]);
  const bannerRangesRef = useRef<AdRange[]>([]);
  const [adRanges, setAdRanges] = useState<AdRange[]>([]);

  const handleToggleAutoSkipAds = useCallback((enabled: boolean) => {
    setAutoSkipAds(enabled);
    try {
      localStorage.setItem('cinema_auto_skip_ads', String(enabled));
    } catch (e) {}
  }, []);

  const handleCancelCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);
  }, []);

  const handlePlayNextImmediately = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);
    onNextEpisodeRef.current?.();
  }, []);

  useEffect(() => {
    if (countdown === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancelCountdown();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [countdown, handleCancelCountdown]);



  // Auto Unmute Helper - immediately unmute and restore audio whenever called
  const attemptUnmute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!video.muted && !autoplayMutedRef.current) {
      setIsAutoplayMuted(false);
      return;
    }

    video.muted = false;
    const targetVolume = lastNonZeroVolumeRef.current > 0 ? lastNonZeroVolumeRef.current : 1;
    try { video.volume = targetVolume; } catch (e) {}
    setVolume(targetVolume);
    setIsMuted(false);
    setIsAutoplayMuted(false);
    autoplayMutedRef.current = false;
    try {
      const p = video.play();
      if (p !== undefined) p.catch(() => {});
    } catch (e) {}
    try { localStorage.setItem('cinema_muted', 'false'); } catch (e) {}
  }, []);

  // Global user interaction listener to unmute & ensure audio is always active on any interaction
  useEffect(() => {
    const onUserInteraction = () => {
      hasUserInteractedRef.current = true;
      const video = videoRef.current;
      if (video) {
        video.muted = false;
        const targetVol = lastNonZeroVolumeRef.current > 0 ? lastNonZeroVolumeRef.current : 1;
        try { video.volume = targetVol; } catch (e) {}
        setIsMuted(false);
        setIsAutoplayMuted(false);
        autoplayMutedRef.current = false;
        if (video.paused && autoplayRef.current) {
          video.play().catch(() => {});
        }
      }
    };

    window.addEventListener('click', onUserInteraction, { capture: true, passive: true });
    window.addEventListener('pointerdown', onUserInteraction, { capture: true, passive: true });
    window.addEventListener('touchstart', onUserInteraction, { capture: true, passive: true });
    window.addEventListener('touchend', onUserInteraction, { capture: true, passive: true });
    window.addEventListener('keydown', onUserInteraction, { capture: true, passive: true });

    return () => {
      window.removeEventListener('click', onUserInteraction, { capture: true });
      window.removeEventListener('pointerdown', onUserInteraction, { capture: true });
      window.removeEventListener('touchstart', onUserInteraction, { capture: true });
      window.removeEventListener('touchend', onUserInteraction, { capture: true });
      window.removeEventListener('keydown', onUserInteraction, { capture: true });
    };
  }, []);

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

      // Khiên chắn quảng cáo cờ bạc luôn cố định ở chế độ thông minh 'auto' (tự động phát hiện & che khi có quảng cáo, không cho tắt)
      setAdShieldMode('auto');
      try { localStorage.setItem('cinema_ad_shield', 'auto'); } catch (e) {}

      // Tải cấu hình tự động bỏ qua video quảng cáo cờ bạc (mặc định luôn BẬT)
      const savedAutoSkip = localStorage.getItem('cinema_auto_skip_ads');
      if (savedAutoSkip === 'false') {
        setAutoSkipAds(false);
      } else {
        setAutoSkipAds(true);
        if (!savedAutoSkip) {
          try { localStorage.setItem('cinema_auto_skip_ads', 'true'); } catch (e) {}
        }
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
        setIsAutoplayMuted(false);
        autoplayMutedRef.current = false;
        await videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    } catch (err: any) {
      console.warn("Play/Pause error:", err);
      if (err.name === 'NotAllowedError') {
        setIsLoading(false);
      } else if (err.name === 'AbortError') {
        console.warn("Play request was interrupted");
      }
    }
    showControlsHandler();
  }, [attemptUnmute, showControlsHandler]);

  const skip = useCallback((seconds: number) => {
    if (videoRef.current) {
      const maxDuration = videoRef.current.duration || 999999;
      let newTime = Math.max(0, Math.min(maxDuration, videoRef.current.currentTime + seconds));
      if (adRangesRef.current.length > 0) {
        for (const range of adRangesRef.current) {
          if (newTime >= range.start - 0.35 && newTime < range.end - 0.1) {
            newTime = seconds >= 0 ? range.end + 0.15 : Math.max(0, range.start - 0.5);
            break;
          }
        }
      }
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
        try { localStorage.setItem('cinema_volume', String(newVolume)); } catch (e) {}
        try { localStorage.setItem('cinema_muted', 'false'); } catch (e) {}
      } else {
        try { localStorage.setItem('cinema_muted', 'true'); } catch (e) {}
      }
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
      setIsAutoplayMuted(false);
      autoplayMutedRef.current = false;
    }
  }, []);

  const handleSeekChange = useCallback((value: number[]) => {
    isSeekingRef.current = true;
    setSeekTime(value[0]);
    showControlsHandler();
  }, [showControlsHandler]);

  const handleSeekCommit = useCallback((value: number[]) => {
    let targetTime = value[0];
    // Tự động bỏ qua quảng cáo nếu người xem tua trúng vào vùng video quảng cáo cờ bạc
    if (adRangesRef.current.length > 0) {
      for (const range of adRangesRef.current) {
        if (targetTime >= range.start - 0.35 && targetTime < range.end - 0.1) {
          targetTime = range.end + 0.15;
          break;
        }
      }
    }
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
      setIsAutoplayMuted(false);
      autoplayMutedRef.current = false;
      if (nextMuted) {
        if (videoRef.current.volume > 0) {
          lastNonZeroVolumeRef.current = videoRef.current.volume;
        }
        setVolume(0);
        try { localStorage.setItem('cinema_muted', 'true'); } catch (e) {}
      } else {
        const restoredVolume = Math.max(0.1, lastNonZeroVolumeRef.current || 1);
        videoRef.current.volume = restoredVolume;
        setVolume(restoredVolume);
        try { localStorage.setItem('cinema_volume', String(restoredVolume)); } catch (e) {}
        try { localStorage.setItem('cinema_muted', 'false'); } catch (e) {}
        try {
          const p = videoRef.current.play();
          if (p !== undefined) p.catch(() => {});
        } catch (e) {}
      }
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

  // Tự động phân tích luồng phát m3u8 để trích xuất dải thời gian các video quảng cáo cờ bạc & banner che
  // Tối ưu băng thông: Nếu Hls.js đang chạy, LEVEL_LOADED sẽ trích xuất trực tiếp từ RAM mà không tốn request mạng.
  // Chỉ chạy fetch dự phòng khi cần thiết và lùi thời gian để ưu tiên 100% băng thông tải segment video đầu tiên.
  useEffect(() => {
    adRangesRef.current = [];
    bannerRangesRef.current = [];
    setAdRanges([]);

    if (!videoUrl) return;

    let isCancelled = false;
    const fetchTimer = setTimeout(() => {
      // Nếu Hls.js đã trích xuất xong từ fragments trong RAM, không cần fetch lại qua mạng
      if (adRangesRef.current.length > 0 || bannerRangesRef.current.length > 0) return;

      fetchAndParseAllAdRanges(videoUrl).then((data) => {
        if (!isCancelled) {
          if (data.commercialRanges.length > 0) {
            adRangesRef.current = data.commercialRanges;
            setAdRanges(data.commercialRanges);
            if (videoRef.current && autoSkipAds) {
              const current = videoRef.current.currentTime;
              for (const range of data.commercialRanges) {
                if (current >= range.start - 0.35 && current < range.end - 0.1) {
                  videoRef.current.currentTime = range.end + 0.15;
                  break;
                }
              }
            }
          }
          if (data.bannerRanges.length > 0) {
            bannerRangesRef.current = data.bannerRanges;
          }
        }
      }).catch(() => {});
    }, 1200);

    return () => {
      isCancelled = true;
      clearTimeout(fetchTimer);
    };
  }, [videoUrl]);

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
    if (!video || !videoUrl) {
      setIsLoading(false);
      return;
    }
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

    // Helper for fast, non-blocking playback start - Always keep sound unmuted
    const playWithAutoplayFallback = () => {
      clearInitialWatchdogs();
      setIsLoading(false);
      if (!autoplayRef.current || !video) return;

      const savedVol = typeof window !== 'undefined' ? Number(localStorage.getItem('cinema_volume') || 1) : 1;
      const targetVol = savedVol > 0 ? savedVol : 1;
      try { video.volume = targetVol; } catch (e) {}

      // Always guarantee unmuted sound
      video.muted = false;
      setIsMuted(false);
      setIsAutoplayMuted(false);
      autoplayMutedRef.current = false;

      const p = video.play();
      if (p !== undefined) {
        p.then(() => {
          clearInitialWatchdogs();
          setIsLoading(false);
          video.muted = false;
          setIsMuted(false);
          setIsAutoplayMuted(false);
          autoplayMutedRef.current = false;
        }).catch((err) => {
          console.warn("Autoplay without sound restriction notice:", err);
          clearInitialWatchdogs();
          setIsLoading(false);
          // Crucial: NEVER mute the video when browser policy restricts initial play!
          // Maintain unmuted state so user receives full audio on interaction or tap.
          video.muted = false;
          setIsMuted(false);
          setIsAutoplayMuted(false);
          autoplayMutedRef.current = false;
        });
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

    // Watchdog: If initial load takes more than 4.5s, trigger active buffer recovery and flag slow network
    if (initialSlowWatchdogRef.current) clearTimeout(initialSlowWatchdogRef.current);
    initialSlowWatchdogRef.current = setTimeout(() => {
      setIsSlowNetwork(true);
      if (hlsRef.current) {
        hlsRef.current.startLoad();
      }
    }, 4500);

    // Watchdog: If still loading after 9s, try recovery once and offer backup
    if (initialFatalWatchdogRef.current) clearTimeout(initialFatalWatchdogRef.current);
    initialFatalWatchdogRef.current = setTimeout(() => {
      if (hlsRef.current) {
        hlsRef.current.recoverMediaError();
        hlsRef.current.startLoad();
      }
      setIsSlowNetwork(true);
      setIsLoading(false);
    }, 9000);

    const initHls = () => {
      // 1. Prefer Native HLS for Apple iOS devices (iPhone, iPad)
      // Apple's AVPlayer handles HLS natively with hardware acceleration, avoiding MSE/ManagedMediaSource stalls
      const useNativeHls = isIOS && video.canPlayType('application/vnd.apple.mpegurl');

      if (useNativeHls) {
        const handleReady = () => { 
          clearInitialWatchdogs();
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
          progressive: true,
          startFragPrefetch: true,
          autoStartLoad: true,
          startPosition: targetStartPosition,
          
          backBufferLength: 15,
          maxBufferLength: isMobile ? 60 : 90,
          maxMaxBufferLength: isMobile ? 120 : 180,
          maxBufferSize: isMobile ? 48 * 1024 * 1024 : 96 * 1024 * 1024,
          maxBufferHole: 0.8,
          highBufferWatchdogPeriod: 2,
          nudgeOffset: 0.1,
          nudgeMaxRetry: 15,
          
          startLevel: -1,
          capLevelToPlayerSize: isMobile,
          testBandwidth: true,
          
          abrEwmaDefaultEstimate: 3_500_000,
          abrBandWidthFactor: 0.85,
          abrBandWidthUpFactor: 0.75,
          
          manifestLoadingMaxRetry: 4,
          manifestLoadingRetryDelay: 500,
          levelLoadingMaxRetry: 4,
          levelLoadingRetryDelay: 500,
          fragLoadingMaxRetry: 5,
          fragLoadingRetryDelay: 500,
          fragLoadingMaxRetryTimeout: 15_000,
          
          manifestLoadingTimeOut: 10_000,
          levelLoadingTimeOut: 10_000,
          fragLoadingTimeOut: 12_000,
          
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
          clearInitialWatchdogs();
          setIsLoading(false);
          setIsSlowNetwork(false);
        });

        hls.on(HLS.Events.FRAG_PARSED, () => {
          clearInitialWatchdogs();
          setIsLoading(false);
        });

        hls.on(HLS.Events.LEVEL_LOADED, (e, data) => {
          clearInitialWatchdogs();
          setIsLoading(false);
          try {
            if (data?.details?.fragments) {
              const parsedData = extractAllAdRangesFromFragments(data.details.fragments);
              if (parsedData?.commercialRanges?.length > 0) {
                adRangesRef.current = parsedData.commercialRanges;
                setAdRanges(parsedData.commercialRanges);
                if (videoRef.current && autoSkipAds) {
                  const current = videoRef.current.currentTime;
                  for (const range of parsedData.commercialRanges) {
                    if (current >= range.start - 0.35 && current < range.end - 0.1) {
                      videoRef.current.currentTime = range.end + 0.15;
                      break;
                    }
                  }
                }
              }
              if (parsedData?.bannerRanges?.length > 0) {
                bannerRangesRef.current = parsedData.bannerRanges;
              }
            }
          } catch (err) {
            console.warn("Non-fatal ad range parse error:", err);
          }
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
      clearInitialWatchdogs();
      if (cleanupNative) cleanupNative();
    };
  }, [videoUrl]);

  // Full resource cleanup only when VideoPlayer unmounts from page
  useEffect(() => {
    const video = videoRef.current;
    return () => {
      // 2. Dọn dẹp tài nguyên HLS và video
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (video) {
        video.removeAttribute('src');
        video.load();
      }
    };
  }, []);

  // Event Listeners for State
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => {
      const cur = video.currentTime;
      currentTimeRef.current = cur;
      const now = performance.now();
      if (cur > 0.05) {
        if (!hasRenderedFirstFrame) {
          setHasRenderedFirstFrame(true);
        }
        clearInitialWatchdogs();
        if (!video.paused) {
          hideLoading();
        }
      }

      // Auto-Skip Video Ads: Tự động tua qua ngay lập tức, không chờ, không hiện nút, không hiện thông báo
      if (adRangesRef.current.length > 0 && !isSeekingRef.current) {
        for (const range of adRangesRef.current) {
          if (cur >= range.start - 0.35 && cur < range.end - 0.1) {
            video.currentTime = range.end + 0.15;
            return;
          }
        }
      }

      // Tự động kích hoạt khiên che banner ngay lập tức nếu đang trong phân đoạn banner (convertv8)
      if (adShieldMode === 'auto' && bannerRangesRef.current.length > 0) {
        let inBannerRange = false;
        for (const range of bannerRangesRef.current) {
          if (cur >= range.start - 0.5 && cur <= range.end + 0.5) {
            inBannerRange = true;
            break;
          }
        }
        if (inBannerRange) {
          setIsAdDetected(true);
        }
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
      clearInitialWatchdogs();
      setIsLoading(false);
    };

    const onWaiting = () => {
      // If paused or ended, NEVER show waiting/loading spinner!
      if (video.paused || video.ended) return;

      // Smart buffer check: If playback has buffer ahead, do NOT stall
      if (video.buffered.length > 0) {
        const cur = video.currentTime;
        for (let i = 0; i < video.buffered.length; i++) {
          const start = video.buffered.start(i);
          const end = video.buffered.end(i);
          // If current playhead is comfortably buffered >= 0.4s ahead, ignore spurious waiting event
          if (cur >= start - 0.1 && end - cur >= 0.4) {
            return;
          }
          // Smart micro-gap auto-skip: If playback hits a tiny timestamp gap in stream, jump it immediately!
          if (start > cur && start - cur <= 0.8) {
            video.currentTime = start + 0.05;
            return;
          }
        }
      }

      if (waitingTimerRef.current) clearTimeout(waitingTimerRef.current);
      waitingTimerRef.current = setTimeout(() => {
        // Only trigger loading if the video is genuinely stuck and not playing frames
        if (!video.paused && !video.ended && video.readyState < 3) {
          setIsLoading(true);
        }
      }, 600);

      if (slowNetworkTimerRef.current) clearTimeout(slowNetworkTimerRef.current);
      slowNetworkTimerRef.current = setTimeout(() => {
        if (!video.paused && !video.ended && video.readyState < 3) {
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

      // Smart Auto-Failover: If stalled for > 6.5s continuously
      if (failoverTimeoutRef.current) clearTimeout(failoverTimeoutRef.current);
      failoverTimeoutRef.current = setTimeout(() => {
        if (video.paused) return;
        stallCountRef.current += 1;
        if (hlsRef.current) {
          try {
            hlsRef.current.recoverMediaError();
          } catch {}
        }
        if (stallCountRef.current >= 2 && onSwitchToEmbedRef.current) {
          toast.info("Đường truyền chính gặp sự cố, tự động chuyển sang Máy chủ Dự phòng...");
          onSwitchToEmbedRef.current();
        }
      }, 6500);

      const clearWaiting = () => {
        clearTimeout(stallTimeout);
        if (failoverTimeoutRef.current) {
          clearTimeout(failoverTimeoutRef.current);
          failoverTimeoutRef.current = null;
        }
        stallCountRef.current = 0;
        if (slowNetworkTimerRef.current) {
          clearTimeout(slowNetworkTimerRef.current);
          slowNetworkTimerRef.current = null;
        }
        hideLoading();
      };

      video.addEventListener('playing', clearWaiting, { once: true });
      video.addEventListener('canplay', clearWaiting, { once: true });
      video.addEventListener('canplaythrough', clearWaiting, { once: true });
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

    const checkAndSkipIfInAdRange = () => {
      if (adRangesRef.current.length > 0 && video) {
        const cur = video.currentTime;
        for (const range of adRangesRef.current) {
          if (cur >= range.start - 0.35 && cur < range.end - 0.1) {
            video.currentTime = range.end + 0.15;
            break;
          }
        }
      }
    };

    const onPlayEvent = () => {
      isPlayingRef.current = true;
      setIsPlaying(true);
      setHasRenderedFirstFrame(true);
      clearInitialWatchdogs();
      setIsSlowNetwork(false);
      hideLoading();
      checkAndSkipIfInAdRange();

      // Đảm bảo không bật Picture-in-Picture và cập nhật MediaSession state
      try {
        video.disablePictureInPicture = true;
        video.removeAttribute('autopictureinpicture');
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing';
        }
      } catch {}
    };
    const onPauseEvent = () => {
      isPlayingRef.current = false;
      setIsPlaying(false);
      hideLoading();
      try {
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'paused';
        }
      } catch {}
      if (waitingTimerRef.current) {
        clearTimeout(waitingTimerRef.current);
        waitingTimerRef.current = null;
      }
      if (slowNetworkTimerRef.current) {
        clearTimeout(slowNetworkTimerRef.current);
        slowNetworkTimerRef.current = null;
      }
    };

    const onSeekedEvent = () => {
      checkAndSkipIfInAdRange();
    };

    const onProgressBufferCheck = () => {
      if (video.buffered.length > 0 && !video.paused) {
        const cur = video.currentTime;
        for (let i = 0; i < video.buffered.length; i++) {
          if (cur >= video.buffered.start(i) && video.buffered.end(i) - cur >= 0.5) {
            hideLoading();
            break;
          }
        }
      }
    };

    video.addEventListener('canplay', hideLoading);
    video.addEventListener('canplaythrough', hideLoading);
    video.addEventListener('loadeddata', hideLoading);
    video.addEventListener('playing', hideLoading);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('progress', onProgressBufferCheck);
    video.addEventListener('seeked', onSeekedEvent);
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
      video.removeEventListener('seeked', onSeekedEvent);
      video.removeEventListener('canplay', hideLoading);
      video.removeEventListener('canplaythrough', hideLoading);
      video.removeEventListener('loadeddata', hideLoading);
      video.removeEventListener('playing', hideLoading);
      video.removeEventListener('timeupdate', onTimeUpdate); 
      video.removeEventListener('progress', onProgressBufferCheck);
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

  // Intelligent Real-Time Ad Banner Detector Loop (Tự động phát hiện banner cờ bạc mép trên)
  useEffect(() => {
    if (adShieldMode === 'off') {
      setIsAdDetected(false);
      consecutiveDetectionsRef.current = 0;
      prevFrameLuminanceRef.current = null;
      return;
    }
    if (adShieldMode === 'always') {
      setIsAdDetected(true);
      return;
    }

    // Chế độ 'auto': bắt đầu ở trạng thái không che, chỉ che khi thực tế quét thấy banner
    setIsAdDetected(false);
    consecutiveDetectionsRef.current = 0;
    consecutiveMissesRef.current = 0;
    prevFrameLuminanceRef.current = null;

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
          canvas.height = 36;
          detectorCanvasRef.current = canvas;
        }
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          // Lấy dải mép trên 22% nơi đóng dấu quảng cáo bài bạc (kể cả phim tỉ lệ 2.35:1 có letterbox)
          const sampleHeight = Math.max(Math.round(vh * 0.22), 36);
          ctx.drawImage(video, 0, 0, vw, sampleHeight, 0, 0, 160, 36);

          const imgData = ctx.getImageData(0, 0, 160, 36);
          const data = imgData.data;

          const currentLum = new Uint8Array(160 * 36);
          let edgeTransitions = 0;
          let brightPixels = 0;
          let darkPixels = 0;

          // Quét ma trận điểm ảnh ngang từ hàng 2 đến 34
          for (let y = 2; y < 35; y++) {
            let prevLum = -1;
            for (let x = 4; x < 156; x++) {
              const idx = (y * 160 + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
              currentLum[y * 160 + x] = lum;

              if (lum > 135) brightPixels++;
              if (lum < 55) darkPixels++;

              if (prevLum >= 0) {
                const diff = Math.abs(lum - prevLum);
                if (diff > 45) edgeTransitions++;
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
              if (currentLum[i] > 130 || currentLum[i] < 50) {
                diffSum += Math.abs(currentLum[i] - prevLum[i]);
                comparedPixels++;
              }
            }
            if (comparedPixels > 25) {
              const avgDiff = diffSum / comparedPixels;
              if (avgDiff < 18) {
                isTemporallyStatic = true;
              }
            }
          } else {
            // Lần quét đầu tiên chưa có prevLum: nếu mật độ nét chữ cao vượt trội thì tính là tĩnh
            if (edgeTransitions >= 150 && brightPixels >= 60) {
              isTemporallyStatic = true;
            }
          }
          prevFrameLuminanceRef.current = currentLum;

          // Quảng cáo cờ bạc: chữ có độ tương phản cao, mật độ cạnh chữ dày và cố định qua thời gian
          if (edgeTransitions >= 70 && brightPixels >= 35 && darkPixels >= 40 && isTemporallyStatic) {
            detected = true;
          }
        }
      } catch {
        detected = false;
      }

      // Check thêm phân đoạn banner đã xác định từ m3u8 playlist (đảm bảo độ tin cậy 100%)
      if (!detected && bannerRangesRef.current.length > 0) {
        const cur = video.currentTime;
        for (const range of bannerRangesRef.current) {
          if (cur >= range.start - 0.5 && cur <= range.end + 0.5) {
            detected = true;
            break;
          }
        }
      }

      if (detected) {
        consecutiveDetectionsRef.current++;
        consecutiveMissesRef.current = 0;
        // Kích hoạt mượt mà ngay lập tức khi phát hiện quảng cáo
        if (consecutiveDetectionsRef.current >= 1) {
          setIsAdDetected(true);
        }
      } else {
        consecutiveMissesRef.current++;
        // Tắt che khi không còn quảng cáo (ít nhất 2 lần quét sạch)
        if (consecutiveMissesRef.current >= 2) {
          consecutiveDetectionsRef.current = 0;
          prevFrameLuminanceRef.current = null;
          setIsAdDetected(false);
        }
      }
    }, 800);

    return () => {
      clearInterval(checkInterval);
    };
  }, [adShieldMode, videoUrl]);

  // Vô hiệu hóa triệt để Picture-in-Picture (tránh tự bật khi đổi tab hoặc cuộn)
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      try {
        video.disablePictureInPicture = true;
        video.removeAttribute("autopictureinpicture");
      } catch {}
    }
    if (typeof document !== "undefined" && document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {});
    }
  }, []);

  // Subtitle Upload Handler (.SRT / .VTT)
  const handleSubtitleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const cues = parseSubtitles(text);
      if (cues.length === 0) {
        toast.error("Không tìm thấy dòng phụ đề hợp lệ (.srt hoặc .vtt).");
        return;
      }
      setCustomCues(cues);
      setSubtitleEnabled(true);
      toast.success(`Đã tải thành công ${cues.length} câu phụ đề (${file.name})!`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Mobile Touch Gestures (Brightness left edge, Volume right edge, Horizontal Scrub Seek)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    attemptUnmute();
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const relX = (touch.clientX - rect.left) / rect.width;
    const zone: 'left' | 'center' | 'right' = relX < 0.35 ? 'left' : relX > 0.65 ? 'right' : 'center';

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      zone,
      startBrightness: brightness,
      startVolume: videoRef.current ? videoRef.current.volume : volume,
      startTime: videoRef.current ? videoRef.current.currentTime : 0,
      lockedGesture: null,
    };
    targetSeekRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touchStartRef.current.y - touch.clientY; // positive = dragging UP

    // Gesture detection threshold
    if (!touchStartRef.current.lockedGesture) {
      if (Math.abs(deltaY) > 12 && Math.abs(deltaY) > Math.abs(deltaX)) {
        if (touchStartRef.current.zone === 'left') {
          touchStartRef.current.lockedGesture = 'brightness';
        } else if (touchStartRef.current.zone === 'right') {
          touchStartRef.current.lockedGesture = 'volume';
        }
      } else if (Math.abs(deltaX) > 18 && Math.abs(deltaX) > Math.abs(deltaY)) {
        touchStartRef.current.lockedGesture = 'seek';
      }
    }

    if (!touchStartRef.current.lockedGesture) return;

    if (gestureHUDTimerRef.current) clearTimeout(gestureHUDTimerRef.current);

    if (touchStartRef.current.lockedGesture === 'brightness') {
      const step = (deltaY / (rect.height * 0.7)) * 100;
      const nextBrightness = Math.round(Math.min(150, Math.max(30, touchStartRef.current.startBrightness + step)));
      setBrightness(nextBrightness);
      setGestureHUD({ type: 'brightness', value: nextBrightness });
    } else if (touchStartRef.current.lockedGesture === 'volume') {
      const step = deltaY / (rect.height * 0.7);
      const nextVol = Math.min(1, Math.max(0, touchStartRef.current.startVolume + step));
      setVolume(nextVol);
      if (videoRef.current) videoRef.current.volume = nextVol;
      if (nextVol > 0 && isMuted) setIsMuted(false);
      setGestureHUD({ type: 'volume', value: Math.round(nextVol * 100) });
    } else if (touchStartRef.current.lockedGesture === 'seek') {
      const seekSec = Math.round((deltaX / rect.width) * 90);
      const targetTime = Math.min(duration, Math.max(0, touchStartRef.current.startTime + seekSec));
      targetSeekRef.current = targetTime;
      setGestureHUD({ type: 'seek', value: targetTime, delta: seekSec });
    }
  };

  const handleTouchEnd = () => {
    if (touchStartRef.current?.lockedGesture === 'seek' && targetSeekRef.current !== null) {
      handleSeekCommit([targetSeekRef.current]);
    }
    touchStartRef.current = null;
    targetSeekRef.current = null;

    if (gestureHUDTimerRef.current) clearTimeout(gestureHUDTimerRef.current);
    gestureHUDTimerRef.current = setTimeout(() => {
      setGestureHUD(null);
    }, 700);
  };

  // Smart Click / Touch
  const handleSmartClick = (e: React.MouseEvent<HTMLDivElement>, side: 'left' | 'right' | 'center') => {
    e.stopPropagation();
    attemptUnmute();
    if (gestureHUD) return;

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

  return (
    <div 
      ref={containerRef} 
      className={cn(
        "relative bg-black group overflow-hidden select-none w-full aspect-video rounded-xl lg:rounded-2xl shadow-2xl touch-manipulation", 
        isFullscreen && "fixed inset-0 z-[99999] w-screen h-[100dvh] rounded-none aspect-auto"
      )} 
      style={{ transform: "translateZ(0)" }}
      onMouseMove={showControlsHandler} 
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onTouchStart={attemptUnmute}
      onPointerDown={attemptUnmute}
    >
      <video 
        ref={(el) => {
          (videoRef as any).current = el;
          if (el) {
            try {
              el.disablePictureInPicture = true;
              el.removeAttribute("autopictureinpicture");
            } catch {}
          }
        }} 
        disablePictureInPicture={true}
        controlsList="nodownload noplaybackrate nopictureinpicture"
        className="w-full h-full"
          style={{
            ...getVideoTransformStyle(),
            backfaceVisibility: "hidden",
            filter: (() => {
              const base = visualFilter === 'oled' 
                ? 'contrast(1.20) saturate(1.24) brightness(0.96)' 
                : visualFilter === 'vivid' 
                ? 'contrast(1.10) saturate(1.42) brightness(1.02)' 
                : visualFilter === 'bright'
                ? 'contrast(1.08) saturate(1.12) brightness(1.15)'
                : '';
              if (brightness !== 100) {
                return (base ? `${base} ` : '') + `brightness(${brightness / 100})`;
              }
              return base || 'none';
            })(),
            transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), filter 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "transform, filter",
          }}
          poster={poster} 
          playsInline 
          preload="auto" 
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
            ? "opacity-100 h-[25%] sm:h-[24%]" 
            : "opacity-0 h-0"
        )}
      >
        <div className="w-full h-full bg-gradient-to-b from-black/98 via-black/95 via-80% to-transparent" />
      </div>


      <div 
        className="absolute inset-0 flex z-10 touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="w-[35%] h-full z-20 cursor-pointer" 
          onClick={(e) => handleSmartClick(e, 'left')} 
          onTouchStart={attemptUnmute}
          onPointerDown={attemptUnmute}
        />
        <div 
          className="w-[30%] h-full z-20 cursor-pointer" 
          onClick={(e) => handleSmartClick(e, 'center')} 
          onTouchStart={attemptUnmute}
          onPointerDown={attemptUnmute}
        />
        <div 
          className="w-[35%] h-full z-20 cursor-pointer" 
          onClick={(e) => handleSmartClick(e, 'right')} 
          onTouchStart={attemptUnmute}
          onPointerDown={attemptUnmute}
        />
      </div>


      {skipAnimation && (
        <div key={skipAnimation.id} className={cn("absolute top-0 bottom-0 flex items-center justify-center w-[30%] z-30 bg-white/5 pointer-events-none animate-in fade-in zoom-in duration-300", skipAnimation.side === 'left' ? "left-0 rounded-r-full" : "right-0 rounded-l-full")} onAnimationEnd={() => setSkipAnimation(null)}>
          <div className="flex flex-col items-center text-white">
            {skipAnimation.side === 'left' ? <><ChevronsLeft className="w-12 h-12" /><span>-10s</span></> : <><ChevronsRight className="w-12 h-12" /><span>+10s</span></>}
          </div>
        </div>
      )}

      {/* Mobile Touch Gesture HUD Overlay */}
      {gestureHUD && (
        <div className="absolute inset-0 flex items-center justify-center z-[58] pointer-events-none select-none">
          <div className="flex flex-col items-center gap-2 p-4 sm:p-5 rounded-2xl bg-black/85 backdrop-blur-xl border border-white/20 shadow-2xl min-w-[130px] animate-in fade-in zoom-in-95 duration-150">
            {gestureHUD.type === 'brightness' && (
              <>
                <Sun className="w-8 h-8 text-amber-400" />
                <span className="text-xs font-bold text-white/85 uppercase tracking-wider">Độ sáng</span>
                <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden mt-1">
                  <div 
                    className="h-full bg-amber-400 rounded-full transition-all duration-75" 
                    style={{ width: `${Math.min(100, Math.max(0, ((gestureHUD.value - 30) / 120) * 100))}%` }}
                  />
                </div>
                <span className="text-xs font-black text-white font-mono">{gestureHUD.value}%</span>
              </>
            )}

            {gestureHUD.type === 'volume' && (
              <>
                {gestureHUD.value === 0 ? (
                  <VolumeX className="w-8 h-8 text-red-400" />
                ) : (
                  <Volume2 className="w-8 h-8 text-brand-green" />
                )}
                <span className="text-xs font-bold text-white/85 uppercase tracking-wider">Âm lượng</span>
                <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden mt-1">
                  <div 
                    className="h-full bg-brand-green rounded-full transition-all duration-75" 
                    style={{ width: `${gestureHUD.value}%` }}
                  />
                </div>
                <span className="text-xs font-black text-white font-mono">{gestureHUD.value}%</span>
              </>
            )}

            {gestureHUD.type === 'seek' && (
              <>
                {gestureHUD.delta !== undefined && gestureHUD.delta >= 0 ? (
                  <FastForward className="w-8 h-8 text-brand-green" />
                ) : (
                  <SkipBack className="w-8 h-8 text-amber-400" />
                )}
                <span className="text-base font-black text-white font-mono">
                  {gestureHUD.delta !== undefined && gestureHUD.delta >= 0 ? `+${gestureHUD.delta}s` : `${gestureHUD.delta}s`}
                </span>
                <span className="text-xs text-white/70 font-mono">
                  {formatTime(gestureHUD.value)} / {formatTime(duration)}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* External Subtitle Display Overlay */}
      {subtitleEnabled && customCues.length > 0 && (() => {
        const active = customCues.find(c => currentTime >= c.start && currentTime <= c.end);
        if (!active) return null;
        return (
          <div className="absolute bottom-16 sm:bottom-20 inset-x-0 flex justify-center items-center pointer-events-none z-30 px-4 text-center">
            <span
              className={cn(
                "inline-block font-semibold text-white leading-snug rounded-lg px-3 py-1.5 shadow-md transition-all whitespace-pre-line select-none",
                subtitleSize === 'sm' && "text-xs sm:text-sm",
                subtitleSize === 'md' && "text-sm sm:text-base md:text-lg",
                subtitleSize === 'lg' && "text-base sm:text-lg md:text-xl font-bold",
                subtitleBg === 'transparent' && "bg-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]",
                subtitleBg === 'dim' && "bg-black/75 backdrop-blur-xs",
                subtitleBg === 'black' && "bg-black/95 border border-white/20"
              )}
            >
              {active.text}
            </span>
          </div>
        );
      })()}

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

      {isLoading && (!hasRenderedFirstFrame || !isPlaying) && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center z-30 cursor-pointer pointer-events-auto transition-opacity duration-300",
            hasRenderedFirstFrame ? "bg-black/35 backdrop-blur-[2px]" : "bg-black/60 backdrop-blur-xs"
          )}
        >
          <Loader2 className="w-11 h-11 sm:w-12 sm:h-12 text-brand-green animate-spin mb-3 shadow-[0_0_20px_rgba(34,197,94,0.4)]" />
          <p className="text-white/90 text-sm font-bold tracking-wide">
            {isSlowNetwork ? "Đang tăng tốc bộ đệm giờ cao điểm..." : "Đang tải video..."}
          </p>
          {isSlowNetwork && onSwitchToEmbed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSwitchToEmbed();
              }}
              className="mt-4 px-4 py-2 bg-brand-green/20 hover:bg-brand-green/30 border border-brand-green/50 text-brand-green font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Phát ngay bằng Máy chủ Dự phòng</span>
            </button>
          )}
        </div>
      )}

      {countdown !== null && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/85 backdrop-blur-md px-4 text-center animate-in fade-in duration-200 select-none"
        >
          {/* Cinema Hub */}
          <div className="relative flex flex-col items-center max-w-sm w-full p-6 sm:p-8 rounded-3xl bg-[#0c130e]/95 border border-brand-green/30 shadow-[0_0_50px_rgba(32,214,107,0.18)]">
            {/* SVG Progress Ring */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center mb-5">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#20d66b"
                  strokeWidth="6"
                  strokeDasharray={264}
                  strokeDashoffset={264 - (264 * (countdown / 5))}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tighter drop-shadow-[0_0_12px_rgba(32,214,107,0.6)]">
                  {countdown}
                </span>
                <span className="text-[10px] text-brand-green uppercase tracking-widest font-bold">giây</span>
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 line-clamp-1">
              Tự động chuyển tập tiếp theo
            </h3>
            <p className="text-xs text-white/60 mb-6 line-clamp-1">
              {movieName ? `Phim: ${movieName}` : "Tập tiếp theo sẽ tự động phát sau ít giây..."}
            </p>

            <div className="flex items-center gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelCountdown}
                className="flex-1 py-2.5 h-auto text-xs sm:text-sm font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border-white/10 transition-all cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handlePlayNextImmediately}
                className="flex-1 py-2.5 h-auto text-xs sm:text-sm font-bold rounded-xl bg-brand-green hover:bg-brand-green/90 text-black shadow-[0_0_20px_rgba(32,214,107,0.35)] transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FastForward className="w-3.5 h-3.5 fill-black" />
                <span>Phát ngay</span>
              </Button>
            </div>
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
        <div className="px-4 pb-0 pointer-events-auto relative">
          {/* Ad range markers on timeline */}
          {duration > 0 && adRanges.length > 0 && (
            <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 pointer-events-none overflow-hidden z-0">
              {adRanges.map((range, idx) => {
                const leftPercent = Math.max(0, Math.min(100, (range.start / duration) * 100));
                const widthPercent = Math.max(0.5, Math.min(100 - leftPercent, (range.duration / duration) * 100));
                return (
                  <div
                    key={idx}
                    className="absolute top-0 bottom-0 bg-amber-400/70 rounded-full"
                    style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                    title={`Video quảng cáo (${Math.round(range.duration)}s)`}
                  />
                );
              })}
            </div>
          )}
          <Slider 
            value={[seekTime !== null ? seekTime : currentTime]} 
            min={0} 
            max={duration > 0 ? duration : 100} 
            step={1}
            onValueChange={handleSeekChange} 
            onValueCommit={handleSeekCommit} 
            className="py-4 cursor-pointer relative z-10" 
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
            {/* Resolution indicator pill - Tạm ẩn theo yêu cầu */}
            {/* <span className="hidden sm:inline-flex text-[10px] font-black text-brand-green bg-brand-green/10 border border-brand-green/25 px-2 py-0.5 rounded-full uppercase tracking-wider select-none">
              {quality === -1 ? (currentLevelPlaying >= 0 && qualities[currentLevelPlaying] ? `${qualities[currentLevelPlaying].height}p Auto` : "FHD 1080p") : `${qualities.find(q => q.level === quality)?.height || 1080}p FHD`}
            </span> */}

            {/* PiP & Settings Buttons - Ẩn theo yêu cầu */}


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
          <div className="grid grid-cols-5 gap-1 p-1 bg-white/5 rounded-xl mb-2 text-[11px] font-semibold shrink-0">
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
              onClick={() => setSettingsTab('sub')}
              className={cn("py-1 rounded-lg transition-all cursor-pointer", settingsTab === 'sub' ? "bg-brand-green text-black font-bold shadow" : "text-white/70 hover:text-white")}
            >
              Phụ đề
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

          {/* Tab Content: Subtitles */}
          {settingsTab === 'sub' && (
            <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto pr-1 py-1">
              <input
                type="file"
                ref={subtitleFileInputRef}
                accept=".srt,.vtt,.txt"
                className="hidden"
                onChange={handleSubtitleUpload}
              />
              
              {/* Upload Subtitle Button */}
              <button
                type="button"
                onClick={() => subtitleFileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-brand-green/15 hover:bg-brand-green/25 border border-brand-green/40 text-brand-green text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{customCues.length > 0 ? "Tải file phụ đề khác (.srt, .vtt)" : "Tải phụ đề từ máy (.srt, .vtt)"}</span>
              </button>

              {customCues.length > 0 && (
                <>
                  {/* Toggle Subtitles On/Off */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 text-xs">
                    <span className="text-white/80 font-medium">Hiện phụ đề ({customCues.length} câu)</span>
                    <button
                      type="button"
                      onClick={() => setSubtitleEnabled(!subtitleEnabled)}
                      className={cn(
                        "w-10 h-5 rounded-full transition-colors relative cursor-pointer",
                        subtitleEnabled ? "bg-brand-green" : "bg-white/20"
                      )}
                    >
                      <div className={cn(
                        "w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5",
                        subtitleEnabled ? "left-5.5" : "left-0.5"
                      )} />
                    </button>
                  </div>

                  {/* Subtitle Font Size */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-white/60 font-semibold uppercase tracking-wider">Cỡ chữ phụ đề:</span>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: 'sm', label: 'Nhỏ' },
                        { id: 'md', label: 'Vừa' },
                        { id: 'lg', label: 'Lớn' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSubtitleSize(item.id as any)}
                          className={cn(
                            "py-1 rounded-lg text-xs font-medium transition-all cursor-pointer",
                            subtitleSize === item.id
                              ? "bg-brand-green text-black font-bold shadow"
                              : "bg-white/5 hover:bg-white/10 text-white/70"
                          )}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subtitle Background */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-white/60 font-semibold uppercase tracking-wider">Nền phụ đề:</span>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: 'transparent', label: 'Trong suốt' },
                        { id: 'dim', label: 'Mờ tối' },
                        { id: 'black', label: 'Đen đậm' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSubtitleBg(item.id as any)}
                          className={cn(
                            "py-1 rounded-lg text-xs font-medium transition-all cursor-pointer",
                            subtitleBg === item.id
                              ? "bg-brand-green text-black font-bold shadow"
                              : "bg-white/5 hover:bg-white/10 text-white/70"
                          )}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {customCues.length === 0 && (
                <p className="text-[11px] text-white/50 text-center px-2 py-2 leading-relaxed">
                  Bạn có thể tải file phụ đề định dạng .srt hoặc .vtt từ máy để khớp với video đang phát.
                </p>
              )}
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

        </div>
      )}
    </div>
  );
}
