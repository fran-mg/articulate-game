import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Participant } from "../utils/database";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

export const PRESET_COLORS = [
  "#3B82F6", // blue
  "#EF4444", // red
  "#10B981", // emerald
  "#F59E0B", // amber
  "#8B5CF6", // violet
  "#F97316", // orange
  "#0EA5E9", // sky
  "#EC4899", // pink
];

const generateId = () => Date.now() + Math.floor(Math.random() * 1000);

// ─── DEFAULTS ─────────────────────────────────────────────────────────────────

const DEFAULT_PLAYER_ROSTER: Participant[] = [
  { id: 1, name: "Player 1", color: PRESET_COLORS[0], type: "player" },
  { id: 2, name: "Player 2", color: PRESET_COLORS[1], type: "player" },
];

const DEFAULT_TEAM_ROSTER: Participant[] = [
  { id: 1, name: "Team 1", color: PRESET_COLORS[0], type: "team" },
  { id: 2, name: "Team 2", color: PRESET_COLORS[1], type: "team" },
];

// ─── STORE ────────────────────────────────────────────────────────────────────

interface RosterState {
  participants: Participant[];
  savedPlayers: Participant[];
  savedTeams: Participant[];

  /** Initialise with sensible defaults for the chosen play style */
  initRoster: (playStyle: "player" | "team") => void;

  addParticipant: (playStyle: "player" | "team") => void;
  updateParticipant: (id: number, name: string) => void;
  deleteParticipant: (id: number) => void;
  reorderParticipants: (newOrder: Participant[]) => void;
  getNextColor: () => string;

  /** Save the current active roster to memory */
  saveRoster: (playStyle: "player" | "team") => void;
  /** Wipe custom saved data and revert to initial hardcoded defaults */
  resetToDefault: (playStyle: "player" | "team") => void;
}

export const useRosterStore = create<RosterState>()(
  persist(
    (set, get) => ({
      participants: DEFAULT_TEAM_ROSTER.map((p) => ({ ...p })),
      savedPlayers: DEFAULT_PLAYER_ROSTER.map((p) => ({ ...p })),
      savedTeams: DEFAULT_TEAM_ROSTER.map((p) => ({ ...p })),

      initRoster: (playStyle) => {
        const { savedPlayers, savedTeams } = get();
        set({
          participants:
            playStyle === "player"
              ? savedPlayers.map((p) => ({ ...p }))
              : savedTeams.map((p) => ({ ...p })),
        });
      },

      addParticipant: (playStyle) => {
        const { participants, getNextColor } = get();
        const newParticipant: Participant = {
          id: generateId(),
          name: "",
          color: getNextColor(),
          type: playStyle as "player" | "team",
        };
        set({ participants: [...participants, newParticipant] });
      },

      updateParticipant: (id, name) => {
        set((state) => ({
          participants: state.participants.map((p) =>
            p.id === id ? { ...p, name } : p,
          ),
        }));
      },

      deleteParticipant: (id) => {
        set((state) => ({
          participants: state.participants.filter((p) => p.id !== id),
        }));
      },

      reorderParticipants: (newOrder) => {
        set({ participants: newOrder });
      },

      getNextColor: () => {
        const used = get().participants.map((p) => p.color);
        const available = PRESET_COLORS.filter((c) => !used.includes(c));
        return available.length > 0
          ? available[0]
          : PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
      },

      saveRoster: (playStyle) => {
        const { participants } = get();
        if (playStyle === "player") {
          set({ savedPlayers: participants.map((p) => ({ ...p })) });
        } else {
          set({ savedTeams: participants.map((p) => ({ ...p })) });
        }
      },

      resetToDefault: (playStyle) => {
        if (playStyle === "player") {
          const def = DEFAULT_PLAYER_ROSTER.map((p) => ({ ...p }));
          set({ savedPlayers: def, participants: def });
        } else {
          const def = DEFAULT_TEAM_ROSTER.map((p) => ({ ...p }));
          set({ savedTeams: def, participants: def });
        }
      },
    }),
    {
      name: "roster-store",
      storage: createJSONStorage(() => AsyncStorage),
      // We ONLY save the permanent presets, NOT the active session participants.
      // This prevents halfway-edited names from accidentally persisting on app close.
      partialize: (state) => ({
        savedPlayers: state.savedPlayers,
        savedTeams: state.savedTeams,
      }),
    },
  ),
);
