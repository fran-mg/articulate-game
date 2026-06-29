import * as LucideIcons from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { styles as stylesC } from "./CreateDeck.styles";
import { styles } from "../../Decks.styles";

interface Props {
  onPress: () => void;
}

export default function CreateDeckCard({ onPress }: Props) {
  return (
    <TouchableOpacity
      style={stylesC.createCard}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.cardShine} pointerEvents="none" />
      <View style={stylesC.createCardIconWrap}>
        <LucideIcons.Plus size={24} color="#10b981" strokeWidth={2.5} />
      </View>
      <View style={stylesC.createCardTextWrap}>
        <Text style={stylesC.createCardTitle}>Create Custom Pack</Text>
        <Text style={stylesC.createCardDesc}>
          Build your own deck of words from scratch
        </Text>
      </View>
    </TouchableOpacity>
  );
}
