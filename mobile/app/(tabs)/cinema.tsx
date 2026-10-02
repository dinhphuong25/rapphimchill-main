import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Film, Sparkles } from "lucide-react-native";
import { NativeHeader } from "@/components/ui/NativeHeader";
import { MovieCard } from "@/components/ui/MovieCard";
import { fetchListByType, fetchMoviesByCategory, MovieItem } from "@/services/api";
import { Colors, Radii } from "@/constants/theme";
import { haptic } from "@/services/haptics";

const CINEMA_FILTERS = [
  { label: "Tất cả", slug: "all" },
  { label: "Hành Động", slug: "hanh-dong" },
  { label: "Kinh Dị", slug: "kinh-di" },
  { label: "Viễn Tưởng", slug: "vien-tuong" },
  { label: "Hài Hước", slug: "hai-huoc" },
  { label: "Tình Cảm", slug: "tinh-cam" },
];

export default function CinemaScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const numColumns = 2;

  const cardSpacing = 12;
  const horizontalPadding = 14;
  const cardWidth = Math.floor((screenWidth - horizontalPadding * 2 - cardSpacing) / 2);

  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (filterSlug = selectedFilter, p = 1, append = false) => {
    try {
      let res;
      if (filterSlug === "all") {
        res = await fetchListByType("phim-chieu-rap", p);
      } else {
        res = await fetchMoviesByCategory(filterSlug, p);
      }

      if (append) {
        setMovies((prev) => {
          const seen = new Set(prev.map((m) => m.slug));
          const newItems = res.items.filter((m) => !seen.has(m.slug));
          return [...prev, ...newItems];
        });
      } else {
        setMovies(res.items);
      }
      setTotalPages(res.totalPages);
      setPage(p);
    } catch (err) {
      console.error("Cinema load error:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [selectedFilter]);

  useEffect(() => {
    loadData(selectedFilter, 1, false);
  }, [selectedFilter, loadData]);

  const handleFilterSelect = (slug: string) => {
    if (slug === selectedFilter) return;
    haptic.selection();
    setSelectedFilter(slug);
    setLoading(true);
  };

  const onRefresh = () => {
    haptic.light();
    setRefreshing(true);
    loadData(selectedFilter, 1, false);
  };

  const onEndReached = () => {
    if (!loadingMore && page < totalPages) {
      setLoadingMore(true);
      loadData(selectedFilter, page + 1, true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <NativeHeader />

      {/* Header Info with Grid Switcher */}
      <View style={styles.headerTitleRow}>
        <View style={styles.headerTopLine}>
          <View style={styles.titleIconRow}>
            <Film size={22} color={Colors.primary} strokeWidth={2.4} />
            <Text style={styles.title}>Phim Chiếu Rạp</Text>
          </View>
        </View>

        <Text style={styles.sub}>
          Tuyển chọn bom tấn rạp chiếu phim chất lượng cao Vietsub & Thuyết minh
        </Text>
      </View>

      {/* Filter Horizontal Chips */}
      <View style={styles.filterBar}>
        <FlatList
          data={CINEMA_FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.slug}
          contentContainerStyle={styles.filterScroll}
          renderItem={({ item }) => {
            const active = item.slug === selectedFilter;
            return (
              <Pressable
                onPress={() => handleFilterSelect(item.slug)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Movie Grid */}
      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải phim chiếu rạp...</Text>
        </View>
      ) : (
        <FlatList
          key={String(numColumns)}
          data={movies}
          numColumns={numColumns}
          keyExtractor={(item, index) => `${item._id || item.slug}-${index}`}
          renderItem={({ item }) => <MovieCard movie={item} width={cardWidth} />}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          onRefresh={onRefresh}
          initialNumToRender={numColumns === 2 ? 6 : 9}
          maxToRenderPerBatch={numColumns === 2 ? 8 : 12}
          windowSize={7}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerTitleRow: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },
  headerTopLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  sub: {
    color: Colors.textDim,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  filterBar: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  filterScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  filterChipActive: {
    backgroundColor: "#20D66B",
    borderColor: "#20D66B",
    shadowColor: "#20D66B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  filterText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#050807",
    fontWeight: "900",
  },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 115,
    paddingTop: 12,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  loadingCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  footerLoader: {
    paddingVertical: 18,
    alignItems: "center",
  },
});
