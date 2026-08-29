import { useState, useEffect, useCallback } from "react";

export interface ContinueWatchingItem {
  slug: string;
  name: string;
  poster_url?: string;
  thumb_url?: string;
  serverIndex: number;
  episodeIndex: number;
  episodeName?: string;
  currentTime: number;
  duration: number;
  timestamp: number;
}

const STORAGE_KEY = "continue_watching_list";

export function useContinueWatching() {
  const [items, setItems] = useState<ContinueWatchingItem[]>([]);

  useEffect(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        setItems(JSON.parse(data));
      }
    } catch (error) {
      console.error("Error reading continue watching data:", error);
    }
  }, []);

  const updateProgress = useCallback((item: Omit<ContinueWatchingItem, "timestamp">) => {
    setItems((prev) => {
      const filtered = prev.filter((i) => i.slug !== item.slug);
      
      // If watched more than 95% of duration, consider it done and remove it.
      if (item.duration > 0 && item.currentTime >= item.duration - 15) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        return filtered;
      }
      
      // Only track if watched more than 5 seconds
      if (item.currentTime < 5) return prev;

      const newItem = { ...item, timestamp: Date.now() };
      const updated = [newItem, ...filtered].slice(0, 15); // Keep last 15
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeItem = useCallback((slug: string) => {
    setItems((prev) => {
      const updated = prev.filter((i) => i.slug !== slug);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    items,
    updateProgress,
    removeItem,
  };
}
