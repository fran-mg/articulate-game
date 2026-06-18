import { create } from "zustand";
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

  /** Initialise with sensible defaults for the chosen play style */
  initRoster: (playStyle: "player" | "team") => void;

  addParticipant: (playStyle: "player" | "team") => void;
  updateParticipant: (id: number, name: string) => void;
  deleteParticipant: (id: number) => void;
  reorderParticipants: (newOrder: Participant[]) => void;

  /** Returns the next color not already used, cycling if all are taken */
  getNextColor: () => string;
}

export const useRosterStore = create<RosterState>((set, get) => ({
  participants: DEFAULT_TEAM_ROSTER,

  initRoster: (playStyle) => {
    set({
      participants:
        playStyle === "player"
          ? DEFAULT_PLAYER_ROSTER.map((p) => ({ ...p }))
          : DEFAULT_TEAM_ROSTER.map((p) => ({ ...p })),
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
}));
