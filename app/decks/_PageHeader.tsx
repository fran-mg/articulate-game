import { useRouter } from "expo-router";
import * as LucideIcons from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { styles } from "./Decks.styles";

interface Props {
  onCloudPress: () => void;
}

export default function PageHeader({ onCloudPress }: Props) {
  const router = useRouter();

  return (
    <View style={styles.pageHeader}>
      <TouchableOpacity
        onPress={() => router.navigate("/")}
        style={styles.iconBtn}
        activeOpacity={0.7}
      >
        <LucideIcons.ChevronLeft color="#cbd5e1" size={20} strokeWidth={2.5} />
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <Text style={styles.pageEyebrow}>Library</Text>
        <Text style={styles.pageTitle}>Card Decks</Text>
      </View>

      <TouchableOpacity
        onPress={onCloudPress}
        style={styles.downloadButton}
        activeOpacity={0.8}
      >
        <View style={styles.downloadGlow} />
        <LucideIcons.CloudDownload
          color="#a5b4fc"
          size={18}
          strokeWidth={2.5}
        />
        <View style={styles.downloadTextBlock}>
          <Text style={styles.downloadLabel}>Browse & Download</Text>
          <Text style={styles.downloadSublabel}>Community Packs</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
