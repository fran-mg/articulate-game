import * as React from "react";
import { useState, useEffect } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDeckStore, Deck } from "../../stores/useDeckStore";
import { generateDeckViaAI } from "../../utils/aiGenerator";
import { useAppAlert } from "../_AppAlert";

import AIForgeCard from "./deck-aigeneration-unused/_AIForgeCard";
import CategoryFilter from "./deck-display/_CategoryFilter";
import DeckList from "./deck-display/_DeckList";
import PageHeader from "./_PageHeader";
import CloudDecksModal from "./deck-actions/_DownloadDecks";
import EditDeckModal from "./deck-actions/deck-edit/_EditDeck";
import CreateDeckModal from "./deck-actions/deck-create/_CreateDeckModal";
import DeckActionsRow from "./_DeckActionsRow";
import { styles } from "./Decks.styles";

export default function DecksScreen() {
  const { decks, loadDecks, deleteDeck } = useDeckStore();
  const { showAlert, AlertRender } = useAppAlert();

  const [activeTab, setActiveTab] = useState<string>("all");
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);

  // Modals
  const [isCloudModalVisible, setIsCloudModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  useEffect(() => {
    loadDecks();
  }, []);

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    const result = await generateDeckViaAI(
      aiPrompt,
      process.env.EXPO_PUBLIC_GROQ_API_KEY ?? "",
    );
    setIsGenerating(false);

    if (result.success) {
      setAiPrompt("");
      await loadDecks();
      showAlert("Pack Created", "Your custom card pack has been added.");
    } else {
      showAlert("Generation Failed", result.error ?? "Review network logs.");
    }
  };

  // Generate Filter Categories — forcing "my decks" to appear first
  const baseCategories = Array.from(
    new Set(decks.map((d) => d.category?.trim().toLowerCase()).filter(Boolean)),
  );
  const categories = [
    "all",
    "my decks",
    ...baseCategories.filter((c) => c !== "my decks"),
  ];

  // Apply Filtering
  const filteredDecks =
    activeTab === "all"
      ? decks
      : activeTab === "my decks"
        ? decks.filter((d) => d.source === "user-created")
        : decks.filter((d) => d.category.toLowerCase() === activeTab);

  return (
    <SafeAreaView style={styles.root}>
      <PageHeader />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {false && (
          <AIForgeCard
            prompt={aiPrompt}
            isGenerating={isGenerating}
            onChangePrompt={setAiPrompt}
            onGenerate={handleAIGenerate}
          />
        )}

        {/* Replaced Create Card with the Side-By-Side Row */}
        <DeckActionsRow
          onCreatePress={() => setIsCreateModalVisible(true)}
          onDownloadPress={() => setIsCloudModalVisible(true)}
        />

        <CategoryFilter
          categories={categories}
          activeTab={activeTab}
          onSelect={setActiveTab}
        />

        <DeckList
          decks={filteredDecks}
          onEdit={setEditingDeck}
          onDelete={deleteDeck}
        />
      </ScrollView>

      {/* Cloud Store Modal */}
      <CloudDecksModal
        visible={isCloudModalVisible}
        onClose={() => setIsCloudModalVisible(false)}
        onDecksUpdated={loadDecks}
        installedDecks={decks}
      />

      {/* Creation Modal */}
      <CreateDeckModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onCreated={async () => {
          await loadDecks();
          setActiveTab("my decks");
          showAlert(
            "Pack Created!",
            "Tap the pencil icon on your new pack to start adding words.",
          );
        }}
      />

      {/* Edit Deck Words Modal */}
      <EditDeckModal
        deck={editingDeck}
        onClose={() => setEditingDeck(null)}
        onDecksUpdated={loadDecks}
      />

      {AlertRender}
    </SafeAreaView>
  );
}
