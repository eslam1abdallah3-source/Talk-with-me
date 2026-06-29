import React, { useState } from "react";
import { BADGE_DEFINITIONS } from "./databaseService";

/**
 * BadgesModule Component
 * Displays a list of virtual achievements, highlighting unlocked items in rich color
 * and showing active progress meters for locked milestones.
 *
 * @param {Object} props
 * @param {Array<string>} props.badges - List of unlocked badge IDs from user document
 * @param {Object} props.practiceLogs - Map of YYYY-MM-DD -> minutes from user profile
 * @param {number} props.currentStreak - User's current learning streak in days
 * @param {number} props.longestStreak - User's longest learning streak in days
 */
export default function BadgesModule({ badges = [], practiceLogs = {}, currentStreak = 0, longestStreak = 0 }) {
  const [selectedBadge, setSelectedBadge] = useState(null);

  // Compute total practice duration
  const totalPracticeMinutes = Object.values(practiceLogs || {}).reduce(
    (acc, curr) => acc + (typeof curr === "number" ? curr : 0),
    0
  );

  const maxStreak = Math.max(currentStreak || 0, longestStreak || 0);
  const unlockedCount = badges.length;
  const totalCount = BADGE_DEFINITIONS.length;

  // Helper to calculate progress info
  const getBadgeProgress = (badge) => {
    const isUnlocked = badges.includes(badge.id);
    let current = 0;
    
    if (badge.category === "duration") {
      current = parseFloat(totalPracticeMinutes.toFixed(1));
    } else if (badge.category === "streak") {
      current = maxStreak;
    }

    const target = badge.target;
    const percent = Math.min(100, Math.round((current / target) * 100));

    return {
      isUnlocked,
      current,
      target,
      percent,
      remaining: Math.max(0, parseFloat((target - current).toFixed(1)))
    };
  };

  const handleBadgeClick = (badge) => {
    const progress = getBadgeProgress(badge);
    setSelectedBadge({
      ...badge,
      ...progress
    });
  };

  const styles = {
    moduleContainer: {
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
    titleWrapper: {
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
    badgeCount: {
      backgroundColor: "rgba(56, 189, 248, 0.15)",
      color: "#38bdf8",
      fontSize: "12px",
      fontWeight: "700",
      padding: "3px 10px",
      borderRadius: "12px"
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "12px",
      marginBottom: "16px"
    },
    badgeCard: (isUnlocked) => ({
      backgroundColor: isUnlocked ? "rgba(30, 41, 59, 0.7)" : "rgba(30, 41, 59, 0.3)",
      border: isUnlocked ? "1.5px solid rgba(56, 189, 248, 0.4)" : "1px solid #1e293b",
      borderRadius: "16px",
      padding: "14px 10px",
      textAlign: "center",
      cursor: "pointer",
      transition: "all 0.2s ease",
      boxShadow: isUnlocked ? "0 4px 12px rgba(56, 189, 248, 0.08)" : "none",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "110px",
      userSelect: "none"
    }),
    iconWrapper: (isUnlocked) => ({
      fontSize: "30px",
      marginBottom: "8px",
      filter: isUnlocked 
        ? "drop-shadow(0 2px 8px rgba(56, 189, 248, 0.3))" 
        : "grayscale(90%) contrast(80%)",
      opacity: isUnlocked ? 1 : 0.4,
      transform: isUnlocked ? "scale(1.05)" : "scale(1)"
    }),
    badgeLabel: (isUnlocked) => ({
      fontSize: "11px",
      fontWeight: "700",
      color: isUnlocked ? "#f1f5f9" : "#64748b",
      margin: 0,
      lineHeight: "1.3",
      wordBreak: "break-word"
    }),
    unlockedCheck: {
      position: "absolute",
      top: "6px",
      right: "6px",
      fontSize: "10px",
      backgroundColor: "#10b981",
      color: "#ffffff",
      borderRadius: "50%",
      width: "14px",
      height: "14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "900"
    },
    detailBox: {
      backgroundColor: "#1e293b",
      border: "1px solid #334155",
      borderRadius: "14px",
      padding: "16px",
      animation: "slideUp 0.2s ease-out"
    },
    detailHeader: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "10px"
    },
    detailIcon: {
      fontSize: "36px"
    },
    detailTitleRow: {
      flex: 1
    },
    detailTitle: {
      fontSize: "14px",
      fontWeight: "800",
      color: "#ffffff",
      margin: 0
    },
    statusBadge: (isUnlocked) => ({
      display: "inline-block",
      fontSize: "10px",
      fontWeight: "700",
      padding: "2px 8px",
      borderRadius: "6px",
      textTransform: "uppercase",
      marginTop: "4px",
      backgroundColor: isUnlocked ? "rgba(16, 185, 129, 0.15)" : "rgba(100, 116, 139, 0.15)",
      color: isUnlocked ? "#10b981" : "#94a3b8"
    }),
    detailDesc: {
      fontSize: "12px",
      color: "#94a3b8",
      lineHeight: "1.5",
      margin: "0 0 12px 0"
    },
    progressInfo: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: "11px",
      color: "#cbd5e1",
      marginBottom: "6px",
      fontWeight: "600"
    },
    progressTrack: {
      width: "100%",
      height: "8px",
      backgroundColor: "#0f172a",
      borderRadius: "4px",
      overflow: "hidden",
      marginBottom: "4px"
    },
    progressFill: (percent, isUnlocked) => ({
      height: "100%",
      width: `${percent}%`,
      backgroundColor: isUnlocked ? "#10b981" : "#38bdf8",
      borderRadius: "4px",
      transition: "width 0.4s ease"
    }),
    progressSubText: {
      fontSize: "10px",
      color: "#64748b",
      margin: 0,
      textAlign: "right"
    }
  };

  return (
    <div style={styles.moduleContainer} aria-label="Virtual Badges Achievements Panel">
      <div style={styles.header}>
        <div style={styles.titleWrapper}>
          <span>🏆</span>
          <h3 style={styles.title}>Virtual Badges</h3>
        </div>
        <span style={styles.badgeCount}>
          {unlockedCount} / {totalCount} Earned
        </span>
      </div>

      <div style={styles.grid}>
        {BADGE_DEFINITIONS.map((badge) => {
          const progress = getBadgeProgress(badge);
          const isSelected = selectedBadge?.id === badge.id;

          return (
            <div
              key={badge.id}
              style={{
                ...styles.badgeCard(progress.isUnlocked),
                position: "relative",
                transform: isSelected ? "translateY(-2px)" : "none",
                borderColor: isSelected ? "#38bdf8" : (progress.isUnlocked ? "rgba(56, 189, 248, 0.4)" : "#1e293b")
              }}
              onClick={() => handleBadgeClick(badge)}
              title={`${badge.name}: ${progress.isUnlocked ? "Unlocked!" : "Locked"}`}
            >
              {progress.isUnlocked && (
                <div style={styles.unlockedCheck} title="Unlocked">✓</div>
              )}
              <div style={styles.iconWrapper(progress.isUnlocked)}>
                {badge.icon}
              </div>
              <h4 style={styles.badgeLabel(progress.isUnlocked)}>
                {badge.name}
              </h4>
            </div>
          );
        })}
      </div>

      {selectedBadge ? (
        <div style={styles.detailBox}>
          <div style={styles.detailHeader}>
            <span style={styles.detailIcon}>{selectedBadge.icon}</span>
            <div style={styles.detailTitleRow}>
              <h4 style={styles.detailTitle}>{selectedBadge.name}</h4>
              <span style={styles.statusBadge(selectedBadge.isUnlocked)}>
                {selectedBadge.isUnlocked ? "✓ Unlocked Achievement" : "Locked Milestone"}
              </span>
            </div>
          </div>
          <p style={styles.detailDesc}>{selectedBadge.description}</p>
          
          <div style={styles.progressInfo}>
            <span>Requirement Progress</span>
            <span>
              <strong>{selectedBadge.current}</strong> / {selectedBadge.target} {selectedBadge.unit}
            </span>
          </div>
          
          <div style={styles.progressTrack}>
            <div style={styles.progressFill(selectedBadge.percent, selectedBadge.isUnlocked)} />
          </div>

          {!selectedBadge.isUnlocked && (
            <p style={styles.progressSubText}>
              Practice {selectedBadge.remaining} {selectedBadge.unit} more to earn this badge!
            </p>
          )}
        </div>
      ) : (
        <p style={{ fontSize: "12px", color: "#64748b", margin: 0, textAlign: "center", fontStyle: "italic" }}>
          Click on any badge above to view milestone goals and current progress!
        </p>
      )}
    </div>
  );
}
