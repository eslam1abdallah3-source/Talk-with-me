import React, { useState, useEffect } from "react";
import { getUserProfile, savePostCallRating } from "../services/databaseService";

/**
 * PostCallRating Component
 * Renders an elegant post-call peer feedback modal.
 * Users rate their conversational partner on friendliness and English clarity (1-5 stars).
 * Updates Firestore collections and aggregates scores in real-time.
 *
 * @param {Object} props
 * @param {string} props.partnerId - ID of the language peer to rate
 * @param {string} props.currentUserId - ID of the authenticated rating user
 * @param {Function} props.onFinished - Callback when user submits or skips
 */
export default function PostCallRating({ partnerId, currentUserId, onFinished }) {
  const [partnerName, setPartnerName] = useState("your language partner");
  const [friendliness, setFriendliness] = useState(0);
  const [hoverFriendliness, setHoverFriendliness] = useState(0);
  
  const [clarity, setClarity] = useState(0);
  const [hoverClarity, setHoverClarity] = useState(0);
  
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Fetch partner profile name to personalize the dialog
  useEffect(() => {
    if (!partnerId) return;
    getUserProfile(partnerId)
      .then((profile) => {
        if (profile && profile.name) {
          setPartnerName(profile.name);
        }
      })
      .catch((err) => console.error("Error loading partner for rating screen:", err));
  }, [partnerId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (friendliness === 0 || clarity === 0) {
      setError("Please select a rating for both Friendliness and Clarity.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await savePostCallRating(currentUserId, partnerId, friendliness, clarity, comment.trim());
      setSubmitted(true);
      setTimeout(() => {
        onFinished();
      }, 1500);
    } catch (err) {
      console.error("Failed to save session rating:", err);
      setError("An error occurred while saving your feedback. Please try again.");
      setLoading(false);
    }
  };

  const renderStars = (category, rating, setRating, hoverRating, setHoverRating) => {
    return (
      <div style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((starValue) => {
          const isStarred = starValue <= (hoverRating || rating);
          return (
            <button
              key={starValue}
              type="button"
              style={styles.starButton}
              onClick={() => {
                setError("");
                setRating(starValue);
              }}
              onMouseEnter={() => setHoverRating(starValue)}
              onMouseLeave={() => setHoverRating(0)}
              aria-label={`Rate ${starValue} out of 5 stars for ${category}`}
              title={`Rate ${starValue} stars`}
            >
              <span style={styles.starChar(isStarred)}>
                {isStarred ? "★" : "☆"}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  const styles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.9)", // beautiful dense glassmorphism overlay
      backdropFilter: "blur(12px)",
      zIndex: 3000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    },
    card: {
      backgroundColor: "#1e293b",
      border: "1px solid #334155",
      borderRadius: "28px",
      width: "90%",
      maxWidth: "460px",
      padding: "36px 32px",
      boxSizing: "border-box",
      color: "#f8fafc",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 50px rgba(56, 189, 248, 0.1)",
      textAlign: "center"
    },
    title: {
      fontSize: "24px",
      fontWeight: "800",
      color: "#ffffff",
      margin: "0 0 8px 0",
      letterSpacing: "-0.5px"
    },
    subtitle: {
      fontSize: "14px",
      color: "#94a3b8",
      lineHeight: "1.5",
      marginBottom: "28px"
    },
    categoryContainer: {
      backgroundColor: "#0f172a",
      borderRadius: "16px",
      padding: "16px 20px",
      marginBottom: "20px",
      border: "1px solid #334155",
      textAlign: "left"
    },
    categoryHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "10px"
    },
    categoryTitle: {
      fontSize: "14px",
      fontWeight: "700",
      color: "#e2e8f0"
    },
    categoryScore: {
      fontSize: "13px",
      fontWeight: "600",
      color: "#38bdf8"
    },
    starRow: {
      display: "flex",
      gap: "8px"
    },
    starButton: {
      backgroundColor: "transparent",
      border: "none",
      cursor: "pointer",
      padding: "6px",
      margin: 0,
      outline: "none",
      // accessible touch targets
      width: "44px",
      height: "44px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    starChar: (isFilled) => ({
      fontSize: "32px",
      color: isFilled ? "#eab308" : "#475569", // brilliant gold vs muted slate
      transition: "color 0.15s ease-in-out, transform 0.1s ease",
      display: "inline-block"
    }),
    commentLabel: {
      display: "block",
      textAlign: "left",
      fontSize: "13px",
      fontWeight: "600",
      color: "#94a3b8",
      marginBottom: "8px"
    },
    commentArea: {
      width: "100%",
      backgroundColor: "#0f172a",
      border: "1px solid #334155",
      borderRadius: "12px",
      padding: "12px 16px",
      color: "#f8fafc",
      fontSize: "14px",
      outline: "none",
      resize: "none",
      minHeight: "80px",
      marginBottom: "24px",
      boxSizing: "border-box",
      fontFamily: "inherit"
    },
    errorAlert: {
      backgroundColor: "rgba(239, 68, 68, 0.15)",
      color: "#f87171",
      padding: "12px 16px",
      borderRadius: "12px",
      fontSize: "13px",
      fontWeight: "600",
      marginBottom: "20px",
      border: "1px solid rgba(239, 68, 68, 0.3)",
      textAlign: "left"
    },
    successAlert: {
      backgroundColor: "rgba(16, 185, 129, 0.15)",
      color: "#34d399",
      padding: "16px",
      borderRadius: "16px",
      fontSize: "15px",
      fontWeight: "600",
      border: "1px solid rgba(16, 185, 129, 0.3)"
    },
    buttonGroup: {
      display: "flex",
      gap: "16px",
      alignItems: "center"
    },
    btnSkip: {
      flex: 1,
      backgroundColor: "transparent",
      color: "#94a3b8",
      border: "1px solid #334155",
      borderRadius: "14px",
      padding: "14px 20px",
      fontSize: "14px",
      fontWeight: "700",
      cursor: "pointer",
      transition: "all 0.2s"
    },
    btnSubmit: {
      flex: 1,
      backgroundColor: "#38bdf8",
      color: "#0f172a",
      border: "none",
      borderRadius: "14px",
      padding: "14px 20px",
      fontSize: "14px",
      fontWeight: "800",
      cursor: "pointer",
      boxShadow: "0 4px 14px rgba(56, 189, 248, 0.3)",
      transition: "all 0.2s"
    }
  };

  return (
    <div style={styles.overlay} aria-label="Post-call Feedback rating overlay dialog">
      <div style={styles.card}>
        {submitted ? (
          <div style={styles.successAlert}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>🎉</div>
            <p style={{ margin: "0 0 4px 0", fontSize: "18px", color: "#ffffff" }}>Feedback Submitted!</p>
            <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>Thank you for helping us maintain a safe, high-quality circle.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>🌟</div>
            <h3 style={styles.title}>How was your session?</h3>
            <p style={styles.subtitle}>
              Your rating of <strong>{partnerName}</strong> helps pair language learners accurately and maintain friendliness in our circles.
            </p>

            {error && <div style={styles.errorAlert}>{error}</div>}

            {/* Friendliness Rating Category */}
            <div style={styles.categoryContainer}>
              <div style={styles.categoryHeader}>
                <span style={styles.categoryTitle}>Friendliness & Supportiveness</span>
                <span style={styles.categoryScore}>
                  {friendliness > 0 ? `${friendliness} / 5` : "Select rating"}
                </span>
              </div>
              {renderStars(
                "Friendliness",
                friendliness,
                setFriendliness,
                hoverFriendliness,
                setHoverFriendliness
              )}
            </div>

            {/* English Clarity Category */}
            <div style={styles.categoryContainer}>
              <div style={styles.categoryHeader}>
                <span style={styles.categoryTitle}>English Clarity & Pronunciation</span>
                <span style={styles.categoryScore}>
                  {clarity > 0 ? `${clarity} / 5` : "Select rating"}
                </span>
              </div>
              {renderStars(
                "Clarity",
                clarity,
                setClarity,
                hoverClarity,
                setHoverClarity
              )}
            </div>

            {/* Optional Comment text feedback */}
            <label style={styles.commentLabel} htmlFor="rating-comment">
              Constructive Feedback (Optional)
            </label>
            <textarea
              id="rating-comment"
              style={styles.commentArea}
              placeholder="e.g. Really helpful! Liam spoke clearly, introduced nice grammar, and gave great feedback..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={loading}
              maxLength={400}
            />

            <div style={styles.buttonGroup}>
              <button
                type="button"
                style={styles.btnSkip}
                onClick={onFinished}
                disabled={loading}
                title="Skip rating for now"
              >
                Skip ➔
              </button>
              <button
                type="submit"
                style={{
                  ...styles.btnSubmit,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? "not-allowed" : "pointer"
                }}
                disabled={loading}
                title="Submit speaker review feedback"
              >
                {loading ? "Submitting..." : "Submit Review ✓"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
