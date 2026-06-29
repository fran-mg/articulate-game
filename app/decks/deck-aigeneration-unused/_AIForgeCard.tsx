import * as LucideIcons from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { styles } from "../Decks.styles";
import { styles as stylesA } from "./AiDecks.styles";

interface Props {
  prompt: string;
  isGenerating: boolean;
  onChangePrompt: (text: string) => void;
  onGenerate: () => void;
}

export default function AIForgeCard({
  prompt,
  isGenerating,
  onChangePrompt,
  onGenerate,
}: Props) {
  const isDisabled = isGenerating || !prompt.trim();

  return (
    <View style={styles.deckCard}>
      <View style={styles.cardShine} pointerEvents="none" />

      <View style={styles.sectionLabelRow}>
        <LucideIcons.Sparkles size={11} color="#a78bfa" strokeWidth={2.5} />
        <Text style={[styles.sectionLabel, { color: "#a78bfa" }]}>
          AI Deck Forge
        </Text>
      </View>

      <Text style={stylesA.aiSubtitle}>
        Describe a theme and AI will generate a full card pack for you.
      </Text>

      <View style={stylesA.aiInputRow}>
        <TextInput
          placeholder="e.g. 90s Cartoons, Space Exploration..."
          placeholderTextColor="#64748b"
          value={prompt}
          onChangeText={onChangePrompt}
          style={stylesA.aiInput}
          returnKeyType="done"
          onSubmitEditing={onGenerate}
        />
        <TouchableOpacity
          onPress={onGenerate}
          disabled={isDisabled}
          activeOpacity={0.75}
          style={[stylesA.aiForgeBtn, isDisabled && stylesA.aiForgeBtnDisabled]}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color="#a78bfa" />
          ) : (
            <LucideIcons.Zap size={16} color="#a78bfa" strokeWidth={2.5} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
