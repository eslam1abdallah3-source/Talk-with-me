import React, { useState } from "react";

// Central Level & Tier definitions with associated metadata, badges, and colors
export const LEVEL_DEFINITIONS = {
  Beginner: {
    name: "Beginner",
    icon: "🌱",
    badge: "🥉",
    color: "#f59e0b", // Bronze/Amber
    bgColor: "rgba(245, 158, 11, 0.1)",
    borderColor: "rgba(245, 158, 11, 0.35)",
    textShadow: "0 0 10px rgba(245, 158, 11, 0.2)",
    rank: "Tier I • Explorer",
    desc: "Embarking on the English journey. Focuses on building basic vocabulary, active listening, and simple phrases.",
    targetMins: 0,
    nextTier: "Intermediate"
  },
  Intermediate: {
    name: "Intermediate",
    icon: "🌿",
    badge: "🥈",
    color: "#94a3b8", // Silver/Slate
    bgColor: "rgba(148, 163, 184, 0.12)",
    borderColor: "rgba(148, 163, 184, 0.4)",
    textShadow: "0 0 10px rgba(148, 163, 184, 0.2)",
    rank: "Tier II • Communicator",
    desc: "Comfortable speaking on everyday topics. Ready to polish accents, correct syntax, and expand daily idioms.",
    targetMins: 15,
    nextTier: "Advanced"
  },
  Advanced: {
    name: "Advanced",
    icon: "🌳",
    badge: "🥇",
    color: "#eab308", // Gold/Yellow
    bgColor: "rgba(234, 179, 8, 0.1)",
    borderColor: "rgba(234, 179, 8, 0.35)",
    textShadow: "0 0 12px rgba(234, 179, 8, 0.25)",
    rank: "Tier III • Scholar",
    desc: "Highly precise, expressive, and fluent. Capable of discussing complex ideas, business environments, and literature.",
    targetMins: 60,
    nextTier: "Native"
  },
  Native: {
    name: "Native",
    icon: "👑",
    badge: "💎",
    color: "#c084fc", // Amethyst Purple
    bgColor: "rgba(192, 132, 252, 0.14)",
    borderColor: "rgba(192, 132, 252, 0.4)",
    textShadow: "0 0 15px rgba(192, 132, 252, 0.35)",
    rank: "Tier IV • Paragon",
    desc: "Fluent or bilingual mastery. Seamless communication with high clarity, precise word choice, and effortless speed.",
    targetMins: 180,
    nextTier: null
  }
};

/**
 * Returns level config, falling back gracefully to Intermediate if invalid
 */
export const getLevelConfig = (levelName) => {
  if (!levelName) return LEVEL_DEFINITIONS.Intermediate;
  
  // Try exact match or title case match
  const normalized = levelName.charAt(0).toUpperCase() + levelName.slice(1).toLowerCase();
  return LEVEL_DEFINITIONS[normalized] || LEVEL_DEFINITIONS.Intermediate;
};

/**
 * Inline Level Badge component to easily display tier labels with icons next to usernames
 */
export function SimpleLevelBadge({ level, style = {} }) {
  const config = getLevelConfig(level);
  
  const badgeStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "3px 8px",
    borderRadius: "8px",
    fontSize: "11px",
    fontWeight: "700",
    backgroundColor: config.bgColor,
    border: `1px solid ${config.borderColor}`,
    color: config.color,
    textTransform: "uppercase",
    letterSpacing: "0.3px",
    boxShadow: `0 2px 6px ${config.bgColor}`,
    ...style
  };

  return (
    <span style={badgeStyle} title={`English Level Rank: ${config.name}`}>
      <span>{config.badge}</span>
      <span>{config.name}</span>
    </span>
  );
}

/**
 * LevelProgressCard Component
 * Displays user's current English proficiency tier, details their ranking status, and
 * visualizes the milestone track towards the next linguistic tier based on practice logs.
 */
export default function LevelProgressCard({ currentLevel = "Intermediate", practiceLogs = {} }) {
  const [showRankDetails, setShowRankDetails] = useState(false);

  const config = getLevelConfig(currentLevel);

  // Compute total practice duration in minutes
  const totalPracticeMinutes = Object.values(practiceLogs || {}).reduce(
    (acc, curr) => acc + (typeof curr === "number" ? curr : 0),
    0
  );

  // Calculate progress toward the next tier milestone
  let progressPct = 100;
  let labelText = "Max Tier Achieved!";
  let minsRemaining = 0;

  if (config.nextTier) {
    const nextConfig = LEVEL_DEFINITIONS[config.nextTier];
    const base = config.targetMins;
    const target = nextConfig.targetMins;
    
    // Relative progress between current base target and next target
    const numerator = Math.max(0, totalPracticeMinutes - base);
    const denominator = target - base;
    
    progressPct = Math.min(100, Math.round((numerator / denominator) * 100));
    minsRemaining = Math.max(0, target - totalPracticeMinutes);
    labelText = `${progressPct}% to ${config.nextTier}`;
  }

  const styles = {
    container: {
      backgroundColor: "#0f172a",
      border: "1px solid #334155",
      borderRadius: "20px",
      padding: "20px",
      marginBottom: "28px",
      boxSizing: "border-box"
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "16px",
      borderBottom: "1px solid #1e293b",
      paddingBottom: "10px"
    },
    headerTitleRow: {
      display: "flex",
      alignItems: "center",
      gap: "8px"
    },
    title: {
      fontSize: "15px",
      fontWeight: "700",
      color: "#f8fafc",
      margin: 0
    },
    infoLink: {
      color: "#38bdf8",
      fontSize: "12px",
      fontWeight: "600",
      cursor: "pointer",
      textDecoration: "none"
    },
    glowingCard: {
      background: `linear-gradient(135deg, #1e293b 0%, ${config.bgColor} 100%)`,
      border: `1.5px solid ${config.borderColor}`,
      borderRadius: "16px",
      padding: "16px",
      boxShadow: `0 4px 15px ${config.bgColor}`,
      display: "flex",
      alignItems: "center",
      gap: "16px",
      marginBottom: "20px",
      position: "relative",
      overflow: "hidden"
    },
    bigBadge: {
      fontSize: "44px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      filter: `drop-shadow(0 4px 12px ${config.color})`,
      width: "64px",
      height: "64px",
      borderRadius: "16px",
      backgroundColor: "rgba(15, 23, 42, 0.6)",
      border: `1px solid ${config.borderColor}`
    },
    metaBlock: {
      flex: 1
    },
    tierName: {
      fontSize: "18px",
      fontWeight: "900",
      color: "#ffffff",
      margin: "0 0 2px 0",
      display: "flex",
      alignItems: "center",
      gap: "8px"
    },
    rankSubtitle: {
      fontSize: "11px",
      fontWeight: "700",
      color: config.color,
      textTransform: "uppercase",
      letterSpacing: "1px"
    },
    descText: {
      fontSize: "12px",
      color: "#94a3b8",
      lineHeight: "1.5",
      margin: "12px 0 0 0"
    },
    milestoneBlock: {
      backgroundColor: "rgba(15, 23, 42, 0.4)",
      border: "1px solid #1e293b",
      borderRadius: "12px",
      padding: "12px 14px"
    },
    milestoneHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: "11px",
      color: "#94a3b8",
      fontWeight: "600",
      marginBottom: "8px"
    },
    progressBarTrack: {
      height: "6px",
      width: "100%",
      backgroundColor: "#0f172a",
      borderRadius: "3px",
      overflow: "hidden",
      marginBottom: "6px"
    },
    progressBarFill: {
      height: "100%",
      width: `${progressPct}%`,
      backgroundColor: config.color,
      borderRadius: "3px",
      transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
    },
    milestoneFooter: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: "10px",
      color: "#64748b"
    },
    tierTimeline: {
      marginTop: "20px",
      borderTop: "1px solid #1e293b",
      paddingTop: "16px"
    },
    timelineTitle: {
      fontSize: "12px",
      fontWeight: "700",
      color: "#38bdf8",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      marginBottom: "12px"
    },
    timelineRow: {
      display: "flex",
      flexDirection: "column",
      gap: "10px"
    },
    timelineItem: (isCurrent, isUnlocked) => ({
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "10px 12px",
      borderRadius: "10px",
      backgroundColor: isCurrent 
        ? "rgba(56, 189, 248, 0.08)" 
        : isUnlocked 
          ? "rgba(30, 41, 59, 0.3)" 
          : "transparent",
      border: isCurrent 
        ? "1px solid rgba(56, 189, 248, 0.3)" 
        : "1px solid transparent"
    }),
    timelineBadge: (isUnlocked) => ({
      fontSize: "20px",
      opacity: isUnlocked ? 1 : 0.35,
      filter: isUnlocked ? "none" : "grayscale(100%)"
    }),
    timelineMeta: {
      flex: 1
    },
    timelineName: (isUnlocked) => ({
      fontSize: "12px",
      fontWeight: "700",
      color: isUnlocked ? "#ffffff" : "#64748b",
      margin: 0,
      display: "flex",
      alignItems: "center",
      gap: "6px"
    }),
    timelineReq: {
      fontSize: "10px",
      color: "#64748b",
      margin: "1px 0 0 0"
    },
    currentIndicator: {
      backgroundColor: "#38bdf8",
      color: "#0f172a",
      fontSize: "8px",
      fontWeight: "800",
      padding: "1px 5px",
      borderRadius: "4px",
      textTransform: "uppercase"
    }
  };

  const levelsArray = Object.keys(LEVEL_DEFINITIONS);

  return (
    <div style={styles.container} aria-label="English Proficiency Tier Ranking System Dashboard">
      <div style={styles.header}>
        <div style={styles.headerTitleRow}>
          <span>🗣️</span>
          <h3 style={styles.title}>Proficiency Ranking</h3>
        </div>
        <span 
          style={styles.infoLink} 
          onClick={() => setShowRankDetails(!showRankDetails)}
          title="Toggle English circle rank breakdown list"
        >
          {showRankDetails ? "Hide Tiers" : "Compare Tiers"}
        </span>
      </div>

      <div style={styles.glowingCard}>
        <div style={styles.bigBadge}>
          {config.badge}
        </div>
        <div style={styles.metaBlock}>
          <span style={styles.rankSubtitle}>{config.rank}</span>
          <h4 style={styles.tierName}>
            {config.name} {config.icon}
          </h4>
          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>
            Total Speak Time: {parseFloat(totalPracticeMinutes.toFixed(1))} mins
          </span>
        </div>
      </div>

      <p style={{ ...styles.descText, margin: "0 0 16px 0" }}>{config.desc}</p>

      {/* Progress Milestone to next rank */}
      <div style={styles.milestoneBlock}>
        <div style={styles.milestoneHeader}>
          <span>Linguistic Progress Level</span>
          <span style={{ color: config.color }}>{labelText}</span>
        </div>
        <div style={styles.progressBarTrack}>
          <div style={styles.progressBarFill} />
        </div>
        <div style={styles.milestoneFooter}>
          <span>{config.targetMins}m recommended base</span>
          {config.nextTier ? (
            <span>{minsRemaining.toFixed(1)}m more to hit Advanced milestones</span>
          ) : (
            <span>Mastery Confirmed</span>
          )}
        </div>
      </div>

      {/* Tier comparisons timeline list */}
      {showRankDetails && (
        <div style={styles.tierTimeline}>
          <h4 style={styles.timelineTitle}>Linguistic Rank Hierarchy</h4>
          <div style={styles.timelineRow}>
            {levelsArray.map((lvl) => {
              const itemConfig = LEVEL_DEFINITIONS[lvl];
              const isCurrent = lvl.toLowerCase() === currentLevel.toLowerCase();
              
              // Estimate if "unlocked" either by choosing it or having practice logs exceeding its benchmark
              const isUnlocked = isCurrent || totalPracticeMinutes >= itemConfig.targetMins;

              return (
                <div key={lvl} style={styles.timelineItem(isCurrent, isUnlocked)}>
                  <span style={styles.timelineBadge(isUnlocked)}>
                    {itemConfig.badge}
                  </span>
                  <div style={styles.metaBlock}>
                    <h5 style={styles.timelineName(isUnlocked)}>
                      {itemConfig.name} {itemConfig.icon}
                      {isCurrent && <span style={styles.currentIndicator}>Active</span>}
                    </h5>
                    <p style={styles.timelineReq}>
                      Benchmark: {itemConfig.targetMins} mins speak time • {itemConfig.rank.split(" • ")[1]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
