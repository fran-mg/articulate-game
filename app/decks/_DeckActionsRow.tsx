import * as LucideIcons from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { styles } from "./Decks.styles";

interface Props {
  onCreatePress: () => void;
  onDownloadPress: () => void;
}

export default function DeckActionsRow({
  onCreatePress,
  onDownloadPress,
}: Props) {
  return (
    <View style={styles.actionRow}>
      {/* Create Custom Pack Button */}
      <TouchableOpacity
        style={[styles.actionBtn, styles.actionBtnCreate]}
        onPress={onCreatePress}
        activeOpacity={0.75}
      >
        <View style={styles.actionBtnIconWrapCreate}>
          <LucideIcons.Plus size={18} color="#10b981" strokeWidth={2.5} />
        </View>
        <View style={styles.actionBtnTextWrap}>
          <Text style={styles.actionBtnTitleCreate} numberOfLines={1}>
            Create Pack
          </Text>
          <Text style={styles.actionBtnDesc} numberOfLines={1}>
            Build your own
          </Text>
        </View>
      </TouchableOpacity>

      {/* Download Community Packs Button */}
      <TouchableOpacity
        style={[styles.actionBtn, styles.actionBtnDownload]}
        onPress={onDownloadPress}
        activeOpacity={0.75}
      >
        <View style={styles.actionBtnIconWrapDownload}>
          <LucideIcons.CloudDownload
            size={18}
            color="#818cf8"
            strokeWidth={2.0}
          />
        </View>
        <View style={styles.actionBtnTextWrap}>
          <Text style={styles.actionBtnTitleDownload}>Browse & Download</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
