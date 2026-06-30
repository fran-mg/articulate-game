import * as LucideIcons from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CloudDeckIndexItem,
  downloadAndImportDeck,
  fetchCloudDecksIndex,
} from "../../../utils/cloudDecks";
import { useSoundManager } from "../../../hooks/useSoundManager";
import { useAppAlert } from "../../_AppAlert";

const getLucideIcon = (iconName: string | undefined, Fallback: any) => {
  if (!iconName) return Fallback;
  if ((LucideIcons as any)[iconName]) return (LucideIcons as any)[iconName];
  const pascal = iconName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
  return (LucideIcons as any)[pascal] || Fallback;
};

interface CloudDecksModalProps {
  visible: boolean;
  onClose: () => void;
  onDecksUpdated: () => Promise<void>;
  installedDecks: any[];
}

export default function CloudDecksModal({
  visible,
  onClose,
  onDecksUpdated,
  installedDecks,
}: CloudDecksModalProps) {
  const [activeTab, setActiveTab] = useState<"official" | "community">(
    "official",
  );
  const [officialDecks, setOfficialDecks] = useState<CloudDeckIndexItem[]>([]);
  const [communityDecks, setCommunityDecks] = useState<CloudDeckIndexItem[]>(
    [],
  );
  const [isFetching, setIsFetching] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { playSound } = useSoundManager(["download", "click"]);
  const { showAlert, AlertRender } = useAppAlert();

  useEffect(() => {
    if (visible) fetchDecks();
  }, [visible]);

  const fetchDecks = async () => {
    setIsFetching(true);
    try {
      const [off, comm] = await Promise.all([
        fetchCloudDecksIndex("decks-index.json"),
        fetchCloudDecksIndex("userGeneratedDecks-index.json").catch(() => []),
      ]);
      setOfficialDecks(off);
      setCommunityDecks(comm);
    } catch {
      showAlert("Connection Error", "Failed to reach the repository.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleDownload = async (cloudDeck: CloudDeckIndexItem) => {
    setDownloadingId(cloudDeck.id);
    const result = await downloadAndImportDeck(cloudDeck, installedDecks);
    setDownloadingId(null);

    if (result.success) {
      playSound("download");
      await onDecksUpdated();
      showAlert(
        "Downloaded!",
        `${cloudDeck.name} has been added to your library.`,
      );
    } else {
      showAlert("Download Failed", result.errorMsg || "Something went wrong.");
    }
  };

  const currentList = activeTab === "official" ? officialDecks : communityDecks;

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
            <Text style={styles.eyebrow}>Cloud</Text>
            <Text style={styles.title}>Browse Packs</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            activeOpacity={0.7}
          >
            <LucideIcons.X color="#cbd5e1" size={20} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Tab Navigator */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "official" && styles.activeTab]}
            onPress={() => {
              playSound("click");
              setActiveTab("official");
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "official" && styles.activeTabText,
              ]}
            >
              Official Packs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "community" && styles.activeTab]}
            onPress={() => {
              playSound("click");
              setActiveTab("community");
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "community" && styles.activeTabText,
              ]}
            >
              Community
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {isFetching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Fetching repository...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {currentList.length === 0 ? (
              <View style={styles.emptyState}>
                <LucideIcons.CloudOff
                  color="#475569"
                  size={40}
                  strokeWidth={1.5}
                />
                <Text style={styles.emptyText}>
                  No decks found in this category.
                </Text>
              </View>
            ) : (
              currentList.map((cloudDeck) => {
                const isInstalled = installedDecks.some(
                  (d) => d.name === cloudDeck.name,
                );
                const isDownloading = downloadingId === cloudDeck.id;
                const CloudIcon = getLucideIcon(
                  cloudDeck.icon,
                  LucideIcons.Cloud,
                );

                return (
                  <View key={cloudDeck.id} style={styles.deckCard}>
                    <View style={styles.cardShine} pointerEvents="none" />
                    <View style={styles.deckHeader}>
                      <View
                        style={[
                          styles.deckIcon,
                          {
                            backgroundColor: `${cloudDeck.color}22`,
                            borderColor: `${cloudDeck.color}55`,
                          },
                        ]}
                      >
                        <CloudIcon
                          color={cloudDeck.color}
                          size={24}
                          strokeWidth={2}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.deckName}>{cloudDeck.name}</Text>
                        <View style={styles.deckMetaRow}>
                          <Text style={styles.deckCategory}>
                            {cloudDeck.category}
                          </Text>
                          <View style={styles.deckMetaDot} />
                          <Text style={styles.deckCardCount}>
                            {cloudDeck.cardCount} cards
                          </Text>
                        </View>
                      </View>
                      {isInstalled && (
                        <View style={styles.installedBadge}>
                          <LucideIcons.Check
                            size={11}
                            color="#10b981"
                            strokeWidth={3}
                          />
                          <Text style={styles.installedBadgeText}>
                            Installed
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.deckDesc}>{cloudDeck.description}</Text>
                    <TouchableOpacity
                      onPress={() => handleDownload(cloudDeck)}
                      disabled={isDownloading}
                      activeOpacity={0.75}
                      style={[
                        styles.downloadBtn,
                        isDownloading && styles.downloadBtnLoading,
                        isInstalled && styles.downloadBtnRedownload,
                      ]}
                    >
                      {isDownloading ? (
                        <ActivityIndicator size="small" color="#818cf8" />
                      ) : (
                        <LucideIcons.Download
                          size={14}
                          color={isInstalled ? "#94a3b8" : "#a5b4fc"}
                          strokeWidth={2.5}
                        />
                      )}
                      <Text
                        style={[
                          styles.downloadBtnText,
                          isInstalled && styles.downloadBtnTextRedownload,
                        ]}
                      >
                        {isDownloading
                          ? "Downloading..."
                          : isInstalled
                            ? "Download Again"
                            : "Download Pack"}
                      </Text>
                    </TouchableOpacity>
                    <View
                      style={[
                        styles.colorStrip,
                        { backgroundColor: cloudDeck.color },
                      ]}
                    />
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
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
    color: "#64748b",
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
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 },
  activeTab: { backgroundColor: "#6366f1" },
  tabText: { color: "#94a3b8", fontSize: 13, fontWeight: "700" },
  activeTabText: { color: "#ffffff" },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginHorizontal: 20,
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: { color: "#94a3b8", fontSize: 13, fontWeight: "700" },
  listContent: { padding: 16, gap: 12, paddingBottom: 48 },
  deckCard: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    borderRadius: 20,
    padding: 16,
    overflow: "hidden",
    gap: 12,
  },
  cardShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "35%",
    backgroundColor: "rgba(255,255,255,0.025)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  deckHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  deckIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  deckName: {
    color: "#f1f5f9",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.2,
    marginBottom: 5,
  },
  deckMetaRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  deckCategory: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  deckMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#475569",
  },
  deckCardCount: { color: "#94a3b8", fontSize: 11, fontWeight: "600" },
  installedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(16,185,129,0.14)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.35)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  installedBadgeText: {
    color: "#10b981",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  deckDesc: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(99,102,241,0.5)",
    backgroundColor: "rgba(99,102,241,0.1)",
  },
  downloadBtnLoading: { opacity: 0.6, borderStyle: "solid" },
  downloadBtnRedownload: {
    borderStyle: "solid",
    borderColor: "rgba(148,163,184,0.3)",
    backgroundColor: "rgba(148,163,184,0.08)",
  },
  downloadBtnText: {
    color: "#a5b4fc",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  downloadBtnTextRedownload: { color: "#94a3b8" },
  colorStrip: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.65,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 56,
    gap: 14,
  },
  emptyText: { color: "#64748b", fontSize: 13, fontWeight: "700" },
});
