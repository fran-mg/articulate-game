import * as React from "react";
import { useState, useEffect } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDeckStore, Deck } from "../../stores/useDeckStore";
import { useAppAlert } from "../_AppAlert";

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
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);

  // Modals
  const [isCloudModalVisible, setIsCloudModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  useEffect(() => {
    loadDecks();
  }, []);

  // 1. Extract natural categories from DB (ignoring system labels)
  const baseCategories = Array.from(
    new Set(decks.map((d) => d.category?.trim().toLowerCase()).filter(Boolean)),
  );

  // 2. Remove "my decks" and "community generated" from base categories if they happen to exist there
  const filteredBase = baseCategories.filter(
    (c) => c !== "my decks" && c !== "community generated",
  );

  // 3. Assemble Categories Bar with our custom System Tabs pinned at the front
  const categories = [
    "all",
    "my decks",
    "community generated", // <--- NEW AI CATEGORY TAB
    ...filteredBase,
  ];

  // 4. Handle actual list Filtering
  const filteredDecks =
    activeTab === "all"
      ? decks
      : activeTab === "my decks"
        ? decks.filter((d) => d.source === "user-created")
        : activeTab === "community generated"
          ? decks.filter((d) => d.source === "community") // Catches all cloud downloads
          : decks.filter((d) => d.category?.toLowerCase() === activeTab);

  return (
    <SafeAreaView style={styles.root}>
      <PageHeader />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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

      <CloudDecksModal
        visible={isCloudModalVisible}
        onClose={() => setIsCloudModalVisible(false)}
        onDecksUpdated={loadDecks}
        installedDecks={decks}
      />

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

      <EditDeckModal
        deck={editingDeck}
        onClose={() => setEditingDeck(null)}
        onDecksUpdated={loadDecks}
      />

      {AlertRender}
    </SafeAreaView>
  );
}
