import * as LucideIcons from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { styles } from "./DeckEdit.styles";
import { styles as stylesA } from "../DeckActions.styles";

interface EditTabooWordsProps {
  card: any;
  onSave: (id: number, word: string, tabooString: string) => Promise<void>;
  onClose: () => void;
}

export default function EditTabooWords({
  card,
  onSave,
  onClose,
}: EditTabooWordsProps) {
  const [editWord, setEditWord] = useState(card.word);
  // Store exactly 5 slots in state
  const [tabooWords, setTabooWords] = useState<string[]>(["", "", "", "", ""]);

  useEffect(() => {
    let parsed: string[] = [];
    try {
      parsed = card.tabooWords ? JSON.parse(card.tabooWords) : [];
    } catch {
      parsed = [];
    }

    // Map existing words into the 5 slots, filling the rest with empty strings
    const initialSlots = Array.from({ length: 5 }).map(
      (_, i) => parsed[i] || "",
    );
    setTabooWords(initialSlots);
  }, [card]);

  const updateTabooSlot = (text: string, index: number) => {
    const newTaboos = [...tabooWords];
    newTaboos[index] = text;
    setTabooWords(newTaboos);
  };

  const handleSave = () => {
    // 1. Trim whitespace from all slots
    // 2. Drop any slots that are completely empty
    const cleanTaboos = tabooWords
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    onSave(card.id, editWord.trim().toUpperCase(), JSON.stringify(cleanTaboos));
  };

  return (
    <>
      <View style={styles.header}>
        <View style={styles.sectionLabelRow}>
          <LucideIcons.Settings2 size={11} color="#94a3b8" strokeWidth={2.5} />
          <Text style={styles.sectionLabel}>Card Details</Text>
        </View>
        <View style={styles.headerBottom}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            activeOpacity={0.7}
          >
            <LucideIcons.ChevronLeft
              color="#cbd5e1"
              size={18}
              strokeWidth={2.5}
            />
          </TouchableOpacity>
          <Text style={styles.deckName} numberOfLines={1}>
            Edit Card
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <ScrollView
        style={styles.cardList}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={stylesA.formLabel}>Target Word</Text>
        <TextInput
          style={stylesA.formInput}
          value={editWord}
          onChangeText={setEditWord}
          placeholder="The word to guess"
          placeholderTextColor="#475569"
          maxLength={35} // Restriction 1
        />

        <Text style={[stylesA.formLabel, { marginTop: 20 }]}>
          Forbidden Words (Optional)
        </Text>
        <Text style={styles.formHelper}>
          Words the describer is not allowed to say.
        </Text>

        {/* Render exactly 5 slots */}
        <View style={styles.tabooSlotsContainer}>
          {tabooWords.map((word, index) => (
            <View key={index} style={styles.tabooSlotRow}>
              <View style={styles.tabooSlotNumberWrap}>
                <Text style={styles.tabooSlotNumber}>{index + 1}</Text>
              </View>
              <TextInput
                style={styles.tabooSlotInput}
                value={word}
                onChangeText={(text) => updateTabooSlot(text, index)}
                placeholder={`Optional taboo word`}
                placeholderTextColor="#334155"
                maxLength={20} // Restriction 2
                returnKeyType="next"
              />
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[stylesA.saveBtn, !editWord.trim() && stylesA.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!editWord.trim()}
          activeOpacity={0.8}
        >
          <LucideIcons.Check size={18} color="#fff" strokeWidth={2.5} />
          <Text style={stylesA.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}
