import * as LucideIcons from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
  onResetRoster: () => void; // ── NEW PROP
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
    saveRoster, // ── NEW
    resetToDefault, // ── NEW
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
    if (participants.length <= 1) {
      showAlert("Can't remove", `You need at least one ${playStyle}.`);
      return;
    }
    deleteParticipant(id);
  };

  const handleAdd = () => {
    if (isNewItemRef.current && editingId !== null) {
      showAlert(
        "Name required",
        `Please name the current ${playStyle} before adding another.`,
      );
      return;
    }

    if (editingId !== null && editName.trim() === "") {
      showAlert(
        "Name required",
        `Please finish naming the current ${playStyle} before adding another.`,
      );
      return;
    }

    if (editingId !== null) {
      const trimmed = editName.trim();
      if (trimmed) {
        updateParticipant(editingId, trimmed);
      }
      setEditingId(null);
      isNewItemRef.current = false;
    }

    addParticipant(playStyle);
    setTimeout(() => {
      const latest = useRosterStore.getState().participants.at(-1);
      if (latest) handleBeginEdit(latest.id, "");
    }, 50);
  };

  // ── Save to presets ──
  const handleSave = () => {
    // If currently mid-edit, lock it in automatically
    if (editingId !== null) {
      const trimmed = editName.trim();
      if (trimmed) updateParticipant(editingId, trimmed);
      else if (isNewItemRef.current) deleteParticipant(editingId);
      setEditingId(null);
      isNewItemRef.current = false;
    }

    // Wrap in timeout so UI states (like closing inputs) settle first
    setTimeout(() => {
      saveRoster(playStyle);
      showAlert(
        "Roster Saved",
        `Your ${playStyle} lineup has been saved for future games.`,
      );
    }, 10);
  };

  // ── NEW: Revert to default hardcodes ──
  const handleReset = () => {
    setEditingId(null);
    isNewItemRef.current = false;
    resetToDefault(playStyle);
    onResetRoster();
    showAlert("Reset Complete", `Restored to the default ${playStyle} lineup.`);
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
      {/* ── Header card ── */}
      <View style={styles.headerCard}>
        <View style={styles.cardShine} pointerEvents="none" />

        <View style={styles.headerTop}>
          <View style={styles.sectionLabelRow}>
            <LucideIcons.Users size={11} color="#64748b" strokeWidth={2.5} />
            <Text style={styles.sectionLabel}>Participants</Text>
          </View>

          {/* Solo / Teams toggle */}
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
              <LucideIcons.User
                size={11}
                color={playStyle === "player" ? accent.colorMuted : "#475569"}
                strokeWidth={2.5}
              />
              <Text
                style={[
                  styles.styleBtnText,
                  {
                    color:
                      playStyle === "player" ? accent.colorMuted : "#475569",
                  },
                ]}
              >
                Players
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
              <LucideIcons.Users
                size={11}
                color={playStyle === "team" ? accent.colorMuted : "#475569"}
                strokeWidth={2.5}
              />
              <Text
                style={[
                  styles.styleBtnText,
                  {
                    color: playStyle === "team" ? accent.colorMuted : "#475569",
                  },
                ]}
              >
                Teams
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── List body ── */}
      <View style={styles.listBody}>
        <NestableDraggableFlatList
          data={participants}
          keyExtractor={(item: Participant) => String(item.id)}
          renderItem={renderItem}
          onDragEnd={({ data }: any) => reorderParticipants(data)}
          activationDistance={8}
        />
      </View>

      {/* ── Footer card ── */}
      <View style={styles.footerCard}>
        <View style={styles.footerMeta}>
          <Text style={styles.footerCount}>
            {participants.length}{" "}
            {participants.length === 1 ? playStyle : `${playStyle}s`}
          </Text>
          <View style={styles.dragHint}>
            <LucideIcons.GripVertical
              color="#1e293b"
              size={12}
              strokeWidth={2}
            />
            <Text style={styles.dragHintText}>drag to reorder</Text>
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

        {/* ── Utility options row ── */}
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

      {AlertRender}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
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
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionLabel: {
    color: "#475569",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  styleToggle: {
    flexDirection: "row",
    gap: 6,
  },
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
  styleBtnText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
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
  dragHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dragHintText: {
    color: "#1e293b",
    fontSize: 10,
    fontWeight: "600",
  },
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
  addBtnText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  // ── Utility Row Styles ──────────────────────────────────────────
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
