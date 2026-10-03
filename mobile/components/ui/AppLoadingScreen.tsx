import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Easing,
  Platform,
} from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { BrandLogo } from "./BrandLogo";

interface AppLoadingScreenProps {
  onFinish?: () => void;
  minDuration?: number;
}

export function AppLoadingScreen({
  onFinish,
  minDuration = 700,
}: AppLoadingScreenProps) {
  const [visible, setVisible] = useState(true);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Hide native splash screen immediately when this component mounts
    SplashScreen.hideAsync().catch(() => {});

    // Fast, smooth transition to main app
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.04,
          duration: 350,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setVisible(false);
        if (onFinish) onFinish();
      });
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration, onFinish, fadeAnim, scaleAnim]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
      pointerEvents={visible ? "auto" : "none"}
    >
      {/* Centered Brand & Minimalist Cinema Loader */}
      <View style={styles.centerBox}>
        <BrandLogo size="lg" />

        <View style={styles.loaderRow}>
          <ActivityIndicator size="small" color="#20D66B" />
          <Text style={styles.loadingText}>Đang tải ứng dụng...</Text>
        </View>
      </View>

      {/* Subtle bottom tagline */}
      <View style={styles.bottomBox}>
        <Text style={styles.tagline}>TRẢI NGHIỆM ĐIỆN ẢNH ĐỈNH CAO</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 99999,
    backgroundColor: "#050807",
    alignItems: "center",
    justifyContent: "center",
  },
  centerBox: {
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  loaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  loadingText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12.5,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  bottomBox: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 48 : 32,
    alignItems: "center",
    width: "100%",
  },
  tagline: {
    color: "rgba(255, 255, 255, 0.28)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});
