import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/constants/theme";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showSlogan?: boolean;
}

export function BrandLogo({ size = "md", showSlogan = true }: BrandLogoProps) {
  const isSm = size === "sm";
  const isLg = size === "lg";

  const fontSize = isSm ? 15 : isLg ? 24 : 18;
  const sloganSize = isSm ? 8 : isLg ? 11 : 9.5;

  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        {/* Play Icon Badge */}
        <View style={[styles.iconBadge, { width: fontSize + 6, height: fontSize + 6 }]}>
          <Text style={{ fontSize: fontSize * 0.55, color: Colors.primary, fontWeight: "900" }}>▶</Text>
        </View>

        {/* Wordmark */}
        <Text style={[styles.title, { fontSize }]}>
          <Text style={styles.titleHi}>HI </Text>
          <Text style={styles.titlePhim}>PHIM</Text>
          <Text style={styles.titleDot}>.</Text>
        </Text>
      </View>

      {showSlogan && (
        <Text style={[styles.slogan, { fontSize: sloganSize }]}>
          Điện ảnh không giới hạn
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconBadge: {
    borderRadius: 999,
    backgroundColor: "rgba(32, 214, 107, 0.15)",
    borderWidth: 1.5,
    borderColor: "rgba(32, 214, 107, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  titleHi: {
    color: "#FFFFFF",
  },
  titlePhim: {
    color: Colors.primary,
  },
  titleDot: {
    color: Colors.primaryHover,
  },
  slogan: {
    color: Colors.textDim,
    fontWeight: "500",
    marginTop: 1,
    letterSpacing: 0.2,
  },
});
