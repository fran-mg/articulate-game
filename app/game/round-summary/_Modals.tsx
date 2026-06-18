import { useRouter } from "expo-router";
import * as LucideIcons from "lucide-react-native";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ScoringStyle } from "../../../stores/useGameStore";
import { ModeAccent } from "../../../utils/_modeTheme";
import TargetLimitInput from "../settings/_TargetLimitInput";
import DeckSelector from "../settings/_DeckSelector";
import TimerSelector from "../settings/_TimerSelector";

interface ModalsProps {
  showExitModal: boolean;
  setShowExitModal: (show: boolean) => void;
  showSettingsModal: boolean;
  setShowSettingsModal: (show: boolean) => void;
  editLimit: number | "Infinity";
  setEditLimit: (val: number | "Infinity") => void;
  editTimer: number;
  setEditTimer: (val: number) => void;
  currentRound: number;
  scoringStyle: ScoringStyle;
  accent: ModeAccent;
  handleSaveSettings: () => void;
}

export default function Modals({
  showExitModal,
  setShowExitModal,
  showSettingsModal,
  setShowSettingsModal,
  editLimit,
  setEditLimit,
  editTimer,
  setEditTimer,
  currentRound,
  scoringStyle,
  accent,
  handleSaveSettings,
}: ModalsProps) {
  const router = useRouter();

  const [isDecksExpanded, setIsDecksExpanded] = useState(false);

  return (
    <>
      {/* ── EXIT MODAL ── */}
      <Modal visible={showExitModal} transparent animationType="fade">
        <View style={styles.overlay}>
          {/* ... Unchanged exit card code ... */}
        </View>
      </Modal>

      {/* ── SETTINGS MODAL ── */}
      <Modal visible={showSettingsModal} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <ScrollView
            contentContainerStyle={styles.sheetScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sheet}>
              {/* ... Unchanged Modal Header ... */}

              <View style={styles.card}>
                <View style={styles.cardShine} pointerEvents="none" />
                <View style={[styles.sectionLabelRow, { display: "none" }]}>
                  <LucideIcons.Trophy
                    size={11}
                    color="#64748b"
                    strokeWidth={2.5}
                  />
                  <Text style={styles.sectionLabel}>
                    {scoringStyle === "rounds"
                      ? "Target Rounds"
                      : "Tiles to Finish"}
                  </Text>
                </View>
                <TargetLimitInput
                  scoringStyle={scoringStyle}
                  targetLimit={editLimit}
                  onTargetLimitChange={(val) => {
                    if (scoringStyle === "rounds" && val !== "Infinity") {
                      setEditLimit(Math.max(currentRound, val as number));
                    } else {
                      setEditLimit(val);
                    }
                  }}
                  accent={accent}
                  lockedMinRounds={
                    scoringStyle === "rounds" ? currentRound : undefined
                  }
                />
              </View>

              <DeckSelector
                isDecksExpanded={isDecksExpanded}
                setIsDecksExpanded={setIsDecksExpanded}
                accent={accent}
              />

              <TimerSelector
                timerDuration={editTimer}
                setTimerDuration={setEditTimer}
                accent={accent}
              />

              {/* Actions */}
              <View style={styles.row}>
                <TouchableOpacity
                  onPress={() => setShowSettingsModal(false)}
                  style={[styles.btn, styles.btnCancel]}
                >
                  <Text style={styles.btnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveSettings}
                  style={[styles.btn, styles.btnPrimary]}
                >
                  <LucideIcons.Check size={15} color="#fff" strokeWidth={2.5} />
                  <Text style={styles.btnText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // ── Exit modal ──────────────────────────────────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.82)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  exitCard: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 28,
    padding: 28,
    width: "100%",
    alignItems: "center",
  },
  exitIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  exitTitle: {
    color: "#f1f5f9",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.3,
    marginBottom: 8,
    textAlign: "center",
  },
  exitBody: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },

  // ── Shared buttons ───────────────────────────────────────────────────────────
  row: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 15,
    borderRadius: 16,
  },
  btnCancel: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  btnCancelText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "700",
  },
  btnDanger: {
    backgroundColor: "#dc2626",
  },
  btnPrimary: {
    backgroundColor: "#2563eb",
  },
  btnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },

  // ── Settings sheet ───────────────────────────────────────────────────────────
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  sheetScroll: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#020617",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingVertical: 20,
    paddingHorizontal: 10,
    paddingBottom: 36,
    gap: 0,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingVertical: 0,
    paddingHorizontal: 10,
  },
  sheetEyebrow: {
    color: "#334155",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  sheetTitle: {
    color: "#f1f5f9",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Card wrapper (matches settings page cards) ───────────────────────────────
  card: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
    overflow: "hidden",
  },
  cardShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "35%",
    backgroundColor: "rgba(255,255,255,0.025)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },
  sectionLabel: {
    color: "#475569",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});
