import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSoundManager } from "../../hooks/useSoundManager";
import { getModeTheme } from "../../utils/_modeTheme";

interface ModeCardProps {
  modeKey: string;
  onPress: () => void;
}

export default function ModeCard({ modeKey, onPress }: ModeCardProps) {
  const { accent, meta } = getModeTheme(modeKey);
  const Icon = meta.Icon;

  const { playSound } = useSoundManager(["click"]);

  const handlePress = () => {
    playSound("click");
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handlePress}
      style={[styles.card, { borderLeftColor: accent.color }]}
    >
      <View style={[styles.cardGlow, { backgroundColor: accent.colorBg }]} />

      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: accent.colorBg,
            borderColor: accent.colorBorder,
          },
        ]}
      >
        <Icon size={22} color={accent.color} strokeWidth={2} />
      </View>

      <View style={styles.textBlock}>
        <View style={styles.titleStrip}>
          <Text style={styles.title}>{meta.label}</Text>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: accent.colorBg,
                borderColor: accent.colorBorder,
              },
            ]}
          >
            <Text style={[styles.badgeText, { color: accent.colorMuted }]}>
              {meta.orientationBadge}
            </Text>
          </View>
        </View>
        <Text style={styles.description}>{meta.description}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    borderLeftWidth: 4,
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  cardGlow: {
    position: "absolute",
    right: -24,
    bottom: -24,
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    paddingRight: 48,
  },
  titleStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  title: {
    color: "#f1f5f9",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  description: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
});
