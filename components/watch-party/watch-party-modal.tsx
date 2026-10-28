"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Users,
  Copy,
  Check,
  Send,
  X,
  Play,
  Pause,
  Crown,
  LogOut,
  Radio,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useUserAuth } from "@/context/user-auth-context";

interface WatchPartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  movieSlug: string;
  movieName: string;
  currentEpisodeIndex?: number;
  currentEpisodeName?: string;
  currentServerIndex?: number;
  currentTime?: number;
  isPlaying?: boolean;
  onSyncPlayback?: (state: { currentTime: number; isPlaying: boolean; episodeIndex: number }) => void;
}

export default function WatchPartyModal({
  isOpen,
  onClose,
  movieSlug,
  movieName,
  currentEpisodeIndex = 0,
  currentEpisodeName = "Tập 1",
  currentServerIndex = 0,
  currentTime = 0,
  isPlaying = true,
  onSyncPlayback,
}: WatchPartyModalProps) {
  const { user } = useUserAuth();

  const [roomId, setRoomId] = useState<string>("");
  const [joinInputId, setJoinInputId] = useState<string>("");
  const [roomData, setRoomData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>("");
  const [isSendingChat, setIsSendingChat] = useState<boolean>(false);

  const myClientIdRef = useRef<string>("");
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const isHost = Boolean(roomData && roomData.hostId === myClientIdRef.current);

  // Initialize client ID
  useEffect(() => {
    if (typeof window !== "undefined") {
      let cid = user?.id || sessionStorage.getItem("hiphim_party_cid");
      if (!cid) {
        cid = `user_${Math.random().toString(36).substring(2, 9)}`;
        sessionStorage.setItem("hiphim_party_cid", cid);
      }
      myClientIdRef.current = cid;

      // Auto-join from URL parameter if party query exists
      const params = new URLSearchParams(window.location.search);
      const urlParty = params.get("party")?.trim().toUpperCase();
      if (urlParty && !roomId) {
        setRoomId(urlParty);
      }
    }
  }, [user?.id, roomId]);

  const currentUserName = user?.name || "Khán giả " + myClientIdRef.current.slice(-4);

  // Polling room state every 3s when active
  useEffect(() => {
    if (!roomId || !isOpen) return;

    let isMounted = true;

    const pollRoom = async () => {
      try {
        const res = await fetch(`/api/watch-party?roomId=${encodeURIComponent(roomId)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && data.room) {
            setRoomData(data.room);

            // If not host, sync playback with host's state
            if (data.room.hostId !== myClientIdRef.current && onSyncPlayback && data.room.state) {
              const remote = data.room.state;
              // If time difference > 4 seconds or play/pause changed
              if (Math.abs((remote.currentTime || 0) - currentTime) > 4) {
                onSyncPlayback({
                  currentTime: remote.currentTime || 0,
                  isPlaying: Boolean(remote.isPlaying),
                  episodeIndex: remote.episodeIndex ?? 0,
                });
              }
            }
          }
        }
      } catch {}
    };

    pollRoom();
    const interval = setInterval(pollRoom, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [roomId, isOpen, currentTime, onSyncPlayback]);

  // Scroll chat to bottom on new message
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [roomData?.messages]);

  // Host broadcast playback changes
  const broadcastSync = useCallback(
    async (time: number, playing: boolean, epIdx: number) => {
      if (!roomId || !isHost) return;
      try {
        await fetch("/api/watch-party", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "sync",
            roomId,
            senderId: myClientIdRef.current,
            currentTime: time,
            isPlaying: playing,
            episodeIndex: epIdx,
            episodeName: currentEpisodeName,
            serverIndex: currentServerIndex,
          }),
        });
      } catch {}
    },
    [roomId, isHost, currentEpisodeName, currentServerIndex]
  );

  // Create room
  const handleCreateRoom = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/watch-party", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          movieSlug,
          movieName,
          hostId: myClientIdRef.current,
          hostName: currentUserName,
          episodeIndex: currentEpisodeIndex,
          episodeName: currentEpisodeName,
          serverIndex: currentServerIndex,
        }),
      });
      const data = await res.json();
      if (data.success && data.room) {
        setRoomId(data.room.roomId);
        setRoomData(data.room);
        toast.success(`Đã tạo phòng xem chung: ${data.room.roomId}!`);
        // Update URL
        const url = new URL(window.location.href);
        url.searchParams.set("party", data.room.roomId);
        window.history.replaceState(null, "", url.toString());
      } else {
        toast.error(data.error || "Không thể tạo phòng");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setIsLoading(false);
    }
  };

  // Join existing room
  const handleJoinRoom = async (targetId: string) => {
    const cleanId = targetId.trim().toUpperCase();
    if (!cleanId) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/watch-party", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          roomId: cleanId,
          memberId: myClientIdRef.current,
          memberName: currentUserName,
        }),
      });
      const data = await res.json();
      if (data.success && data.room) {
        setRoomId(data.room.roomId);
        setRoomData(data.room);
        toast.success(`Đã tham gia phòng ${data.room.roomId}!`);
        // Update URL
        const url = new URL(window.location.href);
        url.searchParams.set("party", data.room.roomId);
        window.history.replaceState(null, "", url.toString());
      } else {
        toast.error(data.error || "Mã phòng không hợp lệ");
      }
    } catch {
      toast.error("Không thể kết nối đến phòng");
    } finally {
      setIsLoading(false);
    }
  };

  // Send Chat message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || !roomId || isSendingChat) return;

    setIsSendingChat(true);
    setChatInput("");
    try {
      const res = await fetch("/api/watch-party", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          roomId,
          senderId: myClientIdRef.current,
          senderName: currentUserName,
          text,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.message && roomData) {
          setRoomData((prev: any) => ({
            ...prev,
            messages: [...(prev?.messages || []), data.message],
          }));
        }
      }
    } catch {
      toast.error("Không gửi được tin nhắn");
    } finally {
      setIsSendingChat(false);
    }
  };

  // Copy share invite link
  const handleCopyLink = () => {
    if (!roomId) return;
    const shareUrl = `${window.location.origin}/watch?slug=${movieSlug}&party=${roomId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    toast.success("Đã sao chép liên kết mời xem chung!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Leave room
  const handleLeaveRoom = () => {
    setRoomId("");
    setRoomData(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("party");
    window.history.replaceState(null, "", url.toString());
    toast.info("Đã rời khỏi phòng xem chung");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-[#0e1310] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_30px_rgba(32,214,107,0.15)] overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-green/10 border border-brand-green/30 flex items-center justify-center text-brand-green">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">Xem Phim Cùng Bạn Bè</h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-green/20 text-brand-green border border-brand-green/40 uppercase">
                  Watch Party
                </span>
              </div>
              <p className="text-[11px] text-white/50 truncate max-w-[260px]">{movieName}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        {!roomId || !roomData ? (
          // View 1: Not in a room -> Create or Join
          <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
            {/* Create Room Box */}
            <div className="p-4 rounded-xl bg-gradient-to-b from-brand-green/10 to-transparent border border-brand-green/20 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-green/20 border border-brand-green/40 flex items-center justify-center text-brand-green mx-auto shadow-[0_0_20px_rgba(32,214,107,0.25)]">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Tạo Phòng Xem Chung Mới</h4>
                <p className="text-xs text-white/60 mt-1 max-w-xs mx-auto">
                  Bạn sẽ là chủ phòng, có thể chia sẻ đường link cho bạn bè và đồng bộ thời gian phát phim trực tiếp.
                </p>
              </div>
              <button
                onClick={handleCreateRoom}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-brand-green hover:bg-[#1bb85c] active:scale-[0.98] text-black font-bold text-xs sm:text-sm tracking-wide shadow-[0_0_20px_rgba(32,214,107,0.3)] transition-all disabled:opacity-50"
              >
                {isLoading ? "Đang khởi tạo phòng..." : "Tạo Phòng Ngay"}
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-x-0 border-t border-white/10" />
              <span className="relative px-3 bg-[#0e1310] text-[11px] font-semibold text-white/40 uppercase">
                Hoặc tham gia phòng có sẵn
              </span>
            </div>

            {/* Join Room Form */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/70">Mã phòng xem chung</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinInputId}
                  onChange={(e) => setJoinInputId(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: HP-8X92"
                  className="flex-1 h-10 px-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm uppercase placeholder:normal-case placeholder:text-white/30 focus:outline-none focus:border-brand-green/80 font-mono tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => handleJoinRoom(joinInputId)}
                  disabled={isLoading || !joinInputId.trim()}
                  className="h-10 px-4 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs transition-colors border border-white/10 disabled:opacity-50"
                >
                  Vào phòng
                </button>
              </div>
            </div>
          </div>
        ) : (
          // View 2: Active Room -> Room Controls, Members & Live Chat
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Room Info Bar */}
            <div className="px-5 py-3 bg-white/[0.02] border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50">Mã phòng:</span>
                <span className="font-mono font-black text-brand-green text-sm tracking-wider px-2 py-0.5 rounded bg-brand-green/10 border border-brand-green/30">
                  {roomData.roomId}
                </span>
                {isHost ? (
                  <span className="flex items-center gap-1 text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 font-semibold">
                    <Crown className="w-3 h-3 text-amber-400" />
                    Chủ phòng
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                    <Radio className="w-3 h-3 animate-pulse text-brand-green" />
                    Đồng bộ máy chủ
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyLink}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-xs font-semibold text-white/90 hover:text-white flex items-center gap-1.5 transition-colors"
                  title="Sao chép link mời bạn bè"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-brand-green" />
                      <span className="text-brand-green">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-white/60" />
                      <span>Sao chép link</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleLeaveRoom}
                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 active:scale-95 border border-red-500/20 text-red-400 transition-colors"
                  title="Rời phòng"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Active Members Pill Carousel */}
            <div className="px-5 py-2 border-b border-white/5 bg-black/20 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 text-xs">
              <span className="text-[11px] text-white/40 shrink-0">Thành viên ({roomData.members?.length || 1}):</span>
              {roomData.members?.map((m: any) => (
                <div
                  key={m.id}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1 shrink-0 border",
                    m.isHost
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                      : "bg-white/5 border-white/10 text-white/80"
                  )}
                >
                  {m.isHost && <Crown className="w-2.5 h-2.5 text-amber-400" />}
                  <span>{m.name}</span>
                </div>
              ))}
            </div>

            {/* Live Chat Stream */}
            <div
              ref={chatScrollRef}
              className="flex-1 p-4 space-y-2.5 overflow-y-auto min-h-[220px] max-h-[340px] text-xs"
            >
              {roomData.messages?.map((msg: any) => {
                const isMe = msg.senderId === myClientIdRef.current;
                const isSys = msg.senderId === "system";

                if (isSys) {
                  return (
                    <div key={msg.id} className="text-center py-1">
                      <span className="px-2.5 py-1 rounded-full bg-white/[0.04] text-[10px] text-white/50 border border-white/5">
                        {msg.text}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col max-w-[80%] rounded-xl px-3 py-2 leading-relaxed",
                      isMe
                        ? "ml-auto bg-brand-green/20 text-white border border-brand-green/30"
                        : "mr-auto bg-white/[0.06] text-white/90 border border-white/10"
                    )}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-white/50 mb-0.5">
                      <span className="font-bold text-white/80">{msg.senderName}</span>
                      <span>•</span>
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-xs break-words">{msg.text}</p>
                  </div>
                );
              })}
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 bg-black/40 border-t border-white/10 flex gap-2 shrink-0">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Nhắn tin với mọi người trong phòng..."
                className="flex-1 h-9 px-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-brand-green/80"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isSendingChat}
                className="h-9 px-3 rounded-xl bg-brand-green hover:bg-[#1bb85c] active:scale-95 text-black font-bold text-xs flex items-center justify-center transition-all disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
