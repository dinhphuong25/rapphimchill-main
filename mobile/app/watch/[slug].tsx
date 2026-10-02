import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  useWindowDimensions,
  Share,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  ChevronLeft,
  Tv,
  Search,
  Heart,
  Share2,
  Play,
  Layers,
  FileText,
  Zap,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react-native";
import { fetchMovieDetail, MovieDetail } from "@/services/api";
import { saveWatchHistory, isFavorite, toggleFavorite } from "@/services/storage";
import { useUserAuth } from "@/context/UserAuthContext";
import { Colors, Radii } from "@/constants/theme";
import { haptic } from "@/services/haptics";

function cleanHtml(text?: string): string {
  if (!text) return "";
  return text.replace(/<[^>]*>?/gm, "").trim();
}

interface PlaybackErrorInfo {
  title: string;
  message: string;
  canRetry?: boolean;
  suggestedEp?: { slug: string; name: string };
}

export default function WatchScreen() {
  const router = useRouter();
  const { user, openAuthModal } = useUserAuth();
  const { slug, ep, server } = useLocalSearchParams<{
    slug: string;
    ep?: string;
    server?: string;
  }>();
  const { width: screenWidth } = useWindowDimensions();

  // 5-column episode item width (screenWidth - 28 padding - 4 * 8 gap) / 5
  const epColumns = 5;
  const epGap = 8;
  const epPadding = 14;
  const epCardWidth = Math.floor(
    (screenWidth - epPadding * 2 - (epColumns - 1) * epGap) / epColumns
  );

  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedServerIdx, setSelectedServerIdx] = useState(
    server ? parseInt(server, 10) || 0 : 0
  );
  const [currentEpSlug, setCurrentEpSlug] = useState<string>(ep || "");
  const [epSearch, setEpSearch] = useState("");
  const [fav, setFav] = useState(false);
  const [expandedContent, setExpandedContent] = useState(false);
  const [playbackError, setPlaybackError] = useState<PlaybackErrorInfo | null>(null);
  const [isVerifyingLink, setIsVerifyingLink] = useState(false);

  // Load movie data
  useEffect(() => {
    if (!slug) return;
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      try {
        const [detail, favStatus] = await Promise.all([
          fetchMovieDetail(slug as string),
          user ? isFavorite(slug as string) : Promise.resolve(false),
        ]);

        if (isMounted && detail) {
          setMovie(detail);
          setFav(favStatus);

          const srvIdx = server ? parseInt(server, 10) || 0 : 0;
          const firstEp = detail.episodes?.[srvIdx]?.server_data?.[0]?.slug || "";
          if (!ep && firstEp) {
            setCurrentEpSlug(firstEp);
          }
        }
      } catch (err) {
        console.error("Watch screen load error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [slug, user?.id]);

  // Current server and current episode object
  const currentServer = movie?.episodes?.[selectedServerIdx] || movie?.episodes?.[0];
  const episodeList = currentServer?.server_data || [];

  const currentEpisode = useMemo(() => {
    if (!episodeList.length) return null;
    return episodeList.find((e) => e.slug === currentEpSlug) || episodeList[0];
  }, [episodeList, currentEpSlug]);

  const formattedEpName = useMemo(() => {
    if (!currentEpisode?.name) return "";
    const name = currentEpisode.name.trim();
    return name.toLowerCase().startsWith("tập") ? name : `Tập ${name}`;
  }, [currentEpisode?.name]);

  // Filtered episodes for quick search
  const filteredEpisodes = useMemo(() => {
    if (!epSearch.trim()) return episodeList;
    const q = epSearch.trim().toLowerCase();
    return episodeList.filter((e) => e.name.toLowerCase().includes(q));
  }, [episodeList, epSearch]);

  // Raw m3u8 link from episode
  const rawStreamUrl = currentEpisode?.link_m3u8 || "";

  // Structured VideoSource object with anti-hotlink headers and HLS configuration
  const videoSource = useMemo(() => {
    if (!rawStreamUrl) return null;
    return {
      uri: rawStreamUrl,
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15",
        "Referer": "https://player.phimapi.com/",
        "Origin": "https://player.phimapi.com",
      },
      contentType: "hls" as const,
    };
  }, [rawStreamUrl]);

  // Initialize expo-video player
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = false;
    p.play();
  });

  // Track episode change to reload player source and record history
  useEffect(() => {
    if (videoSource && player) {
      try {
        if (typeof (player as any).replaceAsync === "function") {
          (player as any)
            .replaceAsync(videoSource)
            .then(() => {
              player.play();
            })
            .catch((err: any) => console.warn("replaceAsync error:", err));
        } else {
          player.replace(videoSource);
          player.play();
        }
      } catch (err) {
        console.warn("player.replace error:", err);
      }
    }

    if (user && movie && currentEpisode) {
      saveWatchHistory(
        movie,
        currentEpisode.name,
        currentEpisode.slug
      );
    }
  }, [rawStreamUrl, currentEpisode?.slug, player, user?.id]);

  // Listen to native player status & playback error events
  useEffect(() => {
    if (!player) return;

    const sub = player.addListener("statusChange", ({ status, error }) => {
      if (status === "error") {
        console.warn("Video player statusChange error:", error);
        setPlaybackError((prev) => {
          if (prev) return prev;
          const currIdx = episodeList.findIndex((e) => e.slug === currentEpisode?.slug);
          const nextEp = currIdx >= 0 && currIdx < episodeList.length - 1 ? episodeList[currIdx + 1] : undefined;
          return {
            title: "Không thể phát nguồn này",
            message: "Tập phim đang đồng bộ hoặc đường truyền máy chủ bị gián đoạn. Vui lòng thử lại hoặc chọn tập khác.",
            canRetry: true,
            suggestedEp: nextEp ? { slug: nextEp.slug, name: nextEp.name } : undefined,
          };
        });
      } else if (status === "readyToPlay") {
        setPlaybackError(null);
      }
    });

    return () => {
      sub.remove();
    };
  }, [player, episodeList, currentEpisode?.slug]);

  // Proactively check episode stream reachability (detect HTTP 404 / 5xx)
  useEffect(() => {
    if (!rawStreamUrl) return;

    let isMounted = true;
    setIsVerifyingLink(true);

    fetch(rawStreamUrl, {
      method: "HEAD",
      headers: {
        "Referer": "https://player.phimapi.com/",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15",
      },
      signal: AbortSignal.timeout(3500),
    })
      .then((res) => {
        if (!isMounted) return;
        setIsVerifyingLink(false);

        if (res.status === 404) {
          const currIdx = episodeList.findIndex((e) => e.slug === currentEpisode?.slug);
          const nextEp = currIdx >= 0 && currIdx < episodeList.length - 1 ? episodeList[currIdx + 1] : undefined;

          setPlaybackError({
            title: "Tập phim đang được xử lý",
            message: `${formattedEpName || "Tập này"} vừa được đưa lên hệ thống và máy chủ đang đồng bộ dữ liệu (Mã 404). Vui lòng thử lại sau ít phút hoặc đổi tập khác.`,
            canRetry: true,
            suggestedEp: nextEp ? { slug: nextEp.slug, name: nextEp.name } : undefined,
          });
        } else if (!res.ok && res.status >= 500) {
          setPlaybackError({
            title: "Máy chủ tạm thời bận",
            message: `Máy chủ truyền tải đang gặp sự cố kết nối (HTTP ${res.status}). Vui lòng thử lại hoặc chọn nguồn khác.`,
            canRetry: true,
          });
        } else if (res.status === 200) {
          setPlaybackError(null);
        }
      })
      .catch(() => {
        if (isMounted) setIsVerifyingLink(false);
      });

    return () => {
      isMounted = false;
    };
  }, [rawStreamUrl, currentEpisode?.slug, formattedEpName, episodeList]);

  const handleSelectEpisode = (epSlug: string) => {
    haptic.selection();
    setPlaybackError(null);
    setCurrentEpSlug(epSlug);
  };

  const handleRetry = () => {
    haptic.selection();
    setPlaybackError(null);
    if (videoSource && player) {
      try {
        if (typeof (player as any).replaceAsync === "function") {
          (player as any)
            .replaceAsync(videoSource)
            .then(() => player.play())
            .catch(() => {});
        } else {
          player.replace(videoSource);
          player.play();
        }
      } catch (e) {
        console.warn("Retry error:", e);
      }
    }
  };

  const handleOpenEmbedBrowser = () => {
    if (!currentEpisode?.link_embed) return;
    haptic.medium();
    Linking.openURL(currentEpisode.link_embed).catch((err) => {
      console.warn("Open embed URL error:", err);
    });
  };

  const handleToggleFav = async () => {
    if (!movie) return;
    if (!user) {
      haptic.medium();
      Alert.alert(
        "Yêu Cầu Đăng Nhập",
        "Vui lòng đăng nhập tài khoản để lưu phim vào danh sách yêu thích.",
        [
          { text: "Để sau", style: "cancel" },
          {
            text: "Đăng Nhập",
            onPress: () => openAuthModal("login"),
          },
        ]
      );
      return;
    }

    haptic.medium();
    const nextState = await toggleFavorite(movie);
    setFav(nextState);
  };

  const handleShare = async () => {
    if (!movie) return;
    haptic.light();
    try {
      await Share.share({
        title: movie.name,
        message: `Đang xem ${movie.name} (${movie.origin_name}) - Tập ${currentEpisode?.name || ""}: https://hiphim.one/phim/${movie.slug}`,
      });
    } catch (err) {
      console.error("Share error:", err);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang khởi tạo trình phát...</Text>
      </View>
    );
  }

  if (!movie || !currentEpisode) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Tv size={44} color={Colors.primary} />
        <Text style={styles.errorTitle}>Không tìm thấy nguồn phát</Text>
        <Text style={styles.errorSubtitle}>
          Vui lòng thử lại sau hoặc chọn tập phim khác.
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Text style={styles.backBtnText}>Quay lại</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // 16:9 ratio for native video container
  const videoHeight = Math.floor((screenWidth * 9) / 16);
  const isSingleEp = episodeList.length <= 1;

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar with Safe Area (Không che khuất player) */}
      <SafeAreaView edges={["top"]} style={styles.topSafeArea}>
        <View style={styles.navBar}>
          <Pressable
            onPress={() => {
              haptic.light();
              router.back();
            }}
            style={({ pressed }) => [
              styles.navBackBtn,
              pressed && styles.navBtnPressed,
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Quay lại"
          >
            <ChevronLeft size={20} color="#FFFFFF" strokeWidth={2.4} />
            <Text style={styles.navBackText}>Quay lại</Text>
          </Pressable>

          <View style={styles.navCenter}>
            <Text style={styles.navTitle} numberOfLines={1}>
              {movie.name}
            </Text>
            {formattedEpName ? (
              <Text style={styles.navSubtitle} numberOfLines={1}>
                {formattedEpName}
              </Text>
            ) : null}
          </View>

          <View style={styles.navRight}>
            <Pressable
              onPress={handleToggleFav}
              style={({ pressed }) => [
                styles.navIconBtn,
                fav && styles.navFavActive,
                pressed && styles.navBtnPressed,
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Yêu thích"
            >
              <Heart
                size={17}
                color={fav ? "#EF4444" : "#FFFFFF"}
                fill={fav ? "#EF4444" : "transparent"}
                strokeWidth={2.2}
              />
            </Pressable>

            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [
                styles.navIconBtn,
                pressed && styles.navBtnPressed,
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Chia sẻ"
            >
              <Share2 size={17} color="#FFFFFF" strokeWidth={2.2} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      {/* Modern Cinema Video Frame (Ô phát video mới với cơ chế bắt lỗi thông minh) */}
      <View style={styles.playerFrameContainer}>
        <View style={[styles.playerSurface, { width: screenWidth, height: videoHeight }]}>
          <VideoView
            style={styles.video}
            player={player}
            allowsPictureInPicture
            startsPictureInPictureAutomatically
            nativeControls={!playbackError}
          />

          {/* Luxury Error Overlay khi video lỗi hoặc đang đồng bộ */}
          {playbackError && (
            <View style={styles.errorOverlay}>
              <View style={styles.errorIconWrap}>
                <AlertCircle size={26} color="#EF4444" strokeWidth={2.2} />
              </View>

              <Text style={styles.errorOverlayTitle} numberOfLines={1}>
                {playbackError.title}
              </Text>

              <Text style={styles.errorOverlaySub} numberOfLines={3}>
                {playbackError.message}
              </Text>

              {/* Action Buttons Row */}
              <View style={styles.errorActionsRow}>
                {playbackError.canRetry && (
                  <Pressable
                    onPress={handleRetry}
                    style={({ pressed }) => [
                      styles.errorBtn,
                      styles.errorRetryBtn,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <RefreshCw size={12} color="#050807" strokeWidth={2.4} />
                    <Text style={styles.errorRetryText}>Thử lại</Text>
                  </Pressable>
                )}

                {playbackError.suggestedEp && (
                  <Pressable
                    onPress={() => handleSelectEpisode(playbackError.suggestedEp!.slug)}
                    style={({ pressed }) => [
                      styles.errorBtn,
                      styles.errorNextBtn,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <Play size={11} color="#FFFFFF" fill="#FFFFFF" />
                    <Text style={styles.errorNextText}>
                      Đổi sang {playbackError.suggestedEp.name}
                    </Text>
                  </Pressable>
                )}

                {currentEpisode?.link_embed ? (
                  <Pressable
                    onPress={handleOpenEmbedBrowser}
                    style={({ pressed }) => [
                      styles.errorBtn,
                      styles.errorBrowserBtn,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <ExternalLink size={12} color="#20D66B" strokeWidth={2.2} />
                    <Text style={styles.errorBrowserText}>Mở Web Player</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Episode Controls & Metadata */}
      <ScrollView contentContainerStyle={styles.metaScroll} bounces={false}>
        {/* Title, Badges & Metadata */}
        <View style={styles.headerCard}>
          <View style={styles.badgeRow}>
            {movie.quality ? (
              <View style={styles.badgeQuality}>
                <Text style={styles.badgeQualityText}>{movie.quality}</Text>
              </View>
            ) : null}
            {movie.lang ? (
              <View style={styles.badgeLang}>
                <Text style={styles.badgeLangText}>{movie.lang}</Text>
              </View>
            ) : null}
            {movie.year ? (
              <View style={styles.badgeMuted}>
                <Text style={styles.badgeMutedText}>{movie.year}</Text>
              </View>
            ) : null}
            {movie.time ? (
              <View style={styles.badgeMuted}>
                <Text style={styles.badgeMutedText}>{movie.time}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.movieTitle} numberOfLines={2}>
            {movie.name}
          </Text>

          {movie.origin_name ? (
            <Text style={styles.originTitle} numberOfLines={1}>
              {movie.origin_name}
            </Text>
          ) : null}
        </View>

        {/* Server Selector (Nguồn Phát) */}
        {movie.episodes && movie.episodes.length > 1 && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Layers size={14} color="#20D66B" strokeWidth={2.4} />
              <Text style={styles.sectionHeader}>Nguồn Phát (Server)</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.serverRow}
            >
              {movie.episodes.map((srv, idx) => {
                const isActive = selectedServerIdx === idx;
                return (
                  <Pressable
                    key={srv.server_name || idx}
                    onPress={() => {
                      haptic.selection();
                      setSelectedServerIdx(idx);
                      setPlaybackError(null);
                    }}
                    style={[
                      styles.serverChip,
                      isActive && styles.serverChipActive,
                    ]}
                  >
                    <Zap
                      size={12}
                      color={isActive ? "#20D66B" : "rgba(255, 255, 255, 0.5)"}
                      strokeWidth={2.4}
                    />
                    <Text
                      style={[
                        styles.serverChipText,
                        isActive && styles.serverChipTextActive,
                      ]}
                    >
                      {srv.server_name || `Server ${idx + 1}`}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Episode Selector Section */}
        <View style={styles.sectionBlock}>
          <View style={styles.epHeaderWithSearch}>
            <View style={styles.sectionHeaderRow}>
              <Tv size={14} color="#20D66B" strokeWidth={2.4} />
              <Text style={styles.sectionHeader}>
                Danh Sách Tập ({episodeList.length})
              </Text>
            </View>

            {episodeList.length > 12 && (
              <View style={styles.miniSearch}>
                <Search size={12} color="rgba(255, 255, 255, 0.5)" />
                <TextInput
                  value={epSearch}
                  onChangeText={setEpSearch}
                  placeholder="Lọc số tập..."
                  placeholderTextColor="rgba(255, 255, 255, 0.35)"
                  style={styles.miniSearchInput}
                />
              </View>
            )}
          </View>

          {/* Single Episode Movie: Cinema Ticket Card */}
          {isSingleEp ? (
            <View style={styles.singleEpCard}>
              <View style={styles.singleEpLeft}>
                <View style={styles.playIconCircle}>
                  <Play size={15} color="#050807" fill="#050807" />
                </View>
                <View style={styles.singleEpInfo}>
                  <Text style={styles.singleEpTitle}>
                    Bản Chiếu Đầy Đủ ({currentEpisode.name || "Full Movie"})
                  </Text>
                  <Text style={styles.singleEpSub}>
                    Trọn bộ không gián đoạn • {movie.time || "Độ nét cao"}
                  </Text>
                </View>
              </View>
              <View style={styles.playingBadge}>
                <View style={styles.playingDot} />
                <Text style={styles.playingBadgeText}>ĐANG PHÁT</Text>
              </View>
            </View>
          ) : (
            /* Multi-Episode Series Grid */
            <View style={styles.epGrid}>
              {filteredEpisodes.map((ep) => {
                const isActive = ep.slug === currentEpisode.slug;
                const isCurrentWithError = isActive && !!playbackError;

                return (
                  <Pressable
                    key={ep.slug}
                    onPress={() => handleSelectEpisode(ep.slug)}
                    style={({ pressed }) => [
                      styles.epItem,
                      { width: epCardWidth },
                      isActive && styles.epItemActive,
                      isCurrentWithError && styles.epItemError,
                      pressed && styles.epItemPressed,
                    ]}
                  >
                    {isCurrentWithError ? (
                      <AlertCircle size={10} color="#EF4444" style={{ marginRight: 4 }} />
                    ) : isActive ? (
                      <Play size={10} color="#20D66B" fill="#20D66B" style={{ marginRight: 4 }} />
                    ) : null}
                    <Text
                      style={[
                        styles.epItemText,
                        isActive && styles.epItemTextActive,
                        isCurrentWithError && styles.epItemTextError,
                      ]}
                      numberOfLines={1}
                    >
                      {ep.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Synopsis & Movie Info Card */}
        {movie.content ? (
          <View style={styles.synopsisCard}>
            <View style={styles.sectionHeaderRow}>
              <FileText size={14} color="#20D66B" strokeWidth={2.4} />
              <Text style={styles.sectionHeader}>Tóm Tắt Phim</Text>
            </View>

            <Text
              style={styles.synopsisText}
              numberOfLines={expandedContent ? undefined : 3}
            >
              {cleanHtml(movie.content)}
            </Text>

            {cleanHtml(movie.content).length > 150 && (
              <Pressable
                onPress={() => {
                  haptic.selection();
                  setExpandedContent(!expandedContent);
                }}
                style={styles.expandBtn}
              >
                <Text style={styles.expandText}>
                  {expandedContent ? "Thu gọn ▴" : "Xem thêm ▾"}
                </Text>
              </Pressable>
            )}

            {/* Categories Pills */}
            {movie.category && movie.category.length > 0 && (
              <View style={styles.catChipsRow}>
                {movie.category.map((c) => (
                  <View key={c.id || c.slug} style={styles.catChip}>
                    <Text style={styles.catChipText}>{c.name}</Text>
                  </View>
                ))}
                {movie.country && movie.country[0] && (
                  <View style={styles.countryChip}>
                    <Text style={styles.countryChipText}>{movie.country[0].name}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050807",
  },
  centerContainer: {
    flex: 1,
    backgroundColor: "#050807",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  loadingText: {
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: 13,
    fontWeight: "500",
  },
  errorTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  errorSubtitle: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 13,
    textAlign: "center",
    maxWidth: 280,
  },
  backBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "rgba(32, 214, 107, 0.15)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(32, 214, 107, 0.35)",
  },
  backBtnText: {
    color: "#20D66B",
    fontSize: 13.5,
    fontWeight: "800",
  },
  topSafeArea: {
    backgroundColor: "#070C09",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.07)",
  },
  navBar: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  navBackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  navBackText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "700",
  },
  navCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  navTitle: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  navSubtitle: {
    color: "#20D66B",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 1,
  },
  navRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  navIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  navFavActive: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "rgba(239, 68, 68, 0.35)",
  },
  navBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  playerFrameContainer: {
    backgroundColor: "#000000",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  playerSurface: {
    backgroundColor: "#000000",
    overflow: "hidden",
    position: "relative",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(32, 214, 107, 0.18)",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  errorOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(5, 8, 7, 0.94)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  errorIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(239, 68, 68, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  errorOverlayTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 3,
  },
  errorOverlaySub: {
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 15,
    marginBottom: 10,
    maxWidth: 300,
  },
  errorActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 7,
  },
  errorBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    height: 32,
    borderRadius: Radii.sm,
  },
  errorRetryBtn: {
    backgroundColor: Colors.primary,
  },
  errorRetryText: {
    color: "#050807",
    fontSize: 11,
    fontWeight: "800",
  },
  errorNextBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.20)",
  },
  errorNextText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  errorBrowserBtn: {
    backgroundColor: "rgba(32, 214, 107, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(32, 214, 107, 0.35)",
  },
  errorBrowserText: {
    color: "#20D66B",
    fontSize: 11,
    fontWeight: "700",
  },
  metaScroll: {
    padding: 14,
    paddingBottom: 40,
    gap: 14,
  },
  headerCard: {
    backgroundColor: "rgba(13, 20, 17, 0.75)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 14,
    gap: 6,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  badgeQuality: {
    backgroundColor: "rgba(32, 214, 107, 0.18)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(32, 214, 107, 0.4)",
  },
  badgeQualityText: {
    color: "#20D66B",
    fontSize: 10.5,
    fontWeight: "800",
  },
  badgeLang: {
    backgroundColor: "rgba(59, 130, 246, 0.18)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.4)",
  },
  badgeLangText: {
    color: "#60A5FA",
    fontSize: 10.5,
    fontWeight: "700",
  },
  badgeMuted: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeMutedText: {
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: 10.5,
    fontWeight: "600",
  },
  movieTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  originTitle: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 12.5,
    fontWeight: "500",
  },
  sectionBlock: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  sectionHeader: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  serverRow: {
    gap: 8,
  },
  serverChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  serverChipActive: {
    backgroundColor: "rgba(32, 214, 107, 0.12)",
    borderColor: "#20D66B",
  },
  serverChipText: {
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: 12,
    fontWeight: "600",
  },
  serverChipTextActive: {
    color: "#20D66B",
    fontWeight: "800",
  },
  epHeaderWithSearch: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  miniSearch: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 14,
    paddingHorizontal: 9,
    height: 28,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  miniSearchInput: {
    color: "#FFFFFF",
    fontSize: 11,
    paddingVertical: 0,
    width: 80,
  },
  singleEpCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(13, 20, 17, 0.85)",
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: "rgba(32, 214, 107, 0.4)",
    padding: 12,
  },
  singleEpLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  playIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#20D66B",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#20D66B",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  singleEpInfo: {
    flex: 1,
  },
  singleEpTitle: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "800",
  },
  singleEpSub: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  playingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(32, 214, 107, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(32, 214, 107, 0.3)",
  },
  playingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#20D66B",
  },
  playingBadgeText: {
    color: "#20D66B",
    fontSize: 10,
    fontWeight: "900",
  },
  epGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  epItem: {
    height: 38,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  epItemActive: {
    backgroundColor: "rgba(32, 214, 107, 0.16)",
    borderColor: "#20D66B",
    borderWidth: 1.2,
  },
  epItemError: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderColor: "#EF4444",
    borderWidth: 1.2,
  },
  epItemPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  epItemText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    fontWeight: "600",
  },
  epItemTextActive: {
    color: "#20D66B",
    fontWeight: "900",
  },
  epItemTextError: {
    color: "#EF4444",
    fontWeight: "800",
  },
  synopsisCard: {
    backgroundColor: "rgba(13, 20, 17, 0.75)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 14,
    gap: 8,
  },
  synopsisText: {
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: 12.5,
    lineHeight: 19,
  },
  expandBtn: {
    alignSelf: "flex-start",
    paddingVertical: 2,
  },
  expandText: {
    color: "#20D66B",
    fontSize: 12,
    fontWeight: "700",
  },
  catChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  catChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: "rgba(32, 214, 107, 0.10)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(32, 214, 107, 0.25)",
  },
  catChipText: {
    color: "#20D66B",
    fontSize: 11,
    fontWeight: "700",
  },
  countryChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.10)",
  },
  countryChipText: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 11,
    fontWeight: "600",
  },
  btnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.95 }],
  },
});
