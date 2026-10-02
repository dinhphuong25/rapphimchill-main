import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import {
  Play,
  Info,
  Flame,
  Film,
  Tv,
  Clapperboard,
  Sparkles,
  ChevronRight,
  Heart,
  Globe,
  Clock,
  RotateCcw,
  Ghost,
  Compass,
  Shield,
  Layers,
  Cat,
} from "lucide-react-native";
import { NativeHeader } from "@/components/ui/NativeHeader";
import { MovieCard } from "@/components/ui/MovieCard";
import {
  fetchNewReleases,
  fetchListByType,
  MovieItem,
} from "@/services/api";
import {
  getWatchHistory,
  HistoryItem,
  isFavorite,
  toggleFavorite,
} from "@/services/storage";
import { useUserAuth } from "@/context/UserAuthContext";
import { Colors } from "@/constants/theme";
import { haptic } from "@/services/haptics";

const QUICK_TAGS = [
  { label: "Chiếu Rạp", segment: "cinema", slug: "", icon: Clapperboard, color: "#FB7185" },
  { label: "Phim Bộ", segment: "type", slug: "phim-bo", icon: Tv, color: "#38BDF8" },
  { label: "Phim Lẻ", segment: "type", slug: "phim-le", icon: Film, color: "#34D399" },
  { label: "Hoạt Hình", segment: "type", slug: "hoat-hinh", icon: Cat, color: "#FBBF24" },
  { label: "Hàn Quốc", segment: "country", slug: "han-quoc", icon: Globe, color: "#2DD4BF" },
  { label: "Hành Động", segment: "category", slug: "hanh-dong", icon: Flame, color: "#FB923C" },
  { label: "Tình Cảm", segment: "category", slug: "tinh-cam", icon: Heart, color: "#F43F5E" },
];

const FEATURED_CATEGORIES = [
  { slug: "hanh-dong", name: "Hành Động", icon: Flame, color: "#FB923C", bg: "rgba(249, 115, 22, 0.14)", border: "rgba(249, 115, 22, 0.35)", desc: "Kịch tính, gay cấn" },
  { slug: "co-trang", name: "Cổ Trang", icon: Sparkles, color: "#FBBF24", bg: "rgba(251, 191, 36, 0.14)", border: "rgba(251, 191, 36, 0.35)", desc: "Tiên hiệp, kiếm hiệp" },
  { slug: "tinh-cam", name: "Tình Cảm", icon: Heart, color: "#F43F5E", bg: "rgba(244, 63, 94, 0.14)", border: "rgba(244, 63, 94, 0.35)", desc: "Lãng mạn, ngọt ngào" },
  { slug: "kinh-di", name: "Kinh Dị", icon: Ghost, color: "#A855F7", bg: "rgba(168, 85, 247, 0.14)", border: "rgba(168, 85, 247, 0.35)", desc: "Hồi hộp, rùng rợn" },
  { slug: "vien-tuong", name: "Viễn Tưởng", icon: Compass, color: "#38BDF8", bg: "rgba(56, 189, 248, 0.14)", border: "rgba(56, 189, 248, 0.35)", desc: "Vũ trụ, tương lai" },
  { slug: "vo-thuat", name: "Võ Thuật", icon: Shield, color: "#34D399", bg: "rgba(52, 211, 153, 0.14)", border: "rgba(52, 211, 153, 0.35)", desc: "Kungfu, đối kháng" },
  { slug: "hai-huoc", name: "Hài Hước", icon: Sparkles, color: "#F59E0B", bg: "rgba(245, 158, 11, 0.14)", border: "rgba(245, 158, 11, 0.35)", desc: "Giải trí, vui nhộn" },
  { slug: "tam-ly", name: "Tâm Lý", icon: Film, color: "#818CF8", bg: "rgba(129, 140, 248, 0.14)", border: "rgba(129, 140, 248, 0.35)", desc: "Sâu sắc, cuốn hút" },
];

const FEATURED_COUNTRIES = [
  { slug: "han-quoc", name: "Hàn Quốc", flag: "🇰🇷", color: "#2DD4BF", bg: "rgba(45, 212, 191, 0.12)", border: "rgba(45, 212, 191, 0.35)" },
  { slug: "trung-quoc", name: "Trung Quốc", flag: "🇨🇳", color: "#F43F5E", bg: "rgba(244, 63, 94, 0.12)", border: "rgba(244, 63, 94, 0.35)" },
  { slug: "au-my", name: "Âu Mỹ", flag: "🇺🇸", color: "#38BDF8", bg: "rgba(56, 189, 248, 0.12)", border: "rgba(56, 189, 248, 0.35)" },
  { slug: "nhat-ban", name: "Nhật Bản", flag: "🇯🇵", color: "#FB7185", bg: "rgba(251, 113, 133, 0.12)", border: "rgba(251, 113, 133, 0.35)" },
  { slug: "thai-lan", name: "Thái Lan", flag: "🇹🇭", color: "#FBBF24", bg: "rgba(251, 191, 36, 0.12)", border: "rgba(251, 191, 36, 0.35)" },
  { slug: "viet-nam", name: "Việt Nam", flag: "🇻🇳", color: "#34D399", bg: "rgba(52, 211, 153, 0.12)", border: "rgba(52, 211, 153, 0.35)" },
  { slug: "hong-kong", name: "Hồng Kông", flag: "🇭🇰", color: "#A78BFA", bg: "rgba(167, 139, 250, 0.12)", border: "rgba(167, 139, 250, 0.35)" },
  { slug: "an-do", name: "Ấn Độ", flag: "🇮🇳", color: "#FB923C", bg: "rgba(251, 146, 60, 0.12)", border: "rgba(251, 146, 60, 0.35)" },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, openAuthModal } = useUserAuth();
  const { width: screenWidth } = useWindowDimensions();

  const [trending, setTrending] = useState<MovieItem[]>([]);
  const [cinema, setCinema] = useState<MovieItem[]>([]);
  const [series, setSeries] = useState<MovieItem[]>([]);
  const [singles, setSingles] = useState<MovieItem[]>([]);
  const [anime, setAnime] = useState<MovieItem[]>([]);
  const [continueWatching, setContinueWatching] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [heroFav, setHeroFav] = useState(false);

  const heroScrollRef = useRef<ScrollView>(null);

  const loadData = useCallback(async () => {
    try {
      const [trendRes, cinemaRes, seriesRes, singleRes, animeRes, history] =
        await Promise.all([
          fetchNewReleases(1),
          fetchListByType("phim-chieu-rap", 1),
          fetchListByType("phim-bo", 1),
          fetchListByType("phim-le", 1),
          fetchListByType("hoat-hinh", 1),
          getWatchHistory(),
        ]);

      setTrending(trendRes.items.slice(0, 15));
      setCinema(cinemaRes.items.slice(0, 12));
      setSeries(seriesRes.items.slice(0, 12));
      setSingles(singleRes.items.slice(0, 12));
      setAnime(animeRes.items.slice(0, 12));
      setContinueWatching(history.slice(0, 6));

      if (user && trendRes.items[0]) {
        const fav = await isFavorite(trendRes.items[0].slug);
        setHeroFav(fav);
      } else {
        setHeroFav(false);
      }
    } catch (err) {
      console.error("Home load data error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh history & favorite whenever tab gains focus
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      getWatchHistory().then((hist) => {
        if (isMounted) setContinueWatching(hist.slice(0, 6));
      });
      return () => {
        isMounted = false;
      };
    }, [user])
  );

  const onRefresh = () => {
    haptic.light();
    setRefreshing(true);
    loadData();
  };

  const handleHeroScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);
    if (index !== activeHeroIndex && index >= 0 && index < 5) {
      setActiveHeroIndex(index);
      if (heroMovies[index]) {
        if (user) {
          isFavorite(heroMovies[index].slug).then(setHeroFav);
        } else {
          setHeroFav(false);
        }
      }
    }
  };

  const handleToggleHeroFav = async () => {
    const current = heroMovies[activeHeroIndex];
    if (!current) return;
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
    const nextState = await toggleFavorite(current);
    setHeroFav(nextState);
  };

  const handleQuickTagPress = (tag: (typeof QUICK_TAGS)[0]) => {
    haptic.selection();
    if (tag.segment === "cinema") {
      router.push("/(tabs)/cinema");
    } else {
      router.push({
        pathname: "/explore",
        params: { segment: tag.segment, slug: tag.slug, name: tag.label },
      });
    }
  };

  const heroMovies = trending.slice(0, 5);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang tải phim điện ảnh mới nhất...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Floating Rounded Nav Bar */}
      <NativeHeader />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ==================================================== */}
        {/* HERO SECTION — IMMERSIVE CINEMA EDITORIAL            */}
        {/* ==================================================== */}
        {heroMovies.length > 0 && (
          <View style={styles.heroSection}>
            <ScrollView
              ref={heroScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleHeroScroll}
              style={{ width: screenWidth }}
            >
              {heroMovies.map((movie, idx) => (
                <View key={movie.slug} style={[styles.heroSlide, { width: screenWidth }]}>
                  {/* Backdrop Poster */}
                  <Image
                    source={{ uri: movie.poster_url || movie.thumb_url }}
                    style={styles.heroImage}
                    contentFit="cover"
                    transition={300}
                    cachePolicy="memory-disk"
                  />

                  {/* Gradient Masks */}
                  <LinearGradient
                    colors={["rgba(5, 8, 7, 0.45)", "transparent"]}
                    style={styles.heroGradientTop}
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(5, 8, 7, 0.75)", "#050807"]}
                    locations={[0, 0.55, 1]}
                    style={styles.heroGradientBottom}
                  />

                  {/* Slide Content */}
                  <View style={styles.heroInfo}>
                    {/* Top Ribbon & Metadata Badges */}
                    <View style={styles.heroTopRibbonRow}>
                      <View style={styles.trendingRibbon}>
                        <Flame size={12} color="#20D66B" fill="#20D66B" />
                        <Text style={styles.trendingRibbonText}>
                          TOP #{String(idx + 1).padStart(2, "0")} THỊNH HÀNH
                        </Text>
                      </View>

                      <View style={styles.heroQualityBadge}>
                        <Text style={styles.heroQualityText}>{movie.quality || "FHD"}</Text>
                      </View>

                      <View style={styles.heroYearBadge}>
                        <Text style={styles.heroYearText}>{movie.year || 2026}</Text>
                      </View>

                      {movie.episode_current ? (
                        <View style={styles.heroEpBadge}>
                          <Text style={styles.heroEpText}>{movie.episode_current}</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Movie Titles */}
                    <Text style={styles.heroTitle} numberOfLines={2}>
                      {movie.name}
                    </Text>
                    <Text style={styles.heroOriginTitle} numberOfLines={1}>
                      {movie.origin_name}
                    </Text>

                    {/* Action Buttons Row */}
                    <View style={styles.heroActionRow}>
                      {/* Xem Ngay CTA */}
                      <Pressable
                        onPress={() => {
                          haptic.heavy();
                          router.push({
                            pathname: "/watch/[slug]",
                            params: { slug: movie.slug },
                          });
                        }}
                        style={({ pressed }) => [
                          styles.heroPlayBtn,
                          pressed && styles.btnPressed,
                        ]}
                      >
                        <Play size={16} color="#050807" fill="#050807" />
                        <Text style={styles.heroPlayText}>XEM NGAY</Text>
                      </Pressable>

                      {/* Favorite Heart Button */}
                      <Pressable
                        onPress={handleToggleHeroFav}
                        style={({ pressed }) => [
                          styles.heroFavBtn,
                          heroFav && styles.heroFavBtnActive,
                          pressed && styles.btnPressed,
                        ]}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Heart
                          size={17}
                          color={heroFav ? "#20D66B" : "#FFFFFF"}
                          fill={heroFav ? "#20D66B" : "transparent"}
                        />
                      </Pressable>

                      {/* Chi Tiết Info Button */}
                      <Pressable
                        onPress={() => {
                          haptic.light();
                          router.push({
                            pathname: "/movie/[slug]",
                            params: { slug: movie.slug },
                          });
                        }}
                        style={({ pressed }) => [
                          styles.heroDetailBtn,
                          pressed && styles.btnPressed,
                        ]}
                      >
                        <Info size={15} color="#FFFFFF" strokeWidth={2.2} />
                        <Text style={styles.heroDetailText}>Chi tiết</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Paging Indicators (Elongated Capsule for Active Slide) */}
            <View style={styles.dotContainer}>
              {heroMovies.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    activeHeroIndex === i ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* ==================================================== */}
        {/* QUICK TAGS / CATEGORY PILLS WITH COLOR ICONS         */}
        {/* ==================================================== */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickTagsScroll}
        >
          {QUICK_TAGS.map((tag) => {
            const Icon = tag.icon;
            return (
              <Pressable
                key={tag.label}
                onPress={() => handleQuickTagPress(tag)}
                style={({ pressed }) => [
                  styles.quickTagChip,
                  pressed && styles.quickTagPressed,
                ]}
              >
                <Icon size={14} color={tag.color} strokeWidth={2.2} />
                <Text style={styles.quickTagText}>{tag.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ==================================================== */}
        {/* TIẾP TỤC XEM (CONTINUE WATCHING ROW)                 */}
        {/* ==================================================== */}
        {continueWatching.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionIconBadge, { backgroundColor: "rgba(32, 214, 107, 0.15)", borderColor: "rgba(32, 214, 107, 0.35)" }]}>
                  <RotateCcw size={14} color="#20D66B" strokeWidth={2.4} />
                </View>
                <Text style={styles.sectionTitle}>Tiếp Tục Xem</Text>
              </View>
              <Pressable
                onPress={() => router.push("/(tabs)/history")}
                style={styles.seeAllBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.seeAllText}>Lịch sử</Text>
                <ChevronRight size={14} color="#20D66B" strokeWidth={2.4} />
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {continueWatching.map((item) => (
                <Pressable
                  key={item.slug}
                  onPress={() => {
                    haptic.heavy();
                    router.push({
                      pathname: "/watch/[slug]",
                      params: {
                        slug: item.slug,
                        ep: item.lastEpisodeSlug || "1",
                      },
                    });
                  }}
                  style={({ pressed }) => [
                    styles.continueCard,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <View style={styles.continueThumbWrapper}>
                    <Image
                      source={{ uri: item.thumb_url || item.poster_url }}
                      style={styles.continueThumb}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                    <View style={styles.continuePlayOverlay}>
                      <View style={styles.continuePlayCircle}>
                        <Play size={12} color="#050807" fill="#050807" />
                      </View>
                    </View>
                    {/* Progress Bar */}
                    <View style={styles.continueProgressBar}>
                      <View style={styles.continueProgressFill} />
                    </View>
                  </View>
                  <Text style={styles.continueName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.continueEp} numberOfLines={1}>
                    {item.lastEpisodeName ? `Xem tiếp: ${item.lastEpisodeName}` : "Xem tiếp ngay"}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ==================================================== */}
        {/* SECTION 01: TOP THỊNH HÀNH                           */}
        {/* ==================================================== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionIndexNumber}>01</Text>
              <View style={[styles.sectionIconBadge, { backgroundColor: "rgba(249, 115, 22, 0.15)", borderColor: "rgba(249, 115, 22, 0.35)" }]}>
                <Flame size={15} color="#FB923C" strokeWidth={2.4} />
              </View>
              <Text style={styles.sectionTitle}>Top Thịnh Hành</Text>
            </View>
            <Pressable
              onPress={() => router.push({ pathname: "/explore", params: { segment: "type", slug: "phim-moi-cap-nhat", name: "Mới Cập Nhật" } })}
              style={styles.seeAllBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.seeAllText}>Xem tất cả</Text>
              <ChevronRight size={14} color="#20D66B" strokeWidth={2.4} />
            </Pressable>
          </View>

          <FlatList
            data={trending}
            keyExtractor={(item) => item.slug}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            initialNumToRender={5}
            renderItem={({ item }) => <MovieCard movie={item} width={142} style={{ marginRight: 12 }} />}
          />
        </View>

        {/* ==================================================== */}
        {/* SECTION 02: PHIM CHIẾU RẠP                           */}
        {/* ==================================================== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionIndexNumber}>02</Text>
              <View style={[styles.sectionIconBadge, { backgroundColor: "rgba(244, 63, 94, 0.15)", borderColor: "rgba(244, 63, 94, 0.35)" }]}>
                <Film size={15} color="#FB7185" strokeWidth={2.4} />
              </View>
              <Text style={styles.sectionTitle}>Phim Chiếu Rạp Mới</Text>
            </View>
            <Pressable
              onPress={() => router.push("/(tabs)/cinema")}
              style={styles.seeAllBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.seeAllText}>Xem tất cả</Text>
              <ChevronRight size={14} color="#20D66B" strokeWidth={2.4} />
            </Pressable>
          </View>

          <FlatList
            data={cinema}
            keyExtractor={(item) => item.slug}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            initialNumToRender={5}
            renderItem={({ item }) => <MovieCard movie={item} width={142} style={{ marginRight: 12 }} />}
          />
        </View>

        {/* ==================================================== */}
        {/* KHÁM PHÁ THEO THỂ LOẠI (FEATURED GENRES)             */}
        {/* ==================================================== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIconBadge, { backgroundColor: "rgba(32, 214, 107, 0.15)", borderColor: "rgba(32, 214, 107, 0.35)" }]}>
                <Layers size={15} color="#20D66B" strokeWidth={2.4} />
              </View>
              <Text style={styles.sectionTitle}>Khám Phá Theo Thể Loại</Text>
            </View>
            <Pressable
              onPress={() => router.push({ pathname: "/explore", params: { segment: "category" } })}
              style={styles.seeAllBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.seeAllText}>Tất cả thể loại</Text>
              <ChevronRight size={14} color="#20D66B" strokeWidth={2.4} />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryCardsScroll}
          >
            {FEATURED_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Pressable
                  key={cat.slug}
                  onPress={() => {
                    haptic.selection();
                    router.push({
                      pathname: "/explore",
                      params: { segment: "category", slug: cat.slug, name: cat.name },
                    });
                  }}
                  style={({ pressed }) => [
                    styles.categoryCard,
                    { borderColor: cat.border, backgroundColor: cat.bg },
                    pressed && styles.btnPressed,
                  ]}
                >
                  <View style={[styles.categoryCardIconBox, { backgroundColor: "rgba(0, 0, 0, 0.25)" }]}>
                    <Icon size={18} color={cat.color} strokeWidth={2.4} />
                  </View>
                  <Text style={styles.categoryCardName} numberOfLines={1}>
                    {cat.name}
                  </Text>
                  <Text style={styles.categoryCardDesc} numberOfLines={1}>
                    {cat.desc}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ==================================================== */}
        {/* SECTION 03: PHIM BỘ TIÊU ĐIỂM                        */}
        {/* ==================================================== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionIndexNumber}>03</Text>
              <View style={[styles.sectionIconBadge, { backgroundColor: "rgba(56, 189, 248, 0.15)", borderColor: "rgba(56, 189, 248, 0.35)" }]}>
                <Tv size={15} color="#38BDF8" strokeWidth={2.4} />
              </View>
              <Text style={styles.sectionTitle}>Phim Bộ Đang Hot</Text>
            </View>
            <Pressable
              onPress={() => router.push({ pathname: "/explore", params: { segment: "type", slug: "phim-bo", name: "Phim Bộ" } })}
              style={styles.seeAllBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.seeAllText}>Xem tất cả</Text>
              <ChevronRight size={14} color="#20D66B" strokeWidth={2.4} />
            </Pressable>
          </View>

          <FlatList
            data={series}
            keyExtractor={(item) => item.slug}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            initialNumToRender={5}
            renderItem={({ item }) => <MovieCard movie={item} width={142} style={{ marginRight: 12 }} />}
          />
        </View>

        {/* ==================================================== */}
        {/* SECTION 04: PHIM LẺ ĐIỆN ẢNH                         */}
        {/* ==================================================== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionIndexNumber}>04</Text>
              <View style={[styles.sectionIconBadge, { backgroundColor: "rgba(16, 185, 129, 0.15)", borderColor: "rgba(16, 185, 129, 0.35)" }]}>
                <Clapperboard size={15} color="#34D399" strokeWidth={2.4} />
              </View>
              <Text style={styles.sectionTitle}>Phim Lẻ Điện Ảnh</Text>
            </View>
            <Pressable
              onPress={() => router.push({ pathname: "/explore", params: { segment: "type", slug: "phim-le", name: "Phim Lẻ" } })}
              style={styles.seeAllBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.seeAllText}>Xem tất cả</Text>
              <ChevronRight size={14} color="#20D66B" strokeWidth={2.4} />
            </Pressable>
          </View>

          <FlatList
            data={singles}
            keyExtractor={(item) => item.slug}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            initialNumToRender={5}
            renderItem={({ item }) => <MovieCard movie={item} width={142} style={{ marginRight: 12 }} />}
          />
        </View>

        {/* ==================================================== */}
        {/* KHÁM PHÁ THEO QUỐC GIA (FEATURED COUNTRIES)          */}
        {/* ==================================================== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIconBadge, { backgroundColor: "rgba(45, 212, 191, 0.15)", borderColor: "rgba(45, 212, 191, 0.35)" }]}>
                <Globe size={15} color="#2DD4BF" strokeWidth={2.4} />
              </View>
              <Text style={styles.sectionTitle}>Điện Ảnh Theo Quốc Gia</Text>
            </View>
            <Pressable
              onPress={() => router.push({ pathname: "/explore", params: { segment: "country" } })}
              style={styles.seeAllBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.seeAllText}>Tất cả quốc gia</Text>
              <ChevronRight size={14} color="#20D66B" strokeWidth={2.4} />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryCardsScroll}
          >
            {FEATURED_COUNTRIES.map((cty) => (
              <Pressable
                key={cty.slug}
                onPress={() => {
                  haptic.selection();
                  router.push({
                    pathname: "/explore",
                    params: { segment: "country", slug: cty.slug, name: cty.name },
                  });
                }}
                style={({ pressed }) => [
                  styles.countryCard,
                  { borderColor: cty.border, backgroundColor: cty.bg },
                  pressed && styles.btnPressed,
                ]}
              >
                <Text style={styles.countryFlagText}>{cty.flag}</Text>
                <Text style={styles.countryCardName}>{cty.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ==================================================== */}
        {/* SECTION 05: HOẠT HÌNH & ANIME                        */}
        {/* ==================================================== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionIndexNumber}>05</Text>
              <View style={[styles.sectionIconBadge, { backgroundColor: "rgba(245, 158, 11, 0.15)", borderColor: "rgba(245, 158, 11, 0.35)" }]}>
                <Cat size={15} color="#FBBF24" strokeWidth={2.4} />
              </View>
              <Text style={styles.sectionTitle}>Anime & Hoạt Hình</Text>
            </View>
            <Pressable
              onPress={() => router.push({ pathname: "/explore", params: { segment: "type", slug: "hoat-hinh", name: "Hoạt Hình" } })}
              style={styles.seeAllBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.seeAllText}>Xem tất cả</Text>
              <ChevronRight size={14} color="#20D66B" strokeWidth={2.4} />
            </Pressable>
          </View>

          <FlatList
            data={anime}
            keyExtractor={(item) => item.slug}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            initialNumToRender={5}
            renderItem={({ item }) => <MovieCard movie={item} width={142} style={{ marginRight: 12 }} />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 115,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  heroSection: {
    position: "relative",
    height: 440,
    backgroundColor: Colors.surface,
  },
  heroSlide: {
    height: 440,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroGradientTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 1,
  },
  heroGradientBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 260,
    zIndex: 1,
  },
  heroInfo: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  heroTopRibbonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  trendingRibbon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(32, 214, 107, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(32, 214, 107, 0.4)",
  },
  trendingRibbonText: {
    color: "#20D66B",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  heroQualityBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  heroQualityText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
  heroYearBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  heroYearText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 10,
    fontWeight: "700",
  },
  heroEpBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    backgroundColor: "rgba(32, 214, 107, 0.12)",
    borderWidth: 0.5,
    borderColor: "rgba(32, 214, 107, 0.3)",
  },
  heroEpText: {
    color: "#20D66B",
    fontSize: 10,
    fontWeight: "800",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 28,
    letterSpacing: -0.4,
    textShadowColor: "rgba(0, 0, 0, 0.9)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroOriginTitle: {
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: 12.5,
    fontWeight: "500",
    marginTop: 2,
    marginBottom: 12,
    fontStyle: "italic",
  },
  heroActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroPlayBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#20D66B",
    paddingHorizontal: 20,
    height: 42,
    borderRadius: 21,
    shadowColor: "#20D66B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  heroPlayText: {
    color: "#050807",
    fontSize: 12.5,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  heroFavBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroFavBtnActive: {
    backgroundColor: "rgba(32, 214, 107, 0.18)",
    borderColor: "#20D66B",
  },
  heroDetailBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 21,
  },
  heroDetailText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  btnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  dotContainer: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    zIndex: 20,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    width: 28,
    backgroundColor: "#20D66B",
  },
  dotInactive: {
    width: 6,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  quickTagsScroll: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 8,
  },
  quickTagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  quickTagPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.95 }],
  },
  quickTagText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionIndexNumber: {
    color: "#20D66B",
    fontSize: 12,
    fontWeight: "900",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    letterSpacing: 0.5,
    marginRight: 2,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  seeAllText: {
    color: "#20D66B",
    fontSize: 12.5,
    fontWeight: "700",
  },
  horizontalList: {
    paddingLeft: 16,
    paddingRight: 6,
  },
  continueCard: {
    width: 140,
    marginRight: 12,
  },
  continueThumbWrapper: {
    width: 140,
    height: 84,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.card,
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  continueThumb: {
    width: "100%",
    height: "100%",
  },
  continuePlayOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  continuePlayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#20D66B",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  continueProgressBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  continueProgressFill: {
    width: "60%",
    height: "100%",
    backgroundColor: "#20D66B",
  },
  continueName: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "800",
    marginTop: 6,
  },
  continueEp: {
    color: "#20D66B",
    fontSize: 10.5,
    fontWeight: "600",
    marginTop: 2,
  },
  categoryCardsScroll: {
    paddingLeft: 16,
    paddingRight: 6,
    gap: 10,
  },
  categoryCard: {
    width: 130,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.2,
    justifyContent: "space-between",
  },
  categoryCardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  categoryCardName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  categoryCardDesc: {
    fontSize: 10.5,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: 2,
  },
  countryCard: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.2,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  countryFlagText: {
    fontSize: 18,
  },
  countryCardName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
