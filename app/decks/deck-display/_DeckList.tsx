import * as LucideIcons from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";
import { Deck } from "../../../stores/useDeckStore";
import DeckCard from "./_DeckCard";
import EmptyState from "./_EmptyState";
import { styles } from "../Decks.styles";

interface Props {
  decks: Deck[];
  onEdit: (deck: Deck) => void;
  onDelete: (deckId: string) => void;
}

export default function DeckList({ decks, onEdit, onDelete }: Props) {
  return (
    <>
      {/* Section label */}
      <View style={styles.sectionLabelRow}>
        <LucideIcons.Layers size={11} color="#94a3b8" strokeWidth={2.5} />
        <Text style={styles.sectionLabel}>
          {decks.length} {decks.length === 1 ? "pack" : "packs"} available
        </Text>
      </View>

      {decks.length === 0 ? (
        <EmptyState />
      ) : (
        decks.map((deck) => (
          <DeckCard
            key={deck.id}
            deck={deck}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
    </>
  );
}
