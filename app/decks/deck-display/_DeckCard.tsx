import * as LucideIcons from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Deck } from "../../../stores/useDeckStore";
import { useSoundManager } from "../../../hooks/useSoundManager";
import { styles } from "../Decks.styles";

// Known icon name remaps — handles renamed or swapped Lucide icons
const ICON_REMAPS: Record<string, string> = {
  DownloadCloud: "CloudDownload",
  UploadCloud: "CloudUpload",
};

const getLucideIcon = (iconName: string | undefined, Fallback: any) => {
  if (!iconName) return Fallback;

  // Apply known remaps first
  const remapped = ICON_REMAPS[iconName] ?? iconName;

  // Try direct lookup (handles PascalCase like "Layers", "CloudDownload")
  if ((LucideIcons as any)[remapped]) {
    return (LucideIcons as any)[remapped];
  }

  // Convert kebab-case to PascalCase (e.g., "download-cloud" → "DownloadCloud")
  const pascal = remapped
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");

  return (LucideIcons as any)[pascal] || Fallback;
};

interface Props {
  deck: Deck;
  onEdit: (deck: Deck) => void;
  onDelete: (deckId: string) => void;
}

export default function DeckCard({ deck, onEdit, onDelete }: Props) {
  const DeckIcon = getLucideIcon(deck.icon, LucideIcons.Layers);
  const deckColor = deck.color || "#6366f1";

  const { playSound } = useSoundManager(["bin"]);

  const handleDelete = (deckId: string) => {
    playSound("bin");
    onDelete(deckId);
  };

  return (
    <View style={styles.deckCard}>
      <View style={styles.cardShine} pointerEvents="none" />

      <View style={styles.deckCardInner}>
        {/* Icon */}
        <View
          style={[
            styles.deckIcon,
            {
              backgroundColor: `${deckColor}22`,
              borderColor: `${deckColor}44`,
            },
          ]}
        >
          <DeckIcon color={deckColor} size={22} strokeWidth={2} />
        </View>

        {/* Info */}
        <View style={styles.deckInfo}>
          <Text style={styles.deckName}>{deck.name}</Text>
          <View style={styles.deckMetaRow}>
            <Text style={styles.deckCategory}>{deck.category}</Text>
            <View style={styles.deckMetaDot} />
            <Text style={styles.deckCardCount}>{deck.cardCount} cards</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.deckActions}>
          <TouchableOpacity
            onPress={() => onEdit(deck)}
            style={styles.deckActionBtn}
            activeOpacity={0.7}
          >
            <LucideIcons.Pencil color="#cbd5e1" size={15} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(deck.id)}
            style={[styles.deckActionBtn, styles.deckActionBtnDelete]}
            activeOpacity={0.7}
          >
            <LucideIcons.Trash2 color="#fca5a5" size={15} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Colour accent strip */}
      <View style={[styles.deckColorStrip, { backgroundColor: deckColor }]} />
    </View>
  );
}
