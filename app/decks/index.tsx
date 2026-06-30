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
import CreateOptionsModal from "./deck-actions/deck-create/_CreateOptionsModal";
import GenerateDeckModal from "./deck-actions/deck-create/_GenerateDeckModal";
import DeckActionsRow from "./_DeckActionsRow";
import { styles } from "./Decks.styles";

export default function DecksScreen() {
  const { decks, loadDecks, deleteDeck } = useDeckStore();
  const { showAlert, AlertRender } = useAppAlert();

  const [activeTab, setActiveTab] = useState<string>("all");
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);

  // Modal Visibility States
  const [isCloudModalVisible, setIsCloudModalVisible] = useState(false);
  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false);
  const [isManualCreateVisible, setIsManualCreateVisible] = useState(false);
  const [isGenerateModalVisible, setIsGenerateModalVisible] = useState(false);

  useEffect(() => {
    loadDecks();
  }, []);

  const baseCategories = Array.from(
    new Set(decks.map((d) => d.category?.trim().toLowerCase()).filter(Boolean)),
  );

  const filteredBase = baseCategories.filter(
    (c) => c !== "my decks" && c !== "community generated",
  );

  const categories = [
    "all",
    "my decks",
    "community generated",
    ...filteredBase,
  ];

  const filteredDecks =
    activeTab === "all"
      ? decks
      : activeTab === "my decks"
        ? decks.filter((d) => d.source === "user-created")
        : activeTab === "community generated"
          ? decks.filter((d) => d.source === "community")
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
          onCreatePress={() => setIsOptionsModalVisible(true)}
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

      <CreateOptionsModal
        visible={isOptionsModalVisible}
        onClose={() => setIsOptionsModalVisible(false)}
        onSelectManual={() => {
          setIsOptionsModalVisible(false);
          // Small timeout ensures clean modal transitions on iOS/Android
          setTimeout(() => setIsManualCreateVisible(true), 300);
        }}
        onSelectAI={() => {
          setIsOptionsModalVisible(false);
          setTimeout(() => setIsGenerateModalVisible(true), 300);
        }}
      />

      <CreateDeckModal
        visible={isManualCreateVisible}
        onClose={() => setIsManualCreateVisible(false)}
        onCreated={async () => {
          await loadDecks();
          setActiveTab("my decks");
          showAlert(
            "Pack Created!",
            "Tap the pencil icon on your new pack to start adding words.",
          );
        }}
      />

      <GenerateDeckModal
        visible={isGenerateModalVisible}
        onClose={() => setIsGenerateModalVisible(false)}
        onSuccess={() => {
          setIsGenerateModalVisible(false);
          // Give a brief moment for the modal to close, then pop the Cloud Modal open
          // so they can see/download their newly generated deck!
          setTimeout(() => {
            setIsCloudModalVisible(true);
          }, 500);
        }}
      />

      <CloudDecksModal
        visible={isCloudModalVisible}
        onClose={() => setIsCloudModalVisible(false)}
        onDecksUpdated={loadDecks}
        installedDecks={decks}
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
