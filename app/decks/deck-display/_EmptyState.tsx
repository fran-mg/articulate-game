import * as LucideIcons from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";
import { styles } from "../Decks.styles";

export default function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <LucideIcons.PackageOpen color="#64748b" size={40} strokeWidth={1.5} />
      <Text style={styles.emptyStateText}>No packs in this category</Text>
    </View>
  );
}
