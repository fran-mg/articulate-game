import React from "react";
import { ScrollView, Text, TouchableOpacity } from "react-native";
import { styles } from "../Decks.styles";

interface Props {
  categories: string[];
  activeTab: string;
  onSelect: (category: string) => void;
}

export default function CategoryFilter({
  categories,
  activeTab,
  onSelect,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryBar}
    >
      {categories.map((cat) => {
        const isActive = activeTab === cat;
        return (
          <TouchableOpacity
            key={cat}
            onPress={() => onSelect(cat)}
            activeOpacity={0.75}
            style={[
              styles.categoryChip,
              isActive
                ? styles.categoryChipActive
                : styles.categoryChipInactive,
            ]}
          >
            <Text
              style={[
                styles.categoryChipText,
                { color: isActive ? "#f1f5f9" : "#94a3b8" },
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
