import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Clock, Sparkles, Trash2, LogIn, Lock, Film } from "lucide-react-native";
import { NativeHeader } from "@/components/ui/NativeHeader";
import { MovieCard } from "@/components/ui/MovieCard";
import {
  getWatchHistory,
  clearWatchHistory,
  removeWatchHistory,
  HistoryItem,
} from "@/services/storage";
import { syncDataWithServer } from "@/services/auth";
import { useUserAuth } from "@/context/UserAuthContext";
import { Colors, Radii } from "@/constants/theme";
import { haptic } from "@/services/haptics";

export default function HistoryScreen() {
  const router = useRouter();
  const { user, loading: authLoading, openAuthModal } = useUserAuth();
  const { width: screenWidth } = useWindowDimensions();
  const numColumns = 2;

  const cardSpacing = 12;
  const horizontalPadding = 14;
  const cardWidth = Math.floor((screenWidth - horizontalPadding * 2 - cardSpacing) / 2);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      if (!user) {
        setHistory([]);
        setLoading(false);
        return () => {
          isMounted = false;
        };
      }

      setLoading(true);
      getWatchHistory().then((items) => {
        if (isMounted) {
          setHistory(items);
          setLoading(false);
        }
      });

      return () => {
        isMounted = false;
      };
    }, [user])
  );

  const handleClearAll = () => {
    haptic.medium();
    Alert.alert(
      "Xóa lịch sử xem",
      "Bạn có chắc muốn xóa toàn bộ lịch sử xem phim trên tài khoản này không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa hết",
          style: "destructive",
          onPress: async () => {
            haptic.heavy();
            await clearWatchHistory();
            setHistory([]);
            // Background sync cloud
            syncDataWithServer();
          },
        },
      ]
    );
  };

  const handleDeleteItem = (item: HistoryItem) => {
    haptic.medium();
    Alert.alert(
      "Xóa khỏi lịch sử",
      `Bạn có muốn xóa phim "${item.name}" khỏi lịch sử xem của tài khoản không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            haptic.light();
            await removeWatchHistory(item.slug);
            setHistory((prev) => prev.filter((h) => h.slug !== item.slug));
            // Background sync cloud
            syncDataWithServer();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <NativeHeader />

      {/* Header Title with Clear Action */}
      <View style={styles.headerTitleRow}>
        <View style={styles.headerTopLine}>
          <View style={styles.titleRow}>
            <Clock size={20} color={Colors.primary} strokeWidth={2.4} />
            <Text style={styles.title}>Lịch Sử Xem</Text>
          </View>
          {user && history.length > 0 && (
            <Pressable
              onPress={handleClearAll}
              style={({ pressed }) => [styles.clearBtn, pressed && styles.btnPressed]}
            >
              <Trash2 size={13} color={Colors.danger} />
              <Text style={styles.clearText}>Xóa hết</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.sub}>
          {user
            ? history.length > 0
              ? `Tài khoản: ${user.name || user.email} • ${history.length} bộ phim đã xem`
              : "Danh sách phim đã xem lưu trữ trên tài khoản của bạn"
            : "Chỉ thành viên đăng nhập mới có thể lưu & xem lại lịch sử"}
        </Text>
      </View>

      {/* State 1: Auth Loading */}
      {authLoading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.emptySub, { marginTop: 12 }]}>Đang kiểm tra tài khoản...</Text>
        </View>
      ) : !user ? (
        /* State 2: Not Logged In (Requires Account) */
        <View style={styles.emptyContainer}>
          <View style={styles.loginRequiredIconCircle}>
            <Clock size={34} color={Colors.primary} strokeWidth={2.2} />
            <View style={styles.lockBadge}>
              <Lock size={12} color="#050807" strokeWidth={2.8} />
            </View>
          </View>

          <Text style={styles.emptyTitle}>Yêu Cầu Đăng Nhập</Text>
          <Text style={styles.emptySub}>
            Lịch sử xem phim được lưu trữ và đồng bộ an toàn theo tài khoản của bạn. Vui lòng đăng nhập để tiếp tục theo dõi các tập phim đang xem dở dang.
          </Text>

          <Pressable
            onPress={() => {
              haptic.medium();
              openAuthModal("login");
            }}
            style={({ pressed }) => [styles.primaryLoginBtn, pressed && styles.btnPressed]}
          >
            <LogIn size={16} color="#050807" strokeWidth={2.6} />
            <Text style={styles.primaryLoginBtnText}>Đăng Nhập / Đăng Ký Ngay</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              haptic.light();
              router.push("/(tabs)");
            }}
            style={({ pressed }) => [styles.secondaryBrowseBtn, pressed && styles.btnPressed]}
          >
            <Film size={15} color="rgba(255, 255, 255, 0.7)" />
            <Text style={styles.secondaryBrowseBtnText}>Khám phá phim trang chủ</Text>
          </Pressable>
        </View>
      ) : history.length === 0 && !loading ? (
        /* State 3: Logged In but Empty */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Clock size={36} color={Colors.textDim} strokeWidth={1.8} />
          </View>
          <Text style={styles.emptyTitle}>Chưa có lịch sử xem</Text>
          <Text style={styles.emptySub}>
            Khi bạn xem bất kỳ tập phim nào, hệ thống sẽ tự động lưu lại vào tài khoản để bạn có thể xem lại dễ dàng bất cứ lúc nào.
          </Text>
          <Pressable
            onPress={() => {
              haptic.medium();
              router.push("/(tabs)");
            }}
            style={({ pressed }) => [styles.browseBtn, pressed && styles.btnPressed]}
          >
            <Sparkles size={16} color="#050807" strokeWidth={2.4} />
            <Text style={styles.browseBtnText}>Khám phá phim ngay</Text>
          </Pressable>
        </View>
      ) : (
        /* State 4: Logged In with History Grid */
        <FlatList
          key={String(numColumns)}
          data={history}
          numColumns={numColumns}
          keyExtractor={(item) => item.slug}
          renderItem={({ item }) => {
            const movieData = item.lastEpisodeName
              ? { ...item, episode_current: item.lastEpisodeName }
              : item;
            return (
              <MovieCard
                movie={movieData}
                width={cardWidth}
                onLongPress={() => handleDeleteItem(item)}
              />
            );
          }}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
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
    paddingBottom: 8,
  },
  headerTopLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleRow: {
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
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.sm,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
  },
  clearText: {
    color: Colors.danger,
    fontSize: 11.5,
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 115,
    paddingTop: 8,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 70,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  loginRequiredIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(32, 214, 107, 0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(32, 214, 107, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    position: "relative",
  },
  lockBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#050807",
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySub: {
    color: Colors.textDim,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 22,
  },
  primaryLoginBtn: {
    backgroundColor: Colors.primary,
    width: "100%",
    maxWidth: 290,
    height: 44,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryLoginBtnText: {
    color: "#050807",
    fontWeight: "900",
    fontSize: 13.5,
  },
  secondaryBrowseBtn: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  secondaryBrowseBtnText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12.5,
    fontWeight: "600",
  },
  browseBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    height: 42,
    borderRadius: Radii.full,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  browseBtnText: {
    color: "#050807",
    fontWeight: "900",
    fontSize: 13,
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});
