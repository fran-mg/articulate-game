import * as LucideIcons from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { dbHelpers } from "../../../../utils/database";
import { useSoundManager } from "../../../../hooks/useSoundManager";
import { styles } from "../../Decks.styles";

const COLORS = [
  "#6366f1", // Indigo
  "#22C55E", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#f1f5f9", // Slate
];

const ICONS = [
  "Layers",
  "Star",
  "Heart",
  "Zap",
  "Music",
  "Film",
  "Lightbulb",
  "Gamepad2",
  "Cat",
  "Pizza",
  "Globe",
  "Coffee",
];

// Reusing your icon lookup logic
const getLucideIcon = (iconName: string, Fallback: any) => {
  if (!iconName) return Fallback;
  const pascal = iconName.replace(/(^\w|-\w)/g, (clear) =>
    clear.replace(/-/, "").toUpperCase(),
  );
  return (
    (LucideIcons as any)[iconName] || (LucideIcons as any)[pascal] || Fallback
  );
};

interface CreateDeckModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateDeckModal({
  visible,
  onClose,
  onCreated,
}: CreateDeckModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState(ICONS[0]);
  const [isSaving, setIsSaving] = useState(false);

  const { playSound } = useSoundManager(["click", "download"]);

  const isComplete = name.trim().length >= 3;

  const handleSave = async () => {
    if (!isComplete) return;
    setIsSaving(true);
    try {
      // We inject directly into the existing SQLite system as user-created.
      await dbHelpers.createDeck(
        name.trim(),
        category.trim(),
        "user-created", // Automatically puts it in "My Decks" filter
        icon,
        color,
        description.trim(),
      );

      playSound("download");

      // Reset state for next time
      setName("");
      setCategory("");
      setDescription("");
      setColor(COLORS[0]);
      setIcon(ICONS[0]);

      onCreated(); // Triggers UI reload and alerts
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageEyebrow}>Forge</Text>
            <Text style={styles.pageTitle}>New Custom Pack</Text>
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
          style={styles.scroll}
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Text Inputs */}
          <View>
            <Text style={styles.formLabel}>Pack Name *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Office Inside Jokes"
              placeholderTextColor="#475569"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View>
            <Text style={styles.formLabel}>Category</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Friends, Movies, Work"
              placeholderTextColor="#475569"
              value={category}
              onChangeText={setCategory}
            />
          </View>

          <View>
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.formInput, styles.formInputMultiline]}
              placeholder="What is this pack about?"
              placeholderTextColor="#475569"
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          {/* Color Picker */}
          <Text style={styles.formLabel}>Theme Colour</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.colorRow}
          >
            {COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                activeOpacity={0.8}
                onPress={() => setColor(c)}
                style={[
                  styles.colorCircle,
                  { backgroundColor: c },
                  color === c && { borderColor: "rgba(255,255,255,0.8)" },
                ]}
              />
            ))}
          </ScrollView>

          {/* Icon Picker */}
          <Text style={styles.formLabel}>Pack Icon</Text>
          <View style={styles.iconGrid}>
            {ICONS.map((i) => {
              const IconComp = getLucideIcon(i, LucideIcons.Layers);
              const isActive = icon === i;
              return (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.7}
                  onPress={() => setIcon(i)}
                  style={[
                    styles.iconSelectBtn,
                    isActive && styles.iconSelectBtnActive,
                  ]}
                >
                  <IconComp
                    color={isActive ? "#a5b4fc" : "#64748b"}
                    size={22}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.saveBtn, !isComplete && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!isComplete || isSaving}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <LucideIcons.Save size={18} color="#fff" strokeWidth={2.5} />
                <Text style={styles.saveBtnText}>Save to Library</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
