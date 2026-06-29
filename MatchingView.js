import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { findMatchingUser, getUserProfile } from "./databaseService";
import { SimpleLevelBadge } from "./LevelProgressCard";

/**
 * MatchingView Component
 * A visually stunning matching dashboard that allows users to find language exchange peers
 * with matching English levels and shared interests.
 * 
 * @param {Object} props
 * @param {string} props.currentUserId - Authenticated user's unique ID
 * @param {Function} props.onPartnerSelected - Triggers when a chat partner is matched and clicked (navigates to Chat)
 * @param {Function} props.onStartCall - Triggers when starting a direct WebRTC voice/video call with a matched partner
 */
export default function MatchingView({ currentUserId, onPartnerSelected, onStartCall }) {
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [matchingState, setMatchingState] = useState("idle"); // idle, searching, matched, no_match, error
  const [matchedUser, setMatchedUser] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchingProgress, setSearchingProgress] = useState(0);

  // Fetch the current user's profile to extract English level and interests
  useEffect(() => {
    if (!currentUserId) return;
    
    getUserProfile(currentUserId)
      .then((profile) => {
        if (profile) {
          setCurrentUserProfile(profile);
        } else {
          setErrorMessage("Please complete your profile in the Profile tab before matching.");
        }
      })
      .catch((err) => {
        console.error("Error loading profile for matchmaking:", err);
        setErrorMessage("Failed to retrieve profile data.");
      });
  }, [currentUserId]);

  // Simulate search progress animations
  useEffect(() => {
    let timer;
    if (matchingState === "searching") {
      setSearchingProgress(0);
      timer = setInterval(() => {
        setSearchingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            return 100;
          }
          return prev + 5;
        });
      }, 150);
    }
    return () => clearInterval(timer);
  }, [matchingState]);

  // Trigger matching algorithm
  const handleStartMatching = async () => {
    if (!currentUserProfile) {
      setErrorMessage("Waiting for profile data to load...");
      return;
    }

    setMatchingState("searching");
    setErrorMessage("");
    setMatchedUser(null);

    try {
      const level = currentUserProfile.englishLevel || "Intermediate";
      const interests = currentUserProfile.interests || [];

      // We wait for the mock/animated delay of searching progress for maximum immersion (approx 3 seconds)
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const match = await findMatchingUser(currentUserId, level, interests);

      if (match) {
        setMatchedUser(match);
        setMatchingState("matched");
      } else {
        setMatchingState("no_match");
      }
    } catch (err) {
      console.error("Matchmaking error:", err);
      setErrorMessage("Matchmaking error. Please verify Firestore indexing.");
      setMatchingState("error");
    }
  };

  const handleCancelMatching = () => {
    setMatchingState("idle");
    setSearchingProgress(0);
  };

  // Modern material dark slate styling
  const styles = {
    card: {
      maxWidth: "540px",
      margin: "40px auto",
      padding: "32px",
      borderRadius: "24px",
      backgroundColor: "#1e293b",
      color: "#f8fafc",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
      border: "1px solid #334155",
      textAlign: "center"
    },
    title: {
      fontSize: "26px",
      fontWeight: "800",
      color: "#38bdf8",
      marginBottom: "8px",
      letterSpacing: "-0.5px"
    },
    subtitle: {
      fontSize: "14px",
      color: "#94a3b8",
      marginBottom: "32px"
    },
    heroImageContainer: {
      display: "flex",
      justifyContent: "center",
      margin: "24px 0"
    },
    pulseButton: {
      width: "140px",
      height: "140px",
      borderRadius: "50%",
      backgroundColor: "rgba(56, 189, 248, 0.1)",
      border: "4px solid #38bdf8",
      color: "#38bdf8",
      fontSize: "18px",
      fontWeight: "700",
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 24px auto",
      outline: "none",
      transition: "all 0.3s",
      boxShadow: "0 0 15px rgba(56, 189, 248, 0.2)",
      animation: matchingState === "searching" ? "pulseMatch 1.5s infinite" : "none"
    },
    progressBarOuter: {
      width: "100%",
      height: "8px",
      backgroundColor: "#0f172a",
      borderRadius: "4px",
      overflow: "hidden",
      marginBottom: "16px"
    },
    progressBarInner: {
      height: "100%",
      backgroundColor: "#38bdf8",
      width: `${searchingProgress}%`,
      transition: "width 0.15s ease-out"
    },
    badge: {
      backgroundColor: "rgba(56, 189, 248, 0.1)",
      color: "#38bdf8",
      padding: "4px 10px",
      borderRadius: "6px",
      fontSize: "12px",
      fontWeight: "600",
      display: "inline-block",
      marginTop: "8px"
    },
    actionButton: (bgColor, textColor) => ({
      padding: "12px 24px",
      backgroundColor: bgColor,
      color: textColor,
      borderRadius: "12px",
      border: "none",
      fontWeight: "600",
      cursor: "pointer",
      transition: "background-color 0.2s",
      fontSize: "14px",
      margin: "6px"
    }),
    profileBlock: {
      backgroundColor: "#0f172a",
      borderRadius: "16px",
      padding: "24px",
      border: "1px solid #334155",
      marginBottom: "24px",
      textAlign: "left"
    },
    avatar: {
      width: "60px",
      height: "60px",
      borderRadius: "50%",
      backgroundColor: "rgba(56, 189, 248, 0.15)",
      border: "2px solid #38bdf8",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "800",
      color: "#38bdf8",
      fontSize: "24px",
      marginRight: "16px"
    },
    chip: {
      padding: "6px 12px",
      borderRadius: "16px",
      backgroundColor: "#1e293b",
      color: "#cbd5e1",
      fontSize: "12px",
      border: "1px solid #334155"
    }
  };

  // Inject animation styles
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
      @keyframes pulseMatch {
        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.5); }
        70% { transform: scale(1.08); box-shadow: 0 0 0 15px rgba(56, 189, 248, 0); }
        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); }
      }
    `;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Speaking Matchmaking</h2>
      <p style={styles.subtitle}>Find peer partners with matching speaking levels and interests</p>

      {errorMessage && (
        <div style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#f87171", padding: "12px 16px", borderRadius: "12px", marginBottom: "20px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
          {errorMessage}
        </div>
      )}

      {matchingState === "idle" && (
        <div>
          <button style={styles.pulseButton} onClick={handleStartMatching}>
            <span>🔍</span>
            <span style={{ fontSize: "14px", marginTop: "8px" }}>Start Match</span>
          </button>
          
          <p style={{ fontSize: "14px", color: "#64748b", margin: "16px 0" }}>
            Matching Criteria:
          </p>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", alignItems: "center" }}>
            <SimpleLevelBadge level={currentUserProfile?.englishLevel || "Intermediate"} />
            <span style={styles.badge}>Interests: {currentUserProfile?.interests?.length || 0} selected</span>
          </div>
        </div>
      )}

      {matchingState === "searching" && (
        <div>
          <div style={styles.pulseButton}>
            <span>🌐</span>
            <span style={{ fontSize: "13px", marginTop: "8px" }}>Searching...</span>
          </div>
          
          <div style={styles.progressBarOuter}>
            <div style={styles.progressBarInner}></div>
          </div>
          
          <p style={{ fontSize: "14px", color: "#94a3b8" }}>
            Scanning online English Circles... ({searchingProgress}%)
          </p>
          <p style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic", marginTop: "4px" }}>
            Matching with learners of similar proficiency
          </p>

          <button
            style={styles.actionButton("#334155", "#94a3b8")}
            onClick={handleCancelMatching}
          >
            Cancel Search
          </button>
        </div>
      )}

      {matchingState === "matched" && matchedUser && (
        <div>
          <div style={{ color: "#34d399", fontSize: "36px", marginBottom: "12px" }}>🎉 Match Found!</div>
          
          <div style={styles.profileBlock}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
              <div style={styles.avatar}>
                {matchedUser.name ? matchedUser.name.charAt(0).toUpperCase() : "P"}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>{matchedUser.name}</h3>
                <p style={{ margin: "4px 0 0 0", color: "#94a3b8", fontSize: "13px" }}>
                  📍 {matchedUser.country || "Earth"} | 🗣️ Native: {matchedUser.nativeLanguage || "Spanish"}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <span style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "6px" }}>Proficiency</span>
              <SimpleLevelBadge level={matchedUser.englishLevel} />
            </div>

            {matchedUser.interests && matchedUser.interests.length > 0 && (
              <div>
                <span style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "6px" }}>Shared Interests</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {matchedUser.interests.map((interest) => (
                    <span key={interest} style={styles.chip}>{interest}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              style={styles.actionButton("#0284c7", "#ffffff")}
              onClick={() => onPartnerSelected(matchedUser)}
            >
              💬 Open Chat
            </button>
            <button
              style={styles.actionButton("#059669", "#ffffff")}
              onClick={() => onStartCall(matchedUser.id, false)}
            >
              🎙️ Voice Call
            </button>
            <button
              style={styles.actionButton("#7c3aed", "#ffffff")}
              onClick={() => onStartCall(matchedUser.id, true)}
            >
              📹 Video Call
            </button>
          </div>

          <div style={{ marginTop: "16px" }}>
            <button
              style={styles.actionButton("transparent", "#38bdf8")}
              onClick={handleStartMatching}
            >
              Match Again 🔄
            </button>
          </div>
        </div>
      )}

      {matchingState === "no_match" && (
        <div>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🛰️</div>
          <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>No peers available online</h3>
          <p style={{ fontSize: "13px", color: "#94a3b8", margin: "0 24px 24px 24px", lineHeight: "1.6" }}>
            There are currently no online peers matching your English level ({currentUserProfile?.englishLevel || "Intermediate"}) and interests. Try editing your interests in the Profile tab to broaden matchmaking criteria!
          </p>

          <button
            style={styles.actionButton("#0284c7", "#ffffff")}
            onClick={handleStartMatching}
          >
            Retry Matchmaking
          </button>
          <button
            style={styles.actionButton("#334155", "#cbd5e1")}
            onClick={() => setMatchingState("idle")}
          >
            Back to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
