import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { findMatchingUser, getUserProfile, subscribeToAllUsers } from "../services/databaseService";
import { SimpleLevelBadge } from "../components/LevelProgressCard";
import { getRankedMatches, getBlockedUsers } from "../services/matchingService";

/**
 * MatchingView Component
 * A visually stunning dashboard showcasing smart-ranked matchmaking,
 * dynamic search progress animations, active language circle directories,
 * and direct calling & messaging capabilities.
 */
export default function MatchingView({ currentUserId, onPartnerSelected, onStartCall }) {
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [matchingState, setMatchingState] = useState("idle"); // idle, searching, matched, no_match, error
  const [matchedUser, setMatchedUser] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchingProgress, setSearchingProgress] = useState(0);
  const [allUsers, setAllUsers] = useState([]);
  const [blockedIds, setBlockedIds] = useState([]);

  // Fetch blocked users and subscribe to all registered users in real-time
  useEffect(() => {
    if (!currentUserId) return;
    
    // 1. Fetch blocked users
    getBlockedUsers(currentUserId).then(setBlockedIds);

    // 2. Subscribe to user catalog
    console.log("Subscribing to all users in real-time...");
    const unsubscribe = subscribeToAllUsers(currentUserId, (usersList) => {
      setAllUsers(usersList);
    });
    
    return () => {
      console.log("Unsubscribing from users real-time stream.");
      if (unsubscribe) unsubscribe();
    };
  }, [currentUserId]);

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

  // Trigger smart ranking matching algorithm
  const handleStartMatching = async () => {
    if (!currentUserProfile) {
      setErrorMessage("Waiting for profile data to load...");
      return;
    }

    setMatchingState("searching");
    setErrorMessage("");
    setMatchedUser(null);

    try {
      // Fetch latest blocks just in case
      const latestBlocks = await getBlockedUsers(currentUserId);
      setBlockedIds(latestBlocks);

      // We wait for the simulated delay of searching progress for maximum user immersion (approx 3 seconds)
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Get ranked matching list using the matching service
      const ranked = getRankedMatches(currentUserProfile, allUsers, latestBlocks);

      if (ranked && ranked.length > 0) {
        // Find top match
        const bestMatch = ranked[0];
        setMatchedUser(bestMatch);
        setMatchingState("matched");
      } else {
        setMatchingState("no_match");
      }
    } catch (err) {
      console.error("Matchmaking error:", err);
      setErrorMessage("Matchmaking error. Please verify network connection.");
      setMatchingState("error");
    }
  };

  const handleCancelMatching = () => {
    setMatchingState("idle");
    setSearchingProgress(0);
  };

  // Get active directory users, excluding self and blocked, sorted by ranking
  const activeCircleUsers = getRankedMatches(currentUserProfile, allUsers, blockedIds);

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
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", alignItems: "center", marginBottom: "20px" }}>
            <SimpleLevelBadge level={currentUserProfile?.englishLevel || "Intermediate"} />
            <span style={styles.badge}>Interests: {currentUserProfile?.interests?.length || 0} selected</span>
          </div>

          {/* Active Peers Directory */}
          <div style={{ marginTop: "36px", borderTop: "1px solid #334155", paddingTop: "24px", textAlign: "left" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#38bdf8", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>👥</span> Active Language Circles ({activeCircleUsers.length})
            </h3>
            <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 16px 0" }}>
              Connect directly with online and offline English learners worldwide.
            </p>
            
            {activeCircleUsers.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#64748b", backgroundColor: "#0f172a", borderRadius: "12px", fontSize: "13px" }}>
                Waiting for other language peers to connect...
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "380px", overflowY: "auto", paddingRight: "4px" }}>
                {activeCircleUsers.map((user) => {
                  const initials = user.name ? user.name.charAt(0).toUpperCase() : "P";
                  const isOnline = user.isOnline === true;
                  const score = user.matchScore || 0;
                  
                  return (
                    <div 
                      key={user.id} 
                      style={{
                        display: "flex",
                        alignItems: "center",
                        backgroundColor: "#0f172a",
                        padding: "12px 16px",
                        borderRadius: "16px",
                        border: "1px solid #334155",
                        gap: "12px"
                      }}
                    >
                      {/* Avatar with dynamic status indicator */}
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        {user.photoURL ? (
                          <img 
                            src={user.photoURL} 
                            alt={user.name} 
                            style={{ width: "42px", height: "42px", borderRadius: "50%", border: "2px solid #38bdf8", objectFit: "cover" }} 
                          />
                        ) : (
                          <div style={{ width: "42px", height: "42px", borderRadius: "50%", backgroundColor: "rgba(56, 189, 248, 0.15)", border: "2px solid #38bdf8", color: "#38bdf8", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "16px" }}>
                            {initials}
                          </div>
                        )}
                        <span style={{
                          position: "absolute",
                          bottom: 0,
                          right: 0,
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          backgroundColor: isOnline ? "#10b981" : "#64748b",
                          border: "2px solid #0f172a",
                          boxShadow: isOnline ? "0 0 8px #10b981" : "none"
                        }} />
                      </div>

                      {/* User details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#f8fafc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {user.name}
                          </h4>
                          <span style={{ fontSize: "10px", color: isOnline ? "#10b981" : "#94a3b8", fontWeight: "600" }}>
                            {isOnline ? "Online" : "Offline"}
                          </span>
                        </div>
                        <p style={{ margin: "2px 0 6px 0", fontSize: "11px", color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          📍 {user.country || "Earth"} | 🗣️ {user.nativeLanguage || "Spanish"}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <SimpleLevelBadge level={user.englishLevel || "Intermediate"} />
                          <span style={{ fontSize: "10px", color: "#38bdf8", backgroundColor: "rgba(56, 189, 248, 0.1)", padding: "1px 6px", borderRadius: "4px", fontWeight: "600" }}>
                            Match: {Math.min(100, Math.max(20, score))}%
                          </span>
                        </div>
                      </div>

                      {/* Direct Actions */}
                      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                        <button 
                          onClick={() => onPartnerSelected(user)}
                          style={{
                            padding: "6px 10px",
                            backgroundColor: "rgba(56, 189, 248, 0.1)",
                            color: "#38bdf8",
                            border: "1px solid rgba(56, 189, 248, 0.2)",
                            borderRadius: "8px",
                            fontSize: "11px",
                            fontWeight: "600",
                            cursor: "pointer"
                          }}
                        >
                          💬 Chat
                        </button>
                        <button 
                          onClick={() => onStartCall(user.id, false)}
                          style={{
                            padding: "6px 10px",
                            backgroundColor: "rgba(16, 185, 129, 0.1)",
                            color: "#10b981",
                            border: "1px solid rgba(16, 185, 129, 0.2)",
                            borderRadius: "8px",
                            fontSize: "11px",
                            fontWeight: "600",
                            cursor: "pointer"
                          }}
                        >
                          🎙️ Call
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {matchingState === "searching" && (
        <div style={{ padding: "40px 0" }}>
          <div style={styles.pulseButton}>
            <span>⚡</span>
            <span style={{ fontSize: "13px", marginTop: "8px" }}>Scanning...</span>
          </div>
          <p style={{ fontSize: "15px", color: "#e2e8f0", marginBottom: "24px" }}>
            Evaluating English levels, interests, and availability...
          </p>
          <div style={styles.progressBarOuter}>
            <div style={styles.progressBarInner} />
          </div>
          <p style={{ fontSize: "12px", color: "#94a3b8" }}>{searchingProgress}% calculated</p>
          <button 
            style={styles.actionButton("rgba(239, 68, 68, 0.1)", "#f87171")} 
            onClick={handleCancelMatching}
          >
            Cancel Scan
          </button>
        </div>
      )}

      {matchingState === "matched" && matchedUser && (
        <div>
          <h3 style={{ fontSize: "20px", color: "#10b981", marginBottom: "16px", fontWeight: "800" }}>🎉 Perfect Language Match!</h3>
          
          <div style={styles.profileBlock}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
              <div style={styles.avatar}>
                {matchedUser.name ? matchedUser.name.charAt(0).toUpperCase() : "P"}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "18px", color: "#f8fafc", fontWeight: "800" }}>{matchedUser.name}</h4>
                <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#94a3b8" }}>📍 {matchedUser.country || "Earth"}</p>
              </div>
            </div>

            <p style={{ fontSize: "14px", lineHeight: "1.5", color: "#cbd5e1", margin: "0 0 16px 0" }}>
              <strong>Bio:</strong> {matchedUser.bio || "Hi! I'm excited to practice English, share stories, and learn about different cultures together!"}
            </p>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
              <SimpleLevelBadge level={matchedUser.englishLevel || "Intermediate"} />
              <span style={styles.chip}>🗣️ Native: {matchedUser.nativeLanguage || "Spanish"}</span>
              <span style={styles.chip}>🎯 Learning: {matchedUser.learningLanguage || "English"}</span>
            </div>

            <div style={{ borderTop: "1px solid #334155", paddingTop: "12px" }}>
              <span style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Shared Interests:</span>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {(matchedUser.interests && matchedUser.interests.length > 0 ? matchedUser.interests : ["Culture", "Travel"]).map((interest, i) => (
                  <span key={i} style={{ fontSize: "11px", padding: "4px 10px", backgroundColor: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", borderRadius: "8px", fontWeight: "600" }}>
                    #{interest}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
            <button 
              style={styles.actionButton("#38bdf8", "#0f172a")} 
              onClick={() => onPartnerSelected(matchedUser)}
            >
              💬 Start Chat
            </button>
            <button 
              style={styles.actionButton("#10b981", "#ffffff")} 
              onClick={() => onStartCall(matchedUser.id, false)}
            >
              🎙️ Practice Call
            </button>
            <button 
              style={styles.actionButton("#334155", "#cbd5e1")} 
              onClick={() => setMatchingState("idle")}
            >
              Next Match
            </button>
          </div>
        </div>
      )}

      {matchingState === "no_match" && (
        <div style={{ padding: "40px 0" }}>
          <h3>🔍 No ideal match found yet</h3>
          <p style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "24px" }}>
            We scanned the network, but no new matching users with identical levels are online right now. Let's browse our Active Circles list to connect directly!
          </p>
          <button style={styles.actionButton("#38bdf8", "#0f172a")} onClick={() => setMatchingState("idle")}>
            View Directory
          </button>
        </div>
      )}
    </div>
  );
}
