import { StyleSheet } from "react-native";

export default function DummyRoute() {
  return null;
}

export const styles = StyleSheet.create({
  // ── AI Forge ─────────────────────────────────────────────────────────────
  aiSubtitle: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    marginBottom: 14,
  },
  aiInputRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  aiInput: {
    flex: 1,
    height: 48,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    paddingHorizontal: 14,
    color: "#e2e8f0",
    fontSize: 13,
    fontWeight: "600",
  },
  aiForgeBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(167,139,250,0.12)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  aiForgeBtnDisabled: {
    opacity: 0.5,
  },
});
