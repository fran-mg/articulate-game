import * as LucideIcons from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { orchestrateCommunityDeckGeneration } from "../../../../utils/githubSync";
import { useSoundManager } from "../../../../hooks/useSoundManager";
import { useAppAlert } from "../../../_AppAlert";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function GenerateDeckModal({
  visible,
  onClose,
  onSuccess,
}: Props) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const { playSound } = useSoundManager(["download", "click"]);
  const { showAlert, AlertRender } = useAppAlert();

  const handleGenerate = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setIsGenerating(true);
    const result = await orchestrateCommunityDeckGeneration(trimmed);
    setIsGenerating(false);

    if (result.success) {
      playSound("download");
      setPrompt("");
      onSuccess();
      showAlert("Pack Published!", result.message as string);
    } else {
      showAlert("Generation Failed", result.error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>AI Forge</Text>
            <Text style={styles.title}>Generate Pack</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            activeOpacity={0.7}
          >
            <LucideIcons.X color="#cbd5e1" size={20} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.infoBox}>
            <LucideIcons.Globe2
              color="#a78bfa"
              size={24}
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>
              Packs generated here are{" "}
              <Text style={styles.boldText}>
                published to the Community Cloud
              </Text>{" "}
              for everyone to download and enjoy!
            </Text>
          </View>

          <Text style={styles.label}>What is the theme?</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 90s Cartoons, Space Exploration, Italian Cuisine..."
            placeholderTextColor="#475569"
            value={prompt}
            onChangeText={setPrompt}
            editable={!isGenerating}
            returnKeyType="send"
            onSubmitEditing={handleGenerate}
            multiline
          />

          <TouchableOpacity
            style={[
              styles.generateBtn,
              (!prompt.trim() || isGenerating) && styles.disabledBtn,
            ]}
            onPress={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            activeOpacity={0.8}
          >
            {isGenerating ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.btnText}>Creating & Syncing...</Text>
              </View>
            ) : (
              <View style={styles.loadingRow}>
                <LucideIcons.Sparkles
                  size={20}
                  color="#fff"
                  strokeWidth={2.5}
                />
                <Text style={styles.btnText}>Generate & Publish</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
        {AlertRender}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#020617" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
  },
  eyebrow: {
    color: "#a78bfa",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  title: {
    color: "#f1f5f9",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginHorizontal: 20,
    marginBottom: 20,
  },
  content: { paddingHorizontal: 20, gap: 16 },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "rgba(167,139,250,0.1)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 14,
    marginBottom: 8,
  },
  infoIcon: { flexShrink: 0 },
  infoText: {
    flex: 1,
    color: "#d8b4fe",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  boldText: { fontWeight: "800", color: "#f3e8ff" },
  label: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    minHeight: 120,
    textAlignVertical: "top",
  },
  generateBtn: {
    backgroundColor: "#8b5cf6",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  disabledBtn: { opacity: 0.5 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  btnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
