import * as LucideIcons from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { RenderItemParams } from "react-native-draggable-flatlist";
import {
  NestableDraggableFlatList,
  ScaleDecorator,
} from "../../../components/universal/DraggableFlatListProxy";
import { PlayStyle } from "../../../stores/useGameStore";
import { useRosterStore } from "../../../stores/useRosterStore";
import { ModeAccent } from "../../../utils/_modeTheme";
import { Participant } from "../../../utils/database";
import ParticipantItem from "./_ParticipantItem";
import { useAppAlert } from "../../_AppAlert";

interface ParticipantSelectorProps {
  playStyle: PlayStyle;
  onPlayStyleChange: (style: PlayStyle) => void;
  onScrollRequest: (y: number) => void;
  accent: ModeAccent;
  onResetRoster: () => void;
}

export default function ParticipantSelector({
  playStyle,
  onPlayStyleChange,
  onScrollRequest,
  accent,
  onResetRoster,
}: ParticipantSelectorProps) {
  const {
    participants,
    addParticipant,
    updateParticipant,
    deleteParticipant,
    reorderParticipants,
    saveRoster,
    resetToDefault,
  } = useRosterStore();

  const { showAlert, AlertRender } = useAppAlert();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [containerY, setContainerY] = useState(0);
  const isNewItemRef = useRef(false);

  useEffect(() => {
    setEditingId(null);
    setEditName("");
    isNewItemRef.current = false;
  }, [playStyle]);

  const handleBeginEdit = (id: number, currentName: string) => {
    isNewItemRef.current = currentName === "";
    setEditingId(id);
    setEditName(currentName);
    const freshParticipants = useRosterStore.getState().participants;
    const index = freshParticipants.findIndex((p) => p.id === id);
    if (index !== -1) {
      const targetY = containerY + 64 + index * 64 - 120;
      onScrollRequest(Math.max(0, targetY));
    }
  };

  const handleConfirmEdit = () => {
    const trimmed = editName.trim();
    if (!trimmed) {
      showAlert("Name required", `Please give this ${playStyle} a name.`);
      return;
    }
    updateParticipant(editingId!, trimmed);
    setEditingId(null);
    isNewItemRef.current = false;
  };

  const handleCancelEdit = (id: number) => {
    if (isNewItemRef.current) deleteParticipant(id);
    setEditingId(null);
    isNewItemRef.current = false;
  };

  const handleDelete = (id: number) => {
    if (participants.length <= 2) {
      showAlert("Can't remove", `You need at least two ${playStyle}s.`);
      return;
    }
    deleteParticipant(id);
  };

  const handleAdd = () => {
    if (isNewItemRef.current && editingId !== null) {
      showAlert("Name required", `Please name before adding another.`);
      return;
    }
    if (editingId !== null && editName.trim() === "") {
      showAlert("Name required", `Please finish naming before adding another.`);
      return;
    }
    if (editingId !== null) {
      const trimmed = editName.trim();
      if (trimmed) updateParticipant(editingId, trimmed);
      setEditingId(null);
      isNewItemRef.current = false;
    }
    addParticipant(playStyle);
    setTimeout(() => {
      const latest = useRosterStore.getState().participants.at(-1);
      if (latest) handleBeginEdit(latest.id, "");
    }, 50);
  };

  const handleSave = () => {
    if (editingId !== null) {
      const trimmed = editName.trim();
      if (trimmed) updateParticipant(editingId, trimmed);
      else if (isNewItemRef.current) deleteParticipant(editingId);
      setEditingId(null);
      isNewItemRef.current = false;
    }
    setTimeout(() => {
      saveRoster(playStyle);
      showAlert("Roster Saved", `Your ${playStyle} lineup has been saved.`);
    }, 10);
  };

  const handleReset = () => {
    setEditingId(null);
    isNewItemRef.current = false;
    resetToDefault(playStyle);
    onResetRoster();
    showAlert("Reset Complete", `Restored to the default lineup.`);
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const newParticipants = [...participants];
    const targetIndex = index + direction;
    [newParticipants[index], newParticipants[targetIndex]] = [
      newParticipants[targetIndex],
      newParticipants[index],
    ];
    reorderParticipants(newParticipants);
  };

  const renderItem = (params: RenderItemParams<Participant>) => {
    const index = participants.findIndex((p) => p.id === params.item.id);
    return (
      <ScaleDecorator>
        <ParticipantItem
          {...params}
          playStyle={playStyle}
          editingId={editingId}
          editName={editName}
          onEditNameChange={setEditName}
          onBeginEdit={handleBeginEdit}
          onConfirmEdit={handleConfirmEdit}
          onCancelEdit={handleCancelEdit}
          onDelete={handleDelete}
          onMoveUp={() => handleMove(index, -1)}
          onMoveDown={() => handleMove(index, 1)}
          isFirst={index === 0}
          isLast={index === participants.length - 1}
        />
      </ScaleDecorator>
    );
  };

  return (
    <View
      style={styles.wrapper}
      onLayout={(e) => setContainerY(e.nativeEvent.layout.y)}
    >
      <View
        style={[
          styles.headerCard,
          playStyle === "just_play" && {
            borderBottomWidth: 1,
            borderRadius: 24,
          },
        ]}
      >
        <View style={styles.cardShine} pointerEvents="none" />
        <View style={styles.headerTop}>
          <View style={styles.sectionLabelRow}>
            <LucideIcons.Users size={11} color="#64748b" strokeWidth={2.5} />
            <Text style={styles.sectionLabel}>Play Style</Text>
          </View>

          <View style={styles.styleToggle}>
            <TouchableOpacity
              onPress={() => onPlayStyleChange("player")}
              style={[
                styles.styleBtn,
                playStyle === "player" && {
                  backgroundColor: accent.colorBg,
                  borderColor: accent.colorBorder,
                },
                playStyle !== "player" && styles.styleBtnInactive,
              ]}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.styleBtnText,
                  {
                    color:
                      playStyle === "player" ? accent.colorMuted : "#475569",
                  },
                ]}
              >
                Player
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onPlayStyleChange("team")}
              style={[
                styles.styleBtn,
                playStyle === "team" && {
                  backgroundColor: accent.colorBg,
                  borderColor: accent.colorBorder,
                },
                playStyle !== "team" && styles.styleBtnInactive,
              ]}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.styleBtnText,
                  {
                    color: playStyle === "team" ? accent.colorMuted : "#475569",
                  },
                ]}
              >
                Team
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onPlayStyleChange("just_play")}
              style={[
                styles.styleBtn,
                playStyle === "just_play" && {
                  backgroundColor: accent.colorBg,
                  borderColor: accent.colorBorder,
                },
                playStyle !== "just_play" && styles.styleBtnInactive,
              ]}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.styleBtnText,
                  {
                    color:
                      playStyle === "just_play" ? accent.colorMuted : "#475569",
                  },
                ]}
              >
                Just Play
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {playStyle === "just_play" && (
          <View style={styles.justPlayBody}>
            <LucideIcons.Gamepad2
              size={24}
              color={accent.colorMuted}
              strokeWidth={1.5}
              style={{ marginBottom: 4 }}
            />
            <Text style={[styles.justPlayTitle, { color: accent.colorMuted }]}>
              Casual Mode
            </Text>
            <Text style={styles.justPlayDesc}>
              Jump straight in. No names, no teams, just many rounds!
            </Text>
          </View>
        )}
      </View>

      {playStyle !== "just_play" && (
        <>
          <View style={styles.listBody}>
            <NestableDraggableFlatList
              data={participants}
              keyExtractor={(item: Participant) => String(item.id)}
              renderItem={renderItem}
              onDragEnd={({ data }: any) => reorderParticipants(data)}
              activationDistance={8}
            />
          </View>
          <View style={styles.footerCard}>
            <View style={styles.footerMeta}>
              <Text style={styles.footerCount}>
                {participants.length}{" "}
                {participants.length === 1 ? playStyle : `${playStyle}s`}
              </Text>
              <View style={styles.dragHint}>
                {Platform.OS === "web" ? (
                  <>
                    <LucideIcons.ChevronsUpDown
                      color="#1e293b"
                      size={12}
                      strokeWidth={2}
                    />
                    <Text style={styles.dragHintText}>arrows to reorder</Text>
                  </>
                ) : (
                  <>
                    <LucideIcons.GripVertical
                      color="#1e293b"
                      size={12}
                      strokeWidth={2}
                    />
                    <Text style={styles.dragHintText}>drag to reorder</Text>
                  </>
                )}
              </View>
            </View>

            <TouchableOpacity
              onPress={handleAdd}
              activeOpacity={0.7}
              style={[styles.addBtn, { borderColor: accent.colorBorder }]}
            >
              <LucideIcons.Plus
                size={14}
                color={accent.colorMuted}
                strokeWidth={2.5}
              />
              <Text style={[styles.addBtnText, { color: accent.colorMuted }]}>
                Add {playStyle === "player" ? "Player" : "Team"}
              </Text>
            </TouchableOpacity>

            <View style={styles.utilityRow}>
              <TouchableOpacity
                onPress={handleSave}
                style={styles.utilityBtn}
                activeOpacity={0.6}
              >
                <LucideIcons.Save size={13} color="#64748b" strokeWidth={2.5} />
                <Text style={styles.utilityBtnText}>Save Lineup</Text>
              </TouchableOpacity>
              <View style={styles.utilityDivider} />
              <TouchableOpacity
                onPress={handleReset}
                style={styles.utilityBtn}
                activeOpacity={0.6}
              >
                <LucideIcons.RotateCcw
                  size={13}
                  color="#64748b"
                  strokeWidth={2.5}
                />
                <Text style={styles.utilityBtnText}>Reset Defaults</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
      {AlertRender}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  cardShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "60%",
    backgroundColor: "rgba(255,255,255,0.025)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerCard: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    borderBottomWidth: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    overflow: "hidden",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionLabel: {
    color: "#475569",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  styleToggle: { flexDirection: "row", gap: 6 },
  styleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  styleBtnInactive: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: "rgba(255,255,255,0.07)",
  },
  styleBtnText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.3 },

  justPlayBody: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 4,
  },
  justPlayTitle: { fontSize: 15, fontWeight: "800", letterSpacing: -0.2 },
  justPlayDesc: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 18,
  },

  listBody: {
    backgroundColor: "rgba(15,23,42,0.95)",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    paddingHorizontal: 2,
    paddingVertical: 8,
  },
  footerCard: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    borderTopWidth: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  footerMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  footerCount: {
    color: "#334155",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  dragHint: { flexDirection: "row", alignItems: "center", gap: 4 },
  dragHintText: { color: "#1e293b", fontSize: 10, fontWeight: "600" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 13,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  addBtnText: { fontSize: 13, fontWeight: "800", letterSpacing: 0.3 },
  utilityRow: {
    flexDirection: "row",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
  },
  utilityBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 4,
  },
  utilityBtnText: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  utilityDivider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
});
