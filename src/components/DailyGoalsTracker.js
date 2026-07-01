import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import { addPracticeMinutes, updateDailyGoal } from "../services/databaseService";

/**
 * DailyGoalsTracker Component
 * Real-time daily English practice goals tracking & streak visualization.
 * Offers customizable goals, manual practice logging, and a 7-day visual consistency log.
 *
 * @param {Object} props
 * @param {string} props.userId - Authenticated user's ID
 */
export default function DailyGoalsTracker({ userId }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Interaction/UI states
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [newGoal, setNewGoal] = useState(15);
  const [showLogManual, setShowLogManual] = useState(false);
  const [manualMinutes, setManualMinutes] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);
  const [savingManual, setSavingManual] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Real-time Firestore document sync
  useEffect(() => {
    if (!userId) return;

    const userRef = doc(db, "users", userId);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setProfile(data);
        if (data.dailyGoal) {
          setNewGoal(data.dailyGoal);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Error listening to user goal stats:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  if (loading) {
    return (
      <div style={styles.cardSkeleton}>
        <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>Loading daily progress...</p>
      </div>
    );
  }

  // Extract practice stats with smart fallbacks
  const dailyGoal = profile?.dailyGoal || 15; // default 15 minutes
  const practiceLogs = profile?.practiceLogs || {};
  const currentStreak = profile?.currentStreak || 0;
  const longestStreak = profile?.longestStreak || 0;

  const todayStr = new Date().toLocaleDateString("en-CA");
  const todayMinutes = practiceLogs[todayStr] || 0;
  const todayProgress = Math.min(100, Math.round((todayMinutes / dailyGoal) * 100));

  // Determine encouragement message
  let motivationText = "Let's start practicing to keep your streak alive!";
  if (todayMinutes >= dailyGoal) {
    motivationText = "🎉 Daily Goal Achieved! Excellent work today!";
  } else if (todayMinutes > 0) {
    motivationText = `Only ${Math.ceil(dailyGoal - todayMinutes)} more minutes to reach your daily goal!`;
  }

  // Generate 7-day consistency chart logs (going back from today)
  const getLast7Days = () => {
    const list = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-CA");
      const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" }).charAt(0); // M, T, W, T, F, S, S
      const mins = practiceLogs[dateStr] || 0;
      const metGoal = mins >= dailyGoal && dailyGoal > 0;
      list.push({
        dateStr,
        dayLabel,
        mins,
        metGoal,
        isToday: dateStr === todayStr
      });
    }
    return list;
  };

  const last7Days = getLast7Days();

  // Submit Daily Goal update
  const handleSaveGoal = async (e) => {
    e.preventDefault();
    const parsed = parseInt(newGoal, 10);
    if (isNaN(parsed) || parsed <= 0) {
      setErrorMsg("Goal must be a positive number.");
      return;
    }
    setSavingGoal(true);
    setErrorMsg("");
    try {
      await updateDailyGoal(userId, parsed);
      setShowGoalEditor(false);
    } catch (e) {
      setErrorMsg("Failed to save goal.");
    } finally {
      setSavingGoal(false);
    }
  };

  // Submit Manual Minutes log
  const handleLogManual = async (e) => {
    e.preventDefault();
    const parsed = parseFloat(manualMinutes);
    if (isNaN(parsed) || parsed <= 0 || parsed > 480) {
      setErrorMsg("Please enter a valid amount of minutes (0 to 480).");
      return;
    }
    setSavingManual(true);
    setErrorMsg("");
    try {
      await addPracticeMinutes(userId, parsed);
      setManualMinutes("");
      setShowLogManual(false);
    } catch (e) {
      setErrorMsg("Failed to log practice minutes.");
    } finally {
      setSavingManual(false);
    }
  };

  return (
    <section style={styles.trackerContainer} aria-label="Daily Goals and Streaks Progress">
      
      {/* Streak Header Header */}
      <div style={styles.headerRow}>
        <div style={styles.streakWrapper}>
          <span style={styles.flameIcon}>🔥</span>
          <div>
            <h4 style={styles.streakCount}>{currentStreak} Day Streak</h4>
            <p style={styles.streakSubtitle}>Longest: {longestStreak} days</p>
          </div>
        </div>

        <div style={styles.actionsGroup}>
          <button
            style={styles.actionBtn("manual")}
            onClick={() => {
              setErrorMsg("");
              setShowLogManual(!showLogManual);
              setShowGoalEditor(false);
            }}
            title="Log study time manually"
          >
            + Log Time
          </button>
          <button
            style={styles.actionBtn("goal")}
            onClick={() => {
              setErrorMsg("");
              setShowGoalEditor(!showGoalEditor);
              setShowLogManual(false);
            }}
            title="Adjust daily practice goal"
          >
            ⚙️ Target
          </button>
        </div>
      </div>

      {/* Manual log form inline overlay */}
      {showLogManual && (
        <form onSubmit={handleLogManual} style={styles.inlineForm}>
          <h5 style={styles.formTitle}>Add Self-Study or Chat Practice</h5>
          <div style={styles.inputRow}>
            <input
              type="number"
              step="any"
              style={styles.formInput}
              placeholder="Minutes (e.g. 15)"
              value={manualMinutes}
              onChange={(e) => setManualMinutes(e.target.value)}
              disabled={savingManual}
              required
            />
            <button type="submit" style={styles.btnSubmit} disabled={savingManual}>
              {savingManual ? "Saving..." : "Log"}
            </button>
          </div>
          {errorMsg && <p style={styles.errorText}>{errorMsg}</p>}
        </form>
      )}

      {/* Goal editor form inline overlay */}
      {showGoalEditor && (
        <form onSubmit={handleSaveGoal} style={styles.inlineForm}>
          <h5 style={styles.formTitle}>Set Daily English Practice Goal</h5>
          <div style={styles.inputRow}>
            <select
              style={styles.formSelect}
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              disabled={savingGoal}
            >
              <option value="5">5 minutes (Casual)</option>
              <option value="15">15 minutes (Regular)</option>
              <option value="30">30 minutes (Serious)</option>
              <option value="60">60 minutes (Intensive)</option>
            </select>
            <button type="submit" style={styles.btnSubmit} disabled={savingGoal}>
              {savingGoal ? "Saving..." : "Set"}
            </button>
          </div>
          {errorMsg && <p style={styles.errorText}>{errorMsg}</p>}
        </form>
      )}

      {/* Today's Practice Ring/Progress */}
      <div style={styles.progressContainer}>
        <div style={styles.progressInfo}>
          <span style={styles.progressLabel}>Today's English Circles Practice</span>
          <span style={styles.progressValues}>
            <strong>{todayMinutes}</strong> / {dailyGoal} mins
          </span>
        </div>
        <div style={styles.progressTrack}>
          <div style={styles.progressBar(todayProgress)} />
        </div>
        <p style={styles.motivationSub}>{motivationText}</p>
      </div>

      {/* 7-Day Consistency Logs */}
      <div style={styles.weekLogWrapper}>
        <h5 style={styles.weekLogHeader}>Last 7 Days Consistency</h5>
        <div style={styles.daysRow}>
          {last7Days.map((day) => {
            let circleColor = "#334155"; // Empty / Did not practice
            let borderStyle = "1px solid #475569";
            let textColor = "#94a3b8";

            if (day.mins > 0) {
              if (day.metGoal) {
                circleColor = "#10b981"; // met goal (green)
                borderStyle = "none";
                textColor = "#ffffff";
              } else {
                circleColor = "rgba(56, 189, 248, 0.2)"; // practiced but missed goal (blue outline)
                borderStyle = "1.5px solid #38bdf8";
                textColor = "#38bdf8";
              }
            }

            return (
              <div key={day.dateStr} style={styles.dayCol}>
                <div 
                  style={{
                    ...styles.dayCircle,
                    backgroundColor: circleColor,
                    border: borderStyle,
                    boxShadow: day.isToday ? "0 0 8px rgba(56, 189, 248, 0.4)" : "none"
                  }}
                  title={`${day.mins} mins practiced on ${day.dateStr}`}
                >
                  {day.mins > 0 ? (day.metGoal ? "✓" : "⚡") : ""}
                </div>
                <span style={{ 
                  ...styles.dayLabelText, 
                  color: day.isToday ? "#38bdf8" : textColor,
                  fontWeight: day.isToday ? "700" : "500"
                }}>
                  {day.dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </section>
  );
}

const styles = {
  trackerContainer: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "24px",
    padding: "24px",
    boxSizing: "border-box",
    width: "100%",
    color: "#f8fafc",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    boxShadow: "0 4px 20px rgba(0,0,0,0.25)"
  },
  cardSkeleton: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "24px",
    padding: "30px",
    textAlign: "center"
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },
  streakWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  flameIcon: {
    fontSize: "32px",
    filter: "drop-shadow(0 2px 8px rgba(239, 68, 68, 0.4))",
    animation: "flamePulse 2s infinite ease-in-out"
  },
  streakCount: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#ffffff",
    margin: 0,
    letterSpacing: "-0.5px"
  },
  streakSubtitle: {
    fontSize: "12px",
    color: "#64748b",
    margin: "2px 0 0 0"
  },
  actionsGroup: {
    display: "flex",
    gap: "8px"
  },
  actionBtn: (type) => ({
    backgroundColor: type === "manual" ? "#38bdf8" : "transparent",
    color: type === "manual" ? "#0f172a" : "#94a3b8",
    border: type === "manual" ? "none" : "1px solid #334155",
    borderRadius: "10px",
    padding: "6px 12px",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.15s ease",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  }),
  inlineForm: {
    backgroundColor: "#0f172a",
    borderRadius: "14px",
    padding: "12px 16px",
    marginBottom: "16px",
    border: "1px solid #334155",
    boxSizing: "border-box"
  },
  formTitle: {
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "1px",
    color: "#38bdf8",
    margin: "0 0 8px 0"
  },
  inputRow: {
    display: "flex",
    gap: "8px"
  },
  formInput: {
    flex: 1,
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "13px",
    padding: "6px 10px",
    outline: "none"
  },
  formSelect: {
    flex: 1,
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "13px",
    padding: "6px 10px",
    outline: "none",
    cursor: "pointer"
  },
  btnSubmit: {
    backgroundColor: "#38bdf8",
    color: "#0f172a",
    border: "none",
    borderRadius: "8px",
    padding: "6px 14px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer"
  },
  errorText: {
    fontSize: "11px",
    color: "#f87171",
    margin: "6px 0 0 0",
    fontWeight: "600"
  },
  progressContainer: {
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "20px"
  },
  progressInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px"
  },
  progressLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#94a3b8"
  },
  progressValues: {
    fontSize: "13px",
    color: "#94a3b8"
  },
  progressTrack: {
    width: "100%",
    height: "10px",
    backgroundColor: "#1e293b",
    borderRadius: "5px",
    overflow: "hidden"
  },
  progressBar: (percentage) => ({
    height: "100%",
    backgroundColor: percentage >= 100 ? "#10b981" : "#38bdf8",
    width: `${percentage}%`,
    borderRadius: "5px",
    transition: "width 0.4s ease-out"
  }),
  motivationSub: {
    fontSize: "11px",
    fontWeight: "500",
    color: "#94a3b8",
    margin: "8px 0 0 0"
  },
  weekLogWrapper: {
    marginTop: "16px"
  },
  weekLogHeader: {
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "1px",
    color: "#64748b",
    margin: "0 0 12px 0"
  },
  daysRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  dayCol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px"
  },
  dayCircle: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "700",
    color: "#ffffff"
  },
  dayLabelText: {
    fontSize: "11px",
    fontWeight: "600"
  }
};
