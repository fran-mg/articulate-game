import * as LucideIcons from "lucide-react-native";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectManual: () => void;
  onSelectAI: () => void;
}

export default function CreateOptionsModal({
  visible,
  onClose,
  onSelectManual,
  onSelectAI,
}: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <SafeAreaView edges={["bottom"]} style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>New Pack</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <LucideIcons.X color="#cbd5e1" size={20} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.optionsContainer}>
            {/* Manual Creation Option */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={onSelectManual}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: "rgba(16,185,129,0.12)",
                    borderColor: "rgba(16,185,129,0.3)",
                  },
                ]}
              >
                <LucideIcons.PenTool
                  size={22}
                  color="#10b981"
                  strokeWidth={2}
                />
              </View>
              <View style={styles.textWrap}>
                <Text style={[styles.optionTitle, { color: "#10b981" }]}>
                  Create from Scratch
                </Text>
                <Text style={styles.optionDesc}>
                  Build your own custom pack manually by adding words yourself.
                </Text>
              </View>
              <LucideIcons.ChevronRight
                size={20}
                color="#475569"
                strokeWidth={2}
              />
            </TouchableOpacity>

            {/* AI Generation Option */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={onSelectAI}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: "rgba(167,139,250,0.12)",
                    borderColor: "rgba(167,139,250,0.3)",
                  },
                ]}
              >
                <LucideIcons.Sparkles
                  size={22}
                  color="#a78bfa"
                  strokeWidth={2}
                />
              </View>
              <View style={styles.textWrap}>
                <Text style={[styles.optionTitle, { color: "#a78bfa" }]}>
                  Generate with AI
                </Text>
                <Text style={styles.optionDesc}>
                  Type a prompt and let AI build a complete pack for you and the
                  community.
                </Text>
              </View>
              <LucideIcons.ChevronRight
                size={20}
                color="#475569"
                strokeWidth={2}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.88)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#0b1120",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(255,255,255,0.09)",
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    color: "#f1f5f9",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  optionDesc: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
});
