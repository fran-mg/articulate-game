import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DecksButton from "./decks/_DecksButton";
import DevDrawer from "./(dev)/dev-drawer/index";
import HomeHeader from "./modes/_ModeHeader";
import ModeCardList from "./modes/_ModeCardList";
import { initDatabase } from "../utils/database";
import { seedStarterDecksIfEmpty } from "../utils/deckImporter";
import { syncCommunityDecksMeta } from "../utils/cloudDecks";
import { useDeckStore } from "../stores/useDeckStore";

// true = user view, false = show dev tools
const isProductionTest = false;

export default function HomeScreen() {
  const { loadDecks } = useDeckStore();

  useEffect(() => {
    // Run asynchronously in the background so it doesn't block the UI rendering on app start
    const bootAppDatabase = async () => {
      try {
        await initDatabase();
        await seedStarterDecksIfEmpty();
        await loadDecks();

        // Background sync community decks
        const currentDecks = useDeckStore.getState().decks;
        const didUpdate = await syncCommunityDecksMeta(currentDecks);
        if (didUpdate) {
          await loadDecks(); // reload decks from DB if updates applied
        }
      } catch (e) {
        console.warn("Background DB initialization failed:", e);
      }
    };

    bootAppDatabase();
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <HomeHeader />

      <View style={styles.body}>
        <ModeCardList />
        <DecksButton />
      </View>

      {__DEV__ && !isProductionTest && <DevDrawer />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#020617",
    paddingHorizontal: 20,
  },
  body: {
    flex: 1,
  },
});
