import { LinearGradient } from "expo-linear-gradient";
import * as LucideIcons from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getModeTheme, resolveCardTheme } from "../../../utils/_modeTheme";
import { CardFlashState } from "./index";

// ─── Sizing constants ─────────────────────────────────────────────────────────

const FONT_RANGE_MAX = 72; // Top of target range
const FONT_RANGE_MIN = 44; // Bottom of target range — still big and clear
const FONT_HARD_MIN = 22; // Absolute floor — never render smaller than this

const WIDTH_SAFETY = 0.93; // Fraction of measured width we trust
const CHAR_W_RATIO = 0.6; // Avg char width as fraction of fontSize (bold/heavy)
const LINE_H_RATIO = 1.2; // lineHeight = fontSize * this
const STEP = 2; // Font size step when searching

// ─── Pure sizing helpers ──────────────────────────────────────────────────────

function estimateWidth(text: string, fs: number): number {
  return text.length * fs * CHAR_W_RATIO;
}

function lineHeightAt(fs: number): number {
  return fs * LINE_H_RATIO;
}

function maxLinesFor(availH: number, fs: number): number {
  return Math.max(1, Math.floor(availH / lineHeightAt(fs)));
}

/**
 * Greedy word-wrap: how many lines does `words` need at font size `fs`
 * within available width `availW`?
 */
function simulateLines(words: string[], fs: number, availW: number): number {
  const maxW = availW * WIDTH_SAFETY;
  const spaceW = fs * CHAR_W_RATIO * 0.45;
  let lines = 1;
  let lineW = 0;

  for (const word of words) {
    const wW = estimateWidth(word, fs);
    if (lineW === 0) {
      lineW = wW;
    } else if (lineW + spaceW + wW <= maxW) {
      lineW += spaceW + wW;
    } else {
      lines++;
      lineW = wW;
    }
  }
  return lines;
}

/**
 * Search downward from `hi` to `lo` (step = STEP) and return the first
 * font size where `predicate` is true. Returns `lo` if none found.
 */
function largestWhere(
  lo: number,
  hi: number,
  predicate: (fs: number) => boolean,
): number {
  for (let fs = hi; fs >= lo; fs -= STEP) {
    if (predicate(fs)) return fs;
  }
  return lo;
}

// ─── Core algorithm ───────────────────────────────────────────────────────────

interface WordLayout {
  fontSize: number;
  numberOfLines: number;
  allowWrap: boolean;
}

/**
 * Five rules in strict priority order:
 *
 *  R1. Prefer to be within [FONT_RANGE_MIN, FONT_RANGE_MAX].
 *  R2. If the whole phrase (any number of words) fits on ONE LINE
 *      within the range → single line, largest possible size in range.
 *  R3. If the phrase is multi-word and can fit on MULTIPLE LINES
 *      within the range (no word split, all lines fit in height)
 *      → wrap at spaces, largest possible in-range size.
 *  R4. Single word that can't fit in range on one line → shrink BELOW
 *      the range until it fits on one line (down to FONT_HARD_MIN).
 *  R5. Single word that can't fit even at FONT_HARD_MIN → clamp at
 *      FONT_HARD_MIN and allow wrap (unavoidable last resort).
 */
function computeWordLayout(
  phrase: string,
  availW: number,
  availH: number,
): WordLayout {
  if (!phrase || availW <= 0 || availH <= 0) {
    return { fontSize: FONT_RANGE_MAX, numberOfLines: 1, allowWrap: false };
  }

  const safeW = availW * WIDTH_SAFETY;
  const words = phrase.trim().split(/\s+/);
  const isMulti = words.length > 1;
  const longestW = words.reduce((a, b) => (a.length >= b.length ? a : b), "");

  // ── R2: whole phrase on one line, within range ────────────────────────────
  // This applies to BOTH single-word and multi-word phrases equally.
  // A multi-word phrase "Hello World" is treated as one string for width.
  {
    const fs = largestWhere(
      FONT_RANGE_MIN,
      FONT_RANGE_MAX,
      (fs) =>
        estimateWidth(phrase, fs) <= safeW && // fits as one line
        lineHeightAt(fs) <= availH, // line itself fits in height
    );

    // Verify it actually fits (largestWhere returns lo even on failure)
    if (estimateWidth(phrase, fs) <= safeW && lineHeightAt(fs) <= availH) {
      return { fontSize: fs, numberOfLines: 1, allowWrap: false };
    }
  }

  // ── R3: multi-word phrase, wrap onto multiple lines, within range ─────────
  if (isMulti) {
    const fs = largestWhere(FONT_RANGE_MIN, FONT_RANGE_MAX, (fs) => {
      // No individual word may be split — longest word must fit on one line
      if (estimateWidth(longestW, fs) > safeW) return false;
      // Total lines needed must fit in available height
      const needed = simulateLines(words, fs, availW);
      return needed <= maxLinesFor(availH, fs);
    });

    if (
      estimateWidth(longestW, fs) <= safeW &&
      simulateLines(words, fs, availW) <= maxLinesFor(availH, fs)
    ) {
      const needed = simulateLines(words, fs, availW);
      return { fontSize: fs, numberOfLines: needed, allowWrap: true };
    }

    // In-range failed — try below range with wrapping
    {
      const fs = largestWhere(FONT_HARD_MIN, FONT_RANGE_MIN - STEP, (fs) => {
        if (estimateWidth(longestW, fs) > safeW) return false;
        const needed = simulateLines(words, fs, availW);
        return needed <= maxLinesFor(availH, fs);
      });

      const needed = simulateLines(words, fs, availW);
      const avail = maxLinesFor(availH, fs);
      return {
        fontSize: fs,
        numberOfLines: Math.min(needed, avail),
        allowWrap: true,
      };
    }
  }

  // ── R4: single word — shrink below range to fit on one line ──────────────
  {
    const fs = largestWhere(
      FONT_HARD_MIN,
      FONT_RANGE_MIN - STEP,
      (fs) => estimateWidth(phrase, fs) <= safeW && lineHeightAt(fs) <= availH,
    );

    if (estimateWidth(phrase, fs) <= safeW) {
      return { fontSize: fs, numberOfLines: 1, allowWrap: false };
    }
  }

  // ── R5: single word, impossible even at hard min — clamp + allow wrap ─────
  return {
    fontSize: FONT_HARD_MIN,
    numberOfLines: maxLinesFor(availH, FONT_HARD_MIN),
    allowWrap: true,
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface PlayingCardProps {
  currentCard: any;
  flashState: CardFlashState;
  mode: string;
  displayTime: number;
  timerDuration: number;
  onAction?: (action: "guessed" | "passed") => void;
  showButtons?: boolean;
}

// ─── Timer Pill ───────────────────────────────────────────────────────────────

function TimerPill({
  displayTime,
  timerDuration,
  labelColor,
}: {
  displayTime: number;
  timerDuration: number;
  labelColor: string;
}) {
  const pct = displayTime / timerDuration;
  const isLow = pct <= 0.25;
  const isMid = pct <= 0.5;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isLow) {
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.18,
            duration: 380,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 380,
            useNativeDriver: true,
          }),
        ]),
      );
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
      pulseAnim.setValue(1);
    }
    return () => loopRef.current?.stop();
  }, [isLow]);

  const timerColor = isLow ? "#fca5a5" : isMid ? "#fcd34d" : labelColor;

  return (
    <Animated.View
      style={[
        styles.timerPill,
        {
          borderColor: isLow
            ? "rgba(252,165,165,0.45)"
            : "rgba(255,255,255,0.14)",
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      <LucideIcons.Timer size={12} color={timerColor} strokeWidth={2.5} />
      <Text style={[styles.timerText, { color: timerColor }]}>
        {displayTime}
      </Text>
    </Animated.View>
  );
}

// ─── Taboo Words ──────────────────────────────────────────────────────────

function TabooWordsList({
  words,
  accentColor,
}: {
  words: string[];
  accentColor: string;
}) {
  return (
    <View style={styles.tabooContainer}>
      <View style={styles.tabooHeader}>
        <LucideIcons.Ban
          size={10}
          color="rgba(255,255,255,0.4)"
          strokeWidth={2.5}
        />
        <Text style={styles.tabooHeaderText}>DO NOT SAY</Text>
        <LucideIcons.Ban
          size={10}
          color="rgba(255,255,255,0.4)"
          strokeWidth={2.5}
        />
      </View>
      {words.slice(0, 5).map((w, i) => (
        <View key={i} style={styles.tabooWordRow}>
          <View
            style={[styles.tabooWordBullet, { backgroundColor: accentColor }]}
          />
          <Text style={styles.tabooWordText} numberOfLines={1}>
            {w.toUpperCase()}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── Action Buttons ───────────────────────────────────────────────────────────

function CardActionButtons({
  onAction,
  innerBorder,
}: {
  onAction: (action: "guessed" | "passed") => void;
  innerBorder: string;
}) {
  return (
    <View style={[styles.buttonRow, { borderTopColor: innerBorder }]}>
      <TouchableOpacity
        onPress={() => onAction("passed")}
        activeOpacity={0.7}
        style={[styles.actionBtn, styles.passBtn]}
      >
        <LucideIcons.ArrowRight size={18} color="#fed7aa" strokeWidth={2.5} />
        <Text style={styles.passBtnText}>pass</Text>
      </TouchableOpacity>

      <View style={[styles.btnDivider, { backgroundColor: innerBorder }]} />

      <TouchableOpacity
        onPress={() => onAction("guessed")}
        activeOpacity={0.7}
        style={[styles.actionBtn, styles.gotItBtn]}
      >
        <LucideIcons.Check size={18} color="#bbf7d0" strokeWidth={2.5} />
        <Text style={styles.gotItBtnText}>got it!</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Adaptive Word Display ────────────────────────────────────────────────────

interface AdaptiveWordDisplayProps {
  word: string;
  showTabooWords: boolean;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  accentColor: string;
  tabooWords: string[];
  innerBorder: string;
}

function AdaptiveWordDisplay({
  word,
  showTabooWords,
  fadeAnim,
  slideAnim,
  accentColor,
  tabooWords,
  innerBorder,
}: AdaptiveWordDisplayProps) {
  const [faceLayout, setFaceLayout] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [tabooHeight, setTabooHeight] = useState(0);

  const handleFaceLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) setFaceLayout({ width, height });
  }, []);

  const handleTabooLayout = useCallback((e: LayoutChangeEvent) => {
    setTabooHeight(e.nativeEvent.layout.height);
  }, []);

  const GAP = showTabooWords ? 24 : 0;
  const availH = faceLayout
    ? Math.max(0, faceLayout.height - tabooHeight - GAP)
    : 0;
  const availW = faceLayout?.width ?? 0;

  const sizing = useMemo(
    () => computeWordLayout(word, availW, availH),
    [word, availW, availH],
  );

  return (
    <View style={styles.adaptiveContainer} onLayout={handleFaceLayout}>
      {/*
        Inner cluster: phrase + doNotSay sit together, centred in the
        full face area. We don't stretch either child — they take only
        the height they need, and flexbox centres the pair vertically.
      */}
      <View style={styles.clusterWrapper}>
        <Animated.View
          style={[
            styles.wordAnimWrapper,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text
            style={[
              styles.mainWord,
              {
                fontSize: sizing.fontSize,
                lineHeight: lineHeightAt(sizing.fontSize),
              },
            ]}
            numberOfLines={sizing.numberOfLines}
            adjustsFontSizeToFit={false}
            lineBreakMode={sizing.allowWrap ? "tail" : "clip"}
          >
            {word}
          </Text>
        </Animated.View>

        {showTabooWords && (
          <View style={styles.tabooRegion} onLayout={handleTabooLayout}>
            <View
              style={[styles.wordDivider, { backgroundColor: innerBorder }]}
            />
            <TabooWordsList words={tabooWords} accentColor={accentColor} />
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PlayingCard({
  currentCard,
  flashState,
  mode,
  displayTime,
  timerDuration,
  onAction,
  showButtons = false,
}: PlayingCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const prevFlashRef = useRef<CardFlashState>("default");
  const prevWordRef = useRef<string>("");

  useEffect(() => {
    if (flashState !== prevFlashRef.current) {
      Animated.spring(scaleAnim, {
        toValue: flashState !== "default" ? 0.975 : 1,
        friction: flashState !== "default" ? 7 : 5,
        tension: flashState !== "default" ? 220 : 180,
        useNativeDriver: true,
      }).start();
      prevFlashRef.current = flashState;
    }
  }, [flashState]);

  useEffect(() => {
    if (currentCard?.word && currentCard.word !== prevWordRef.current) {
      slideAnim.setValue(22);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      prevWordRef.current = currentCard.word;
    }
  }, [currentCard?.word]);

  const cardTheme = resolveCardTheme(mode, flashState);
  const { card: baseCardTheme, meta } = getModeTheme(mode);

  let tabooWords: string[] = [];
  if (meta.showsTabooWords && currentCard?.tabooWords) {
    try {
      // DB stores it as a JSON string, but we handle it just in case it's passed as an array
      tabooWords =
        typeof currentCard.tabooWords === "string"
          ? JSON.parse(currentCard.tabooWords)
          : currentCard.tabooWords;
    } catch {
      /* empty */
    }
  }
  const showTabooWords = tabooWords.length > 0 && flashState === "default";

  const ModeIcon = meta.Icon;

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          transform: [{ scale: scaleAnim }],
          shadowColor: cardTheme.shadowColor,
        },
      ]}
    >
      <View
        style={[
          styles.cardShadowBase,
          { backgroundColor: cardTheme.shadowColor },
        ]}
      />

      <LinearGradient
        colors={[cardTheme.gradientTop, cardTheme.gradientBottom] as any}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={styles.cardBody}
      >
        <LinearGradient
          colors={["rgba(255,255,255,0.11)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.cardShine}
          pointerEvents="none"
        />

        <View style={[styles.cardFace, { borderColor: cardTheme.innerBorder }]}>
          <View
            style={[
              styles.cornerLabelLeft,
              { borderColor: "rgba(255,255,255,0.1)", display: "none" },
            ]}
          >
            <ModeIcon
              size={11}
              color={baseCardTheme.labelColor}
              strokeWidth={2.5}
            />
            <Text
              style={[styles.modeLabel, { color: baseCardTheme.labelColor }]}
            >
              {baseCardTheme.label}
            </Text>
          </View>

          <View style={styles.cornerTimerRight}>
            <TimerPill
              displayTime={displayTime}
              timerDuration={timerDuration}
              labelColor={baseCardTheme.labelColor}
            />
          </View>

          {flashState === "pass" ? (
            <View style={styles.flashStateContainer}>
              <LucideIcons.ArrowRight
                size={48}
                color="rgba(255,255,255,0.25)"
                strokeWidth={1.5}
              />
              <Text style={styles.flashStateText}>PASS</Text>
              <Text style={styles.flashStateSubText}>Moving on...</Text>
            </View>
          ) : flashState === "done" ? (
            <View style={styles.flashStateContainer}>
              <LucideIcons.CheckCircle
                size={48}
                color="rgba(255,255,255,0.25)"
                strokeWidth={1.5}
              />
              <Text style={styles.flashStateText}>CORRECT!</Text>
              <Text style={styles.flashStateSubText}>Nice one!</Text>
            </View>
          ) : (
            <AdaptiveWordDisplay
              word={currentCard?.word ?? ""}
              showTabooWords={showTabooWords}
              fadeAnim={fadeAnim}
              slideAnim={slideAnim}
              accentColor={cardTheme.accentColor}
              tabooWords={tabooWords}
              innerBorder={cardTheme.innerBorder}
            />
          )}
        </View>

        {showButtons && onAction && flashState === "default" && (
          <CardActionButtons
            onAction={onAction}
            innerBorder={cardTheme.innerBorder}
          />
        )}
      </LinearGradient>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  cardWrapper: {
    flex: 1,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 32,
    elevation: 24,
  },
  cardShadowBase: {
    position: "absolute",
    bottom: -8,
    left: 12,
    right: 12,
    height: "100%",
    borderRadius: 28,
    opacity: 0.3,
  },
  cardBody: {
    flex: 1,
    borderRadius: 24,
    padding: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  cardShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "42%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  cardFace: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingTop: 52, // clears the absolutely-positioned corner pills
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "rgba(0,0,0,0.18)",
    overflow: "hidden",
  },
  cornerLabelLeft: {
    position: "absolute",
    top: 12,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    zIndex: 2,
  },
  cornerTimerRight: {
    position: "absolute",
    top: 10,
    right: 12,
    zIndex: 2,
  },
  modeLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  timerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  timerText: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  flashStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  flashStateText: {
    color: "#ffffff",
    fontSize: 54,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
  },
  flashStateSubText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 1,
  },
  adaptiveContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  clusterWrapper: {
    width: "100%",
    alignItems: "center",
    gap: 24,
  },
  wordAnimWrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  mainWord: {
    color: "#ffffff",
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -1,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    flexShrink: 0,
  },
  tabooRegion: {
    width: "100%",
    alignItems: "center",
    flexShrink: 0,
  },
  wordDivider: {
    width: "55%",
    height: 1.5,
    borderRadius: 1,
    marginBottom: 14,
  },
  tabooContainer: {
    width: "100%",
    alignItems: "center",
    gap: 5,
  },
  tabooHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  tabooHeaderText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2.5,
  },
  tabooWordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 8,
    width: "82%",
    justifyContent: "center",
  },
  tabooWordBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.65,
  },
  tabooWordText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1.5,
    textDecorationLine: "line-through",
    textDecorationColor: "rgba(255,255,255,0.35)",
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 14,
    borderTopWidth: 1.5,
    borderRadius: 16,
    overflow: "hidden",
    height: 72,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  passBtn: { borderBottomLeftRadius: 16 },
  gotItBtn: { borderBottomRightRadius: 16 },
  btnDivider: {
    width: 1.5,
    marginVertical: 12,
  },
  passBtnText: {
    color: "#fed7aa",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  gotItBtnText: {
    color: "#bbf7d0",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
