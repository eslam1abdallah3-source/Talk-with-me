import React, { useState } from "react";

/**
 * CallControls Component
 * A highly polished, Material Design 3 inspired call controller interface.
 * Implements accessible interactive states, clear tooltips, and standard grid layout.
 *
 * @param {Object} props
 * @param {boolean} props.isMuted - State of the local microphone track
 * @param {Function} props.onToggleMute - Triggered when toggling the microphone
 * @param {boolean} props.isCamOff - State of the local camera track
 * @param {Function} props.onToggleCamera - Triggered when toggling the camera
 * @param {boolean} props.isVideoMode - Whether the current call supports video transmission
 * @param {Function} props.onHangUp - Triggered when terminating the session
 */
export default function CallControls({
  isMuted,
  onToggleMute,
  isCamOff,
  onToggleCamera,
  isVideoMode,
  onHangUp
}) {
  const [hoveredButton, setHoveredButton] = useState(null); // 'mute', 'camera', 'hangup'

  const styles = {
    hudPanel: {
      backgroundColor: "rgba(30, 41, 59, 0.95)", // Glassmorphism dark background
      borderRadius: "28px",
      padding: "16px 32px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "24px",
      maxWidth: "440px",
      margin: "0 auto 16px auto",
      width: "100%",
      boxSizing: "border-box",
      boxShadow: "0 12px 30px -5px rgba(0, 0, 0, 0.4), 0 4px 12px -2px rgba(0, 0, 0, 0.3)",
      border: "1px solid rgba(51, 65, 85, 0.8)",
      backdropFilter: "blur(8px)",
      zIndex: 10
    },
    buttonContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      position: "relative"
    },
    hudButton: (isActive, isHangUp = false, key) => {
      const isHovered = hoveredButton === key;
      let bgColor = "#38bdf8"; // Light sky-blue primary accent
      let color = "#0f172a"; // Contrast text

      if (isHangUp) {
        bgColor = isHovered ? "#dc2626" : "#ef4444"; // Red for terminate
        color = "#ffffff";
      } else if (isActive) {
        bgColor = isHovered ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.12)"; // Muted state when toggled active
        color = "#ffffff";
      } else {
        bgColor = isHovered ? "#7dd3fc" : "#38bdf8"; // Hover/Active states
      }

      return {
        width: "56px",
        height: "56px",
        borderRadius: "50%",
        border: isActive && !isHangUp ? "1.5px solid rgba(255, 255, 255, 0.3)" : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontSize: "20px",
        outline: "none",
        boxShadow: isHangUp 
          ? "0 4px 14px rgba(239, 68, 68, 0.4)" 
          : isActive 
            ? "none" 
            : "0 4px 14px rgba(56, 189, 248, 0.2)",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: isHovered ? "scale(1.08)" : "scale(1)",
        backgroundColor: bgColor,
        color: color,
        position: "relative"
      };
    },
    tooltip: {
      position: "absolute",
      bottom: "72px",
      backgroundColor: "#0f172a",
      color: "#cbd5e1",
      fontSize: "11px",
      fontWeight: "600",
      padding: "6px 12px",
      borderRadius: "8px",
      whiteSpace: "nowrap",
      border: "1px solid #334155",
      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
      pointerEvents: "none",
      opacity: 1,
      transition: "opacity 0.15s ease-in-out"
    },
    indicatorLabel: {
      fontSize: "11px",
      fontWeight: "600",
      color: "#94a3b8",
      marginTop: "8px",
      letterSpacing: "0.5px"
    }
  };

  return (
    <div style={styles.hudPanel} aria-label="WebRTC Call Controls Panel">
      
      {/* Microphone Control */}
      <div style={styles.buttonContainer}>
        {hoveredButton === "mute" && (
          <div style={styles.tooltip}>
            {isMuted ? "Unmute Microphone" : "Mute Microphone"}
          </div>
        )}
        <button
          style={styles.hudButton(isMuted, false, "mute")}
          onClick={onToggleMute}
          onMouseEnter={() => setHoveredButton("mute")}
          onMouseLeave={() => setHoveredButton(null)}
          aria-label={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
        >
          {isMuted ? "🔇" : "🎙️"}
        </button>
        <span style={styles.indicatorLabel}>
          {isMuted ? "Muted" : "Active"}
        </span>
      </div>

      {/* Camera Control (Only visible in video mode) */}
      {isVideoMode && (
        <div style={styles.buttonContainer}>
          {hoveredButton === "camera" && (
            <div style={styles.tooltip}>
              {isCamOff ? "Turn Camera On" : "Turn Camera Off"}
            </div>
          )}
          <button
            style={styles.hudButton(isCamOff, false, "camera")}
            onClick={onToggleCamera}
            onMouseEnter={() => setHoveredButton("camera")}
            onMouseLeave={() => setHoveredButton(null)}
            aria-label={isCamOff ? "Turn Camera On" : "Turn Camera Off"}
            title={isCamOff ? "Turn Camera On" : "Turn Camera Off"}
          >
            {isCamOff ? "🙈" : "📷"}
          </button>
          <span style={styles.indicatorLabel}>
            {isCamOff ? "Cam Off" : "Cam On"}
          </span>
        </div>
      )}

      {/* End Call/Hang Up Control */}
      <div style={styles.buttonContainer}>
        {hoveredButton === "hangup" && (
          <div style={styles.tooltip}>
            End Practice Session
          </div>
        )}
        <button
          style={styles.hudButton(false, true, "hangup")}
          onClick={onHangUp}
          onMouseEnter={() => setHoveredButton("hangup")}
          onMouseLeave={() => setHoveredButton(null)}
          aria-label="End Practice Session"
          title="End Practice Session"
        >
          📞
        </button>
        <span style={{ ...styles.indicatorLabel, color: "#f87171" }}>
          End Call
        </span>
      </div>

    </div>
  );
}
