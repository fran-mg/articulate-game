import { useRouter } from "expo-router";
import * as LucideIcons from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { styles } from "./Decks.styles";

export default function PageHeader() {
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
    </View>
  );
}
