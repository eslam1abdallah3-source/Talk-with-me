import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { syncUserBadges } from "./databaseService";
import BadgesModule from "./BadgesModule";
import LevelProgressCard from "./LevelProgressCard";

/**
 * UserProfile Component
 * A modern, polished React component for editing and saving user speaking profiles to Firestore.
 */
export default function UserProfile() {
  // Auth State
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [nativeLanguage, setNativeLanguage] = useState("");
  const [englishLevel, setEnglishLevel] = useState("Intermediate");
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [ratingCount, setRatingCount] = useState(0);
  const [avgFriendliness, setAvgFriendliness] = useState(0);
  const [avgClarity, setAvgClarity] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(15);
  const [badges, setBadges] = useState([]);
  const [practiceLogs, setPracticeLogs] = useState({});

  // UI Flow State
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const englishLevels = ["Beginner", "Intermediate", "Advanced", "Native"];
  const interestOptions = [
    "Music", "Travel", "Tech", "Gaming", "Literature", "Art",
    "Movies", "Football", "Cooking", "Hiking", "Anime", "History", "Business"
  ];

  // Monitor Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        fetchUserProfile(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch Existing User Profile from Firestore
  const fetchUserProfile = async (uid) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setName(data.name || "");
        setCountry(data.country || "");
        setNativeLanguage(data.nativeLanguage || "");
        setEnglishLevel(data.englishLevel || "Intermediate");
        setRatingCount(data.ratingCount || 0);
        setAvgFriendliness(data.avgFriendliness || 0);
        setAvgClarity(data.avgClarity || 0);
        setCurrentStreak(data.currentStreak || 0);
        setLongestStreak(data.longestStreak || 0);
        setDailyGoal(data.dailyGoal || 15);
        setPracticeLogs(data.practiceLogs || {});
        
        // Try syncing badges to keep in perfect alignment with logs
        let loadedBadges = data.badges || [];
        try {
          const synced = await syncUserBadges(uid);
          if (synced && synced.length > 0) {
            loadedBadges = synced;
          }
        } catch (syncErr) {
          console.warn("Could not sync badges during load:", syncErr);
        }
        setBadges(loadedBadges);
        
        // Handle interests format (could be comma-separated string or array)
        if (Array.isArray(data.interests)) {
          setSelectedInterests(data.interests);
        } else if (typeof data.interests === "string") {
          setSelectedInterests(data.interests ? data.interests.split(",") : []);
        } else {
          setSelectedInterests([]);
        }
      } else {
        // Pre-fill with Auth display name if document doesn't exist yet
        if (auth.currentUser) {
          setName(auth.currentUser.displayName || "");
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setErrorMessage("Failed to load profile data from Firestore.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle interest selection
  const handleInterestToggle = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((item) => item !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  // Save User Profile to Firestore
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user) {
      setErrorMessage("You must be signed in to save your profile.");
      return;
    }
    if (!name.trim()) {
      setErrorMessage("Display name cannot be empty.");
      return;
    }

    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const docRef = doc(db, "users", user.uid);
      const profileData = {
        name: name.trim(),
        country: country.trim() || "United States",
        nativeLanguage: nativeLanguage.trim() || "Spanish",
        englishLevel: englishLevel,
        interests: selectedInterests, // Save as list
        profilePicture: "avatar_me",
        isOnline: true,
        lastActive: Date.now(),
        updatedAt: serverTimestamp()
      };

      await setDoc(docRef, profileData, { merge: true });
      setSuccessMessage("Speaking Profile successfully updated!");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setErrorMessage("Failed to save profile. Please check your Firestore rules.");
    } finally {
      setLoading(false);
    }
  };

  // Modern Theme Inline Styles (inspired by Material Design 3 Slate theme)
  const styles = {
    container: {
      maxWidth: "540px",
      margin: "40px auto",
      padding: "32px",
      borderRadius: "24px",
      backgroundColor: "#1e293b", // slate dark theme background
      color: "#f8fafc",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
      border: "1px solid #334155"
    },
    title: {
      fontSize: "26px",
      fontWeight: "800",
      textAlign: "center",
      marginBottom: "8px",
      color: "#38bdf8", // bright modern primary accent
      letterSpacing: "-0.5px"
    },
    subtitle: {
      fontSize: "14px",
      textAlign: "center",
      color: "#94a3b8",
      marginBottom: "28px"
    },
    sectionTitle: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#cbd5e1",
      marginBottom: "16px",
      borderBottom: "1px solid #334155",
      paddingBottom: "8px"
    },
    formGroup: {
      marginBottom: "20px"
    },
    label: {
      display: "block",
      fontSize: "13px",
      fontWeight: "500",
      color: "#94a3b8",
      marginBottom: "6px"
    },
    input: {
      width: "100%",
      padding: "12px 16px",
      borderRadius: "12px",
      backgroundColor: "#0f172a",
      border: "1px solid #334155",
      color: "#f8fafc",
      fontSize: "15px",
      outline: "none",
      transition: "border-color 0.2s, box-shadow 0.2s",
      boxSizing: "border-box"
    },
    select: {
      width: "100%",
      padding: "12px 16px",
      borderRadius: "12px",
      backgroundColor: "#0f172a",
      border: "1px solid #334155",
      color: "#f8fafc",
      fontSize: "15px",
      outline: "none",
      cursor: "pointer",
      boxSizing: "border-box"
    },
    chipContainer: {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
      marginTop: "8px"
    },
    chip: (isSelected) => ({
      padding: "8px 14px",
      borderRadius: "20px",
      fontSize: "13px",
      fontWeight: "500",
      cursor: "pointer",
      userSelect: "none",
      transition: "all 0.2s",
      backgroundColor: isSelected ? "rgba(56, 189, 248, 0.15)" : "#0f172a",
      color: isSelected ? "#38bdf8" : "#94a3b8",
      border: `1px solid ${isSelected ? "#38bdf8" : "#334155"}`
    }),
    button: {
      width: "100%",
      padding: "14px",
      borderRadius: "14px",
      backgroundColor: "#0284c7",
      color: "#ffffff",
      fontSize: "16px",
      fontWeight: "600",
      border: "none",
      cursor: "pointer",
      marginTop: "16px",
      transition: "background-color 0.2s, transform 0.1s",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    },
    alertSuccess: {
      backgroundColor: "rgba(16, 185, 129, 0.15)",
      color: "#34d399",
      padding: "12px 16px",
      borderRadius: "12px",
      fontSize: "14px",
      marginBottom: "20px",
      border: "1px solid rgba(16, 185, 129, 0.3)"
    },
    alertError: {
      backgroundColor: "rgba(239, 68, 68, 0.15)",
      color: "#f87171",
      padding: "12px 16px",
      borderRadius: "12px",
      fontSize: "14px",
      marginBottom: "20px",
      border: "1px solid rgba(239, 68, 68, 0.3)"
    },
    loadingOverlay: {
      textAlign: "center",
      padding: "40px",
      color: "#94a3b8"
    },
    statsCard: {
      backgroundColor: "#0f172a",
      borderRadius: "20px",
      padding: "20px",
      marginBottom: "28px",
      border: "1px solid #334155"
    },
    statsHeader: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "16px"
    },
    statsTitle: {
      fontSize: "15px",
      fontWeight: "700",
      color: "#e2e8f0"
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "16px"
    },
    statBox: {
      backgroundColor: "#1e293b",
      border: "1px solid #334155",
      borderRadius: "14px",
      padding: "16px",
      textAlign: "center"
    },
    statLabel: {
      fontSize: "12px",
      fontWeight: "600",
      color: "#94a3b8",
      marginBottom: "8px"
    },
    statValue: {
      fontSize: "24px",
      fontWeight: "800",
      color: "#ffffff"
    },
    statSubText: {
      fontSize: "11px",
      color: "#64748b",
      marginTop: "4px"
    },
    noStatsText: {
      fontSize: "13px",
      color: "#94a3b8",
      lineHeight: "1.6",
      margin: 0,
      textAlign: "left"
    }
  };

  if (authLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingOverlay}>Verifying user session...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>My Speaking Profile</h2>
        <div style={styles.alertError}>
          Please sign in using Firebase Authentication first to view and edit your profile.
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>My Speaking Profile</h2>
      <p style={styles.subtitle}>Configure details to match with optimal speaking circles</p>

      {successMessage && <div style={styles.alertSuccess}>{successMessage}</div>}
      {errorMessage && <div style={styles.alertError}>{errorMessage}</div>}

      {/* Circle Performance Dashboard Card */}
      <div style={styles.statsCard}>
        <div style={styles.statsHeader}>
          <span style={{ fontSize: "18px" }}>📊</span>
          <span style={styles.statsTitle}>Circle Performance & Goals</span>
        </div>
        
        {/* Peer Reviews */}
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ fontSize: "12px", fontWeight: "700", color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px 0" }}>Speaking Peer Reviews</h4>
          {ratingCount > 0 ? (
            <div style={styles.statsGrid}>
              <div style={styles.statBox}>
                <div style={styles.statLabel}>Friendliness Rating</div>
                <div style={styles.statValue}>
                  {avgFriendliness} <span style={{ color: "#eab308" }}>★</span>
                </div>
                <div style={styles.statSubText}>out of 5.0</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statLabel}>English Clarity</div>
                <div style={styles.statValue}>
                  {avgClarity} <span style={{ color: "#eab308" }}>★</span>
                </div>
                <div style={styles.statSubText}>out of 5.0</div>
              </div>
              <div style={{ ...styles.statBox, gridColumn: "span 2", borderTop: "1px solid #334155", paddingTop: "8px", marginTop: "4px" }}>
                <span style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "600" }}>
                  Based on {ratingCount} speaking {ratingCount === 1 ? "session review" : "session reviews"}
                </span>
              </div>
            </div>
          ) : (
            <p style={styles.noStatsText}>
              No speaking session reviews received yet. Meet language peers in the <strong>Match</strong> tab to earn positive feedback!
            </p>
          )}
        </div>

        {/* Goals & Streak */}
        <div style={{ borderTop: "1px solid #334155", paddingTop: "16px" }}>
          <h4 style={{ fontSize: "12px", fontWeight: "700", color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px 0" }}>Practice Goals & Streaks</h4>
          <div style={styles.statsGrid}>
            <div style={styles.statBox}>
              <div style={styles.statLabel}>Current Streak</div>
              <div style={styles.statValue}>
                {currentStreak} <span style={{ color: "#f97316" }}>🔥</span>
              </div>
              <div style={styles.statSubText}>consecutive days</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statLabel}>Daily Practice Goal</div>
              <div style={styles.statValue}>
                {dailyGoal} <span style={{ color: "#38bdf8", fontSize: "15px", fontWeight: "700" }}>mins</span>
              </div>
              <div style={styles.statSubText}>customizable in sidebar</div>
            </div>
            <div style={{ ...styles.statBox, gridColumn: "span 2", borderTop: "1px solid #334155", paddingTop: "8px", marginTop: "4px" }}>
              <span style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "600" }}>
                Your longest recorded learning streak is <strong>{longestStreak} days</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* English Proficiency Tier Ranking System */}
      <LevelProgressCard 
        currentLevel={englishLevel} 
        practiceLogs={practiceLogs} 
      />

      {/* Virtual Badges Achievements Gallery */}
      <BadgesModule 
        badges={badges} 
        practiceLogs={practiceLogs} 
        currentStreak={currentStreak} 
        longestStreak={longestStreak} 
      />

      <form onSubmit={handleSaveProfile}>
        <div style={styles.sectionTitle}>Personal Details</div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Display Name</label>
          <input
            style={styles.input}
            type="text"
            placeholder="e.g. John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Country of Residence</label>
          <input
            style={styles.input}
            type="text"
            placeholder="e.g. Japan"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            disabled={loading}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Native Language</label>
          <input
            style={styles.input}
            type="text"
            placeholder="e.g. Japanese"
            value={nativeLanguage}
            onChange={(e) => setNativeLanguage(e.target.value)}
            disabled={loading}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>English Proficiency Level</label>
          <select
            style={styles.select}
            value={englishLevel}
            onChange={(e) => setEnglishLevel(e.target.value)}
            disabled={loading}
          >
            {englishLevels.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.sectionTitle} style={{ ...styles.sectionTitle, marginTop: "28px" }}>
          Conversation Interests
        </div>
        <p style={{ fontSize: "12px", color: "#64748b", margin: "-8px 0 16px 0" }}>
          We will pair you with language partners who share these interests.
        </p>

        <div style={styles.chipContainer}>
          {interestOptions.map((interest) => {
            const isSelected = selectedInterests.includes(interest);
            return (
              <div
                key={interest}
                style={styles.chip(isSelected)}
                onClick={() => !loading && handleInterestToggle(interest)}
              >
                {interest} {isSelected && " ✓"}
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          style={{
            ...styles.button,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer"
          }}
          disabled={loading}
        >
          {loading ? "Saving Profile Changes..." : "Save & Apply Changes"}
        </button>
      </form>
    </div>
  );
}
