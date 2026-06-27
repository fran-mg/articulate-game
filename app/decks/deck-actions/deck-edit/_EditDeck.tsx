import * as LucideIcons from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { dbHelpers } from "../../../../utils/database";
import { useSoundManager } from "../../../../hooks/useSoundManager";
import EditTabooWords from "./_EditTabooWords";
import { styles } from "./DeckEdit.styles";

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
  const [editingCard, setEditingCard] = useState<any | null>(null);

  const { playSound } = useSoundManager(["download", "bin", "click"]);

  useEffect(() => {
    if (deck) {
      loadCards();
      setEditingCard(null);
    } else {
      setCards([]);
    }
  }, [deck]);

  const loadCards = async () => {
    if (!deck) return;
    try {
      const fetchedCards = await dbHelpers.getCardsForDeck(Number(deck.id));
      setCards(fetchedCards);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCard = async () => {
    if (!newWord.trim() || !deck) return;
    playSound("download");
    try {
      await dbHelpers.createCard(
        Number(deck.id),
        newWord.trim().toUpperCase(),
        [],
        "",
        "",
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
    try {
      await dbHelpers.deleteCard(cardId);
      await loadCards();
      await onDecksUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const saveEditedCard = async (
    id: number,
    word: string,
    tabooWordsStr: string,
  ) => {
    playSound("download");
    try {
      await dbHelpers.updateCard(id, { word, tabooWords: tabooWordsStr });
      setEditingCard(null);
      await loadCards();
    } catch (err) {
      console.error(err);
    }
  };

  const deckColor = deck?.color || "#3B82F6";
  const DeckIcon = getLucideIcon(deck?.icon, LucideIcons.Layers);

  return (
    <Modal visible={deck !== null} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <SafeAreaView style={styles.sheet} edges={["bottom"]}>
          <View style={styles.handle} />

          {editingCard ? (
            <EditTabooWords
              card={editingCard}
              onClose={() => setEditingCard(null)}
              onSave={saveEditedCard}
            />
          ) : (
            <>
              <View style={styles.header}>
                <View style={styles.sectionLabelRow}>
                  <LucideIcons.Pencil
                    size={11}
                    color="#94a3b8"
                    strokeWidth={2.5}
                  />
                  <Text style={styles.sectionLabel}>Editing Deck</Text>
                </View>
                <View style={styles.headerBottom}>
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
                  <Text style={styles.deckName} numberOfLines={1}>
                    {deck?.name}
                  </Text>
                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.closeBtn}
                    activeOpacity={0.7}
                  >
                    <LucideIcons.X
                      color="#cbd5e1"
                      size={18}
                      strokeWidth={2.5}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.inputRow}>
                <TextInput
                  placeholder="Rapid add a word..."
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
                  style={[
                    styles.addBtn,
                    !newWord.trim() && styles.addBtnDisabled,
                  ]}
                  activeOpacity={0.75}
                >
                  <LucideIcons.Plus
                    size={16}
                    color="#10b981"
                    strokeWidth={2.5}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.countRow}>
                <LucideIcons.LayoutList
                  size={11}
                  color="#94a3b8"
                  strokeWidth={2.5}
                />
                <Text style={styles.countText}>
                  {cards.length} {cards.length === 1 ? "card" : "cards"} • Tap a
                  word to edit
                </Text>
              </View>

              <ScrollView
                style={styles.cardList}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {cards.map((card) => (
                  <TouchableOpacity
                    key={card.id}
                    style={styles.cardRow}
                    activeOpacity={0.6}
                    onPress={() => {
                      playSound("click");
                      setEditingCard(card);
                    }}
                  >
                    <View
                      style={[
                        styles.cardBullet,
                        { backgroundColor: deckColor },
                      ]}
                    />
                    <Text style={styles.cardWord}>{card.word}</Text>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteCard(card.id);
                      }}
                      style={styles.deleteBtn}
                    >
                      <LucideIcons.Trash2
                        color="#f87171"
                        size={14}
                        strokeWidth={2.5}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
                <View style={{ height: 60 }} />
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
