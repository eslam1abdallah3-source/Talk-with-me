import React, { useState, useEffect } from "react";
import { getUserProfile } from "./databaseService";
import { WebRtcService } from "./webrtcService";
import { SimpleLevelBadge } from "./LevelProgressCard";

/**
 * IncomingCallAlert Component
 * Displays a stunning modal overlay when someone tries to connect via voice or video.
 * Integrates real-time profile loading, synthetic ringing audio, and accept/decline choices.
 */
export default function IncomingCallAlert({ notification, onAccept, onDecline }) {
  const [callerProfile, setCallerProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch Caller Profile & Setup ringtone loop
  useEffect(() => {
    if (!notification || !notification.callerId) return;

    setLoading(true);
    getUserProfile(notification.callerId)
      .then((profile) => {
        setCallerProfile(profile);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading caller profile for alert:", err);
        setLoading(false);
      });

    // Start synthetic ringtone loop
    let audioCtx = null;
    let ringInterval = null;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
        let isBeeping = false;

        ringInterval = setInterval(() => {
          if (isBeeping || !audioCtx) return;
          isBeeping = true;

          const osc1 = audioCtx.createOscillator();
          const osc2 = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();

          osc1.type = "sine";
          osc1.frequency.setValueAtTime(440, audioCtx.currentTime); // Standard ring frequency (A4)
          osc2.type = "sine";
          osc2.frequency.setValueAtTime(480, audioCtx.currentTime); // dual tone cadence

          gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.15);
          gainNode.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.85);
          gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.0);

          osc1.connect(gainNode);
          osc2.connect(gainNode);
          gainNode.connect(audioCtx.destination);

          osc1.start();
          osc2.start();

          setTimeout(() => {
            try {
              osc1.stop();
              osc2.stop();
            } catch (err) {}
            isBeeping = false;
          }, 1000);
        }, 2200);
      }
    } catch (e) {
      console.warn("Autoplay policies blocked ringtone context initialization.", e);
    }

    return () => {
      if (ringInterval) clearInterval(ringInterval);
      if (audioCtx) {
        try {
          audioCtx.close();
        } catch (e) {}
      }
    };
  }, [notification]);

  if (!notification) return null;

  const handleDecline = async () => {
    // Decline call in Firestore and clear parent notification state
    await WebRtcService.rejectCall(notification.callId);
    onDecline();
  };

  const styles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.85)", // Glass dark backdrop
      backdropFilter: "blur(8px)",
      zIndex: 2000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    },
    card: {
      backgroundColor: "#1e293b",
      borderRadius: "28px",
      border: "1px solid #334155",
      width: "90%",
      maxWidth: "400px",
      padding: "36px 24px",
      textAlign: "center",
      color: "#f8fafc",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(56, 189, 248, 0.1)",
      boxSizing: "border-box"
    },
    alertHeader: {
      fontSize: "12px",
      fontWeight: "700",
      letterSpacing: "1.5px",
      textTransform: "uppercase",
      color: "#38bdf8",
      marginBottom: "24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px"
    },
    pulseCircle: {
      width: "100px",
      height: "100px",
      borderRadius: "50%",
      backgroundColor: "rgba(56, 189, 248, 0.1)",
      border: "3px solid #38bdf8",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "36px",
      fontWeight: "800",
      color: "#38bdf8",
      margin: "0 auto 20px auto",
      animation: "ringPulse 1.8s infinite ease-in-out"
    },
    callerName: {
      fontSize: "22px",
      fontWeight: "800",
      color: "#ffffff",
      margin: "0 0 6px 0",
      letterSpacing: "-0.5px"
    },
    callerDetails: {
      fontSize: "13px",
      color: "#94a3b8",
      marginBottom: "32px",
      lineHeight: "1.5"
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
    buttonGroup: {
      display: "flex",
      gap: "16px",
      justifyContent: "center"
    },
    btnDecline: {
      flex: 1,
      backgroundColor: "#ef4444",
      color: "#ffffff",
      border: "none",
      borderRadius: "16px",
      padding: "14px 20px",
      fontSize: "14px",
      fontWeight: "700",
      cursor: "pointer",
      boxShadow: "0 4px 14px rgba(239, 68, 68, 0.3)",
      transition: "transform 0.2s, background-color 0.2s"
    },
    btnAccept: {
      flex: 1,
      backgroundColor: "#10b981",
      color: "#ffffff",
      border: "none",
      borderRadius: "16px",
      padding: "14px 20px",
      fontSize: "14px",
      fontWeight: "700",
      cursor: "pointer",
      boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
      transition: "transform 0.2s, background-color 0.2s"
    }
  };

  return (
    <div style={styles.overlay} aria-label="Incoming Call dialog overlay">
      <div style={styles.card}>
        <div style={styles.alertHeader}>
          <span>📞</span>
          <span>Incoming Circle Request</span>
        </div>

        <div style={styles.pulseCircle}>
          {callerProfile?.name ? callerProfile.name.charAt(0).toUpperCase() : "P"}
        </div>

        {loading ? (
          <div style={{ minHeight: "80px" }}>
            <p style={{ fontSize: "14px", color: "#64748b" }}>Loading peer details...</p>
          </div>
        ) : (
          <div style={{ minHeight: "80px" }}>
            <h3 style={styles.callerName}>{callerProfile?.name || "English Peer"}</h3>
            <p style={styles.callerDetails}>
              📍 {callerProfile?.country || "Worldwide"} | Native: {callerProfile?.nativeLanguage || "Spanish"}
            </p>
            <SimpleLevelBadge level={callerProfile?.englishLevel || "Intermediate"} style={{ display: "inline-flex", marginTop: "4px" }} />
          </div>
        )}

        <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "24px" }}>
          Type: {notification.isVideo ? "📹 Video Session" : "🎙️ Voice Session"}
        </p>

        <div style={styles.buttonGroup}>
          <button 
            style={styles.btnDecline}
            onClick={handleDecline}
            title="Decline circle connection"
          >
            Decline ❌
          </button>
          <button 
            style={styles.btnAccept}
            onClick={() => onAccept(notification)}
            title="Accept circle connection"
          >
            Connect ✅
          </button>
        </div>
      </div>

      <style>{`
        @keyframes ringPulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.5); }
          70% { transform: scale(1.06); box-shadow: 0 0 0 15px rgba(56, 189, 248, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); }
        }
      `}</style>
    </div>
  );
}
