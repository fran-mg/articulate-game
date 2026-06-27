import { StyleSheet } from "react-native";

export default function DummyRoute() {
  return null;
}

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#020617",
  },

  // ── Page Header ──────────────────────────────────────────────────────────
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  pageEyebrow: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },
  pageTitle: {
    color: "#f1f5f9",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#1a204d",
    borderWidth: 1.5,
    borderColor: "rgba(99,102,241,0.4)",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    overflow: "hidden",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  downloadGlow: {
    position: "absolute",
    top: -10,
    right: -10,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(99,102,241,0.2)",
  },
  downloadTextBlock: {
    gap: 1,
  },
  downloadLabel: {
    color: "#e0e7ff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  downloadSublabel: {
    color: "#a5b4fc",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  // ── Scroll ───────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 48,
    gap: 10,
  },

  // ── Shared card ──────────────────────────────────────────────────────────
  card: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    borderRadius: 24,
    padding: 20,
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

  // ── Section label ────────────────────────────────────────────────────────
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  sectionLabel: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
  },

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

  // ── Category filter ───────────────────────────────────────────────────────
  categoryBar: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipActive: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderColor: "rgba(255,255,255,0.18)",
  },
  categoryChipInactive: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.12)",
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
    letterSpacing: 0.3,
  },

  // ── Deck cards ────────────────────────────────────────────────────────────
  deckCard: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    overflow: "hidden",
  },
  deckCardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  deckIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  deckInfo: {
    flex: 1,
  },
  deckName: {
    color: "#f1f5f9",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.2,
    marginBottom: 5,
  },
  deckMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  deckCategory: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  deckMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#64748b",
  },
  deckCardCount: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "600",
  },
  deckActions: {
    flexDirection: "row",
    gap: 8,
  },
  deckActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  deckActionBtnDelete: {
    backgroundColor: "rgba(239,68,68,0.1)",
    borderColor: "rgba(239,68,68,0.25)",
  },
  deckColorStrip: {
    height: 2,
    opacity: 0.6,
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 56,
    gap: 14,
  },
  emptyStateText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  // ── Create Deck Card (Top of list) ───────────────────────────────────────
  createCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16,185,129,0.08)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.25)",
    borderRadius: 20,
    padding: 16,
    gap: 14,
    overflow: "hidden",
    marginBottom: 6,
  },
  createCardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(16,185,129,0.15)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  createCardTextWrap: {
    flex: 1,
  },
  createCardTitle: {
    color: "#10b981",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  createCardDesc: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "500",
  },

  // ── Create Modal Forms ───────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginHorizontal: 20,
    marginBottom: 8,
  },
  formContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
    gap: 6,
  },
  formLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 20,
  },
  formInput: {
    height: 52,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    paddingHorizontal: 16,
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  formInputMultiline: {
    height: 80,
    paddingTop: 16,
    textAlignVertical: "top",
  },
  colorRow: {
    gap: 12,
    paddingVertical: 4,
  },
  colorCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 3,
    borderColor: "transparent",
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  iconSelectBtn: {
    width: 54,
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconSelectBtnActive: {
    borderColor: "rgba(99,102,241,0.5)",
    backgroundColor: "rgba(99,102,241,0.15)",
  },
  saveBtn: {
    flexDirection: "row",
    backgroundColor: "#6366f1",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 36,
    gap: 10,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  saveBtnDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
