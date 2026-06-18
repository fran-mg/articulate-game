import * as LucideIcons from "lucide-react-native";
import React, { useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useDeckStore } from "../../../stores/useDeckStore";
import { ModeAccent } from "../../../utils/_modeTheme";

interface DeckSelectorProps {
  isDecksExpanded: boolean;
  setIsDecksExpanded: (val: boolean) => void;
  accent: ModeAccent;
  autoSelectAllOnMount?: boolean; // Tell it when to select all vs preserve state
}

export default function DeckSelector({
  isDecksExpanded,
  setIsDecksExpanded,
  accent,
  autoSelectAllOnMount = false,
}: DeckSelectorProps) {
  // Move all the store logic inside the component!
  const {
    decks,
    selectedDeckIds,
    toggleDeckSelection,
    loadDecks,
    selectAllDecks,
  } = useDeckStore();

  useEffect(() => {
    const init = async () => {
      await loadDecks();
      if (autoSelectAllOnMount) {
        selectAllDecks();
      }
    };
    init();
  }, [autoSelectAllOnMount]);

  const totalDecks = decks.length;
  const selectedCount = selectedDeckIds.length;

  const allSelected = totalDecks > 0 && selectedCount === totalDecks;
  const noneSelected = totalDecks > 0 && selectedCount === 0;
  const someSelected = totalDecks > 0 && !allSelected && !noneSelected;

  const handleBulkToggle = () => {
    if (totalDecks === 0) return;
    if (allSelected) {
      selectedDeckIds.forEach((id) => toggleDeckSelection(id));
    } else {
      decks.forEach((deck) => {
        if (!selectedDeckIds.includes(deck.id)) {
          toggleDeckSelection(deck.id);
        }
      });
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardShine} pointerEvents="none" />

      {/* ── Header ── */}
      <TouchableOpacity
        onPress={() => setIsDecksExpanded(!isDecksExpanded)}
        style={styles.header}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={styles.sectionLabelRow}>
            <LucideIcons.Layers size={11} color="#64748b" strokeWidth={2.5} />
            <Text style={styles.sectionLabel}>Decks in Play</Text>
          </View>
          <View style={styles.headerSubRow}>
            <Text style={[styles.headerCount, { color: accent.colorMuted }]}>
              {selectedCount}
            </Text>
            <Text style={styles.headerCountLabel}>
              {selectedCount === 1 ? "deck" : "decks"} active
            </Text>

            {totalDecks > 0 && (
              <TouchableOpacity
                activeOpacity={0.65}
                onPress={handleBulkToggle}
                hitSlop={{ top: 12, bottom: 12, left: 10, right: 10 }}
                style={[
                  styles.statusBadge,
                  allSelected
                    ? {
                        borderColor: accent.colorBorder,
                        backgroundColor: accent.colorBg,
                      }
                    : someSelected
                      ? {
                          borderColor: "rgba(255,255,255,0.25)",
                          backgroundColor: "rgba(255,255,255,0.08)",
                        }
                      : {
                          borderColor: "rgba(255,255,255,0.15)",
                          backgroundColor: "rgba(255,255,255,0.03)",
                        },
                ]}
              >
                {allSelected && (
                  <LucideIcons.CheckCheck
                    size={13}
                    color={accent.colorMuted}
                    strokeWidth={3}
                  />
                )}
                {someSelected && (
                  <LucideIcons.Check
                    size={12}
                    color="#e2e8f0"
                    strokeWidth={3}
                  />
                )}
                <Text
                  style={[
                    styles.statusBadgeText,
                    allSelected
                      ? { color: accent.colorMuted }
                      : someSelected
                        ? { color: "#e2e8f0" }
                        : { color: "#94a3b8" },
                  ]}
                >
                  {allSelected ? "All" : someSelected ? "Some" : "None"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View
          style={[
            styles.chevronWrap,
            isDecksExpanded && {
              backgroundColor: accent.colorBg,
              borderColor: accent.colorBorder,
            },
          ]}
        >
          <LucideIcons.ChevronDown
            color={isDecksExpanded ? accent.colorMuted : "#475569"}
            size={16}
            strokeWidth={2.5}
            style={{
              transform: [{ rotate: isDecksExpanded ? "180deg" : "0deg" }],
            }}
          />
        </View>
      </TouchableOpacity>

      {/* ── Expanded list ── */}
      {isDecksExpanded && (
        <>
          <View style={styles.divider} />

          {decks.length === 0 ? (
            <View style={styles.emptyState}>
              <LucideIcons.PackageOpen
                color="#334155"
                size={32}
                strokeWidth={1.5}
              />
              <Text style={styles.emptyText}>No decks available</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.listScroll}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {decks.map((deck) => {
                const isSelected = selectedDeckIds.includes(deck.id);
                const DeckIcon =
                  (LucideIcons as any)[deck.icon] || LucideIcons.Layers;

                return (
                  <TouchableOpacity
                    key={deck.id}
                    onPress={() => toggleDeckSelection(deck.id)}
                    activeOpacity={0.75}
                    style={[
                      styles.deckRow,
                      isSelected
                        ? {
                            backgroundColor: accent.colorBg,
                            borderColor: accent.colorBorder,
                          }
                        : styles.deckRowInactive,
                    ]}
                  >
                    <View
                      style={[
                        styles.deckIcon,
                        {
                          backgroundColor: accent.colorBg,
                          borderColor: accent.colorBorder,
                        },
                      ]}
                    >
                      <DeckIcon
                        color={accent.color}
                        size={18}
                        strokeWidth={2}
                      />
                    </View>

                    <View style={styles.deckInfo}>
                      <Text
                        style={[
                          styles.deckName,
                          isSelected && { color: accent.colorMuted },
                        ]}
                        numberOfLines={1}
                      >
                        {deck.name}
                      </Text>
                      <Text
                        style={[
                          styles.deckMeta,
                          isSelected && { color: `${accent.colorMuted}99` },
                        ]}
                      >
                        {deck.category}
                        {"  ·  "}
                        {deck.cardCount}{" "}
                        {deck.cardCount === 1 ? "card" : "cards"}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.checkbox,
                        isSelected && {
                          backgroundColor: accent.color,
                          borderColor: accent.color,
                        },
                      ]}
                    >
                      {isSelected && (
                        <LucideIcons.Check
                          size={12}
                          color="#fff"
                          strokeWidth={3}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Outer card — same bg as the list so they read as one block ────────────
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

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    gap: 4,
  },
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionLabel: {
    color: "#475569",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  headerSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerCount: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  headerCountLabel: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    marginLeft: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  chevronWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Divider ───────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginTop: 16,
    marginBottom: 14,
  },

  // ── Scrollable list — no extra wrapper bg so it blends with card ──────────
  listScroll: {
    maxHeight: 280,
  },
  listContent: {
    gap: 6,
  },

  // ── Deck rows ─────────────────────────────────────────────────────────────
  deckRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  deckRowInactive: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: "rgba(255,255,255,0.07)",
  },
  deckIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  deckInfo: {
    flex: 1,
  },
  deckName: {
    color: "#e2e8f0",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.1,
    marginBottom: 3,
  },
  deckMeta: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "600",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  // ── Empty ─────────────────────────────────────────────────────────────────
  emptyState: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 10,
  },
  emptyText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
  },
});
