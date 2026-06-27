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

interface CloudDecksModalProps {
  visible: boolean;
  onClose: () => void;
  onDecksUpdated: () => Promise<void>;
  installedDecks: any[];
}

// Helper to reliably map icon names
const getLucideIcon = (iconName: string | undefined, Fallback: any) => {
  if (!iconName) return Fallback;
  // Try direct lookup first
  if ((LucideIcons as any)[iconName]) {
    return (LucideIcons as any)[iconName];
  }
  // Convert kebab-case to PascalCase
  const pascal = iconName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");

  return (LucideIcons as any)[pascal] || Fallback;
};

export default function CloudDecksModal({
  visible,
  onClose,
  onDecksUpdated,
  installedDecks,
}: CloudDecksModalProps) {
  const [cloudDecks, setCloudDecks] = useState<CloudDeckIndexItem[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { playSound } = useSoundManager(["download"]);

  const { showAlert, AlertRender } = useAppAlert();

  useEffect(() => {
    if (visible) fetchDecks();
  }, [visible]);

  const fetchDecks = async () => {
    setIsFetching(true);
    try {
      const items = await fetchCloudDecksIndex();
      setCloudDecks(items);
    } catch {
      showAlert(
        "Connection Error",
        "Failed to reach the community repository.",
      );
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
      const message =
        result.deckName === cloudDeck.name
          ? `${cloudDeck.name} has been added.`
          : `Downloaded as "${result.deckName}".`;
      showAlert("Downloaded!", message);
    } else {
      showAlert("Download Failed", result.errorMsg || "Something went wrong.");
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
            <Text style={styles.eyebrow}>Community</Text>
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
            {cloudDecks.length === 0 ? (
              <View style={styles.emptyState}>
                <LucideIcons.CloudOff
                  color="#475569"
                  size={40}
                  strokeWidth={1.5}
                />
                <Text style={styles.emptyText}>No community decks found</Text>
              </View>
            ) : (
              cloudDecks.map((cloudDeck) => {
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

                    {/* Header row */}
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
                            {cloudDeck.cardCount}{" "}
                            {cloudDeck.cardCount === 1 ? "card" : "cards"}
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

                    {/* Description */}
                    <Text style={styles.deckDesc}>{cloudDeck.description}</Text>

                    {/* Download button - always show, with different text if installed */}
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

                    {/* Colour strip */}
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
  root: {
    flex: 1,
    backgroundColor: "#020617",
  },

  // ── Header ────────────────────────────────────────────────────────────────
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
  loadingText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "700",
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 48,
  },

  // ── Deck card ────────────────────────────────────────────────────────────
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
  deckHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
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
  deckMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
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
  deckCardCount: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "600",
  },
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
  downloadBtnLoading: {
    opacity: 0.6,
    borderStyle: "solid",
  },
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
  downloadBtnTextRedownload: {
    color: "#94a3b8",
  },
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
  emptyText: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "700",
  },
});
