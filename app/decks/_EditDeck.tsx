import * as LucideIcons from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import db from "../../utils/database";
import { useSoundManager } from "../../hooks/useSoundManager";

// Helper to reliably map icon names
const getLucideIcon = (iconName: string | undefined, Fallback: any) => {
  if (!iconName) return Fallback;
  const pascal = iconName.replace(/(^\w|-\w)/g, (clear) =>
    clear.replace(/-/, "").toUpperCase(),
  );
  return (
    (LucideIcons as any)[iconName] || (LucideIcons as any)[pascal] || Fallback
  );
};

interface EditDeckModalProps {
  deck: any | null;
  onClose: () => void;
  onDecksUpdated: () => Promise<void>;
}

export default function EditDeckModal({
  deck,
  onClose,
  onDecksUpdated,
}: EditDeckModalProps) {
  const [cards, setCards] = useState<any[]>([]);
  const [newWord, setNewWord] = useState("");

  const { playSound } = useSoundManager(["download", "bin"]);

  useEffect(() => {
    if (deck) loadCards();
    else setCards([]);
  }, [deck]);

  const loadCards = async () => {
    if (!db || !deck) return;
    try {
      const result = await db.getAllAsync(
        "SELECT * FROM cards WHERE deck_id = ? ORDER BY id DESC;",
        [deck.id],
      );
      setCards(result as any[]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCard = async () => {
    playSound("download");
    if (!newWord.trim().toUpperCase() || !deck || !db) return;
    try {
      await db.runAsync(
        "INSERT INTO cards (deck_id, word, taboo_words, chardes_hint, password_hint) VALUES (?, ?, ?, ?, ?);",
        [deck.id, newWord.trim().toUpperCase(), JSON.stringify([]), "", ""],
      );
      await db.runAsync(
        "UPDATE decks SET card_count = card_count + 1 WHERE id = ?;",
        [deck.id],
      );
      setNewWord("");
      await loadCards();
      await onDecksUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    playSound("bin");
    if (!db || !deck) return;
    try {
      await db.runAsync("DELETE FROM cards WHERE id = ?;", [cardId]);
      await db.runAsync(
        "UPDATE decks SET card_count = MAX(0, card_count - 1) WHERE id = ?;",
        [deck.id],
      );
      await loadCards();
      await onDecksUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClose = () => {
    setNewWord("");
    onClose();
  };

  const deckColor = deck?.color || "#3B82F6";
  const DeckIcon = getLucideIcon(deck?.icon, LucideIcons.Layers);

  return (
    <Modal visible={deck !== null} animationType="slide" transparent>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.sheet} edges={["bottom"]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.sectionLabelRow}>
              <LucideIcons.Pencil size={11} color="#94a3b8" strokeWidth={2.5} />
              <Text style={styles.sectionLabel}>Editing Deck</Text>
            </View>
            <View style={styles.headerBottom}>
              {/* Deck identity */}
              <View
                style={[
                  styles.deckIconSmall,
                  {
                    backgroundColor: `${deckColor}22`,
                    borderColor: `${deckColor}44`,
                  },
                ]}
              >
                <DeckIcon color={deckColor} size={18} strokeWidth={2} />
              </View>
              <Text style={styles.deckName}>{deck?.name}</Text>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <LucideIcons.X color="#cbd5e1" size={18} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Add card input */}
          <View style={styles.inputRow}>
            <TextInput
              placeholder="Type a new word to add..."
              placeholderTextColor="#64748b"
              value={newWord}
              onChangeText={setNewWord}
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={handleAddCard}
            />
            <TouchableOpacity
              onPress={handleAddCard}
              disabled={!newWord.trim()}
              style={[styles.addBtn, !newWord.trim() && styles.addBtnDisabled]}
              activeOpacity={0.75}
            >
              <LucideIcons.Plus size={16} color="#10b981" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Card count */}
          <View style={styles.countRow}>
            <LucideIcons.LayoutList
              size={11}
              color="#94a3b8"
              strokeWidth={2.5}
            />
            <Text style={styles.countText}>
              {cards.length} {cards.length === 1 ? "card" : "cards"} in this
              deck
            </Text>
          </View>

          {/* Card list */}
          <ScrollView
            style={styles.cardList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {cards.length === 0 && (
              <View style={styles.emptyState}>
                <LucideIcons.PackageOpen
                  color="#64748b"
                  size={32}
                  strokeWidth={1.5}
                />
                <Text style={styles.emptyText}>
                  No cards yet — add one above
                </Text>
              </View>
            )}
            {cards.map((card) => (
              <View key={card.id} style={styles.cardRow}>
                <View
                  style={[styles.cardBullet, { backgroundColor: deckColor }]}
                />
                <Text style={styles.cardWord} numberOfLines={1}>
                  {card.word}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDeleteCard(card.id)}
                  style={styles.deleteBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.7}
                >
                  <LucideIcons.X color="#f87171" size={14} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
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
    height: "82%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignSelf: "center",
    marginBottom: 20,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    marginBottom: 4,
  },
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
  headerBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  deckIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  deckName: {
    flex: 1,
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
    marginVertical: 16,
  },

  // ── Input ─────────────────────────────────────────────────────────────────
  inputRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    paddingHorizontal: 14,
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(16,185,129,0.12)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnDisabled: {
    opacity: 0.5,
  },

  // ── Count row ─────────────────────────────────────────────────────────────
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  countText: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },

  // ── Card list ─────────────────────────────────────────────────────────────
  cardList: {
    flex: 1,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    marginBottom: 6,
  },
  cardBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.7,
    flexShrink: 0,
  },
  cardWord: {
    flex: 1,
    color: "#f1f5f9",
    fontSize: 14,
    fontWeight: "700",
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Empty ─────────────────────────────────────────────────────────────────
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "600",
  },
});
