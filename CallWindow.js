import React, { useState, useEffect, useRef } from "react";
import { WebRtcService } from "./webrtcService";
import { getUserProfile } from "./databaseService";
import CallControls from "./CallControls";

/**
 * CallWindow Component
 * A visually polished, real-time WebRTC calling screen.
 * Handles permission requests, active audio/video feeds, calling timers, and mute controls.
 * 
 * @param {Object} props
 * @param {string} props.currentUserId - The authenticated user's ID
 * @param {string} [props.incomingCallId] - ID of incoming call (if answering)
 * @param {string} [props.targetPartnerId] - ID of matched user to dial (if calling out)
 * @param {boolean} [props.isVideoMode] - Whether to dial with video enabled
 * @param {Function} props.onCallEnded - Triggers when the call is finished
 */
export default function CallWindow({
  currentUserId,
  incomingCallId = null,
  targetPartnerId = null,
  isVideoMode = true,
  onCallEnded
}) {
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [callStatus, setCallStatus] = useState("connecting"); // connecting, ringing, active, ended, permission_error
  const [iceState, setIceState] = useState("new");
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [permissionError, setPermissionError] = useState("");

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const webRtcServiceRef = useRef(new WebRtcService());
  const timerRef = useRef(null);
  const durationRef = useRef(0);

  const logMinutesAndFinish = async () => {
    const secs = durationRef.current;
    if (secs > 0) {
      const mins = parseFloat((secs / 60).toFixed(1));
      if (mins >= 0.1) {
        try {
          const { addPracticeMinutes } = await import("./databaseService");
          await addPracticeMinutes(currentUserId, mins);
        } catch (e) {
          console.error("Failed to automatically log practice minutes:", e);
        }
      }
    }
    if (onCallEnded) onCallEnded();
  };

  // Load speaking partner profile
  useEffect(() => {
    const partnerId = targetPartnerId || "loading";
    if (partnerId !== "loading") {
      getUserProfile(partnerId).then(setPartnerProfile).catch(console.error);
    }
  }, [targetPartnerId]);

  // Set up call on load
  useEffect(() => {
    const service = webRtcServiceRef.current;

    const setupStreams = (remoteStream) => {
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    const handleIceState = (state) => {
      setIceState(state);
      if (state === "connected") {
        setCallStatus("active");
      } else if (state === "disconnected" || state === "failed" || state === "closed") {
        setCallStatus("ended");
        logMinutesAndFinish();
      }
    };

    const runCall = async () => {
      try {
        // First check media permissions by attempting stream capture
        await service.getLocalMedia(isVideoMode, true);
        
        // Show local feed preview in PiP element
        if (localVideoRef.current && service.localStream) {
          localVideoRef.current.srcObject = service.localStream;
        }

        if (incomingCallId) {
          // Answering incoming call
          setCallStatus("connecting");
          await service.answerIncomingCall(incomingCallId, setupStreams, handleIceState);
          setCallStatus("active");
        } else if (targetPartnerId) {
          // Calling out to partner
          setCallStatus("ringing");
          await service.startOutgoingCall(
            currentUserId,
            targetPartnerId,
            isVideoMode,
            setupStreams,
            handleIceState
          );
        }
      } catch (err) {
        console.error("Call setup error:", err);
        setCallStatus("permission_error");
        setPermissionError(err.message || "Failed to access microphone or camera.");
      }
    };

    runCall();

    // Cleanup call on unmount
    return () => {
      service.terminateLocalCall();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentUserId, incomingCallId, targetPartnerId, isVideoMode]);

  // Handle active session timer
  useEffect(() => {
    if (callStatus === "active") {
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const next = prev + 1;
          durationRef.current = next;
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  // Toggle local Audio transmission
  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    webRtcServiceRef.current.setMute(newMuted);
  };

  // Toggle local Camera stream
  const handleToggleCamera = () => {
    const newCamOff = !isCamOff;
    setIsCamOff(newCamOff);
    webRtcServiceRef.current.setCameraStatus(newCamOff);
  };

  // Terminate active call and inform parent view
  const handleHangUp = async () => {
    setCallStatus("ended");
    await webRtcServiceRef.current.endCallSession();
    await logMinutesAndFinish();
  };

  // Duration Formatter Helper (e.g. 125 -> "02:05")
  const formatCallTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  // Styling based on Slate / Material Design 3 guidelines
  const styles = {
    overlayContainer: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "#0f172a", // Dark space backdrop
      zIndex: 1000,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "24px",
      color: "#f8fafc",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    },
    header: {
      textAlign: "center",
      marginTop: "16px"
    },
    sessionTitle: {
      fontSize: "14px",
      fontWeight: "700",
      letterSpacing: "1px",
      color: "#38bdf8", // Sky blue brand color
      textTransform: "uppercase",
      margin: "0 0 8px 0"
    },
    timerText: {
      fontSize: "36px",
      fontWeight: "800",
      color: "#ffffff",
      margin: 0
    },
    partnerName: {
      fontSize: "16px",
      color: "#94a3b8",
      marginTop: "6px"
    },
    viewport: {
      flex: 1,
      margin: "24px 0",
      borderRadius: "24px",
      backgroundColor: "#1e293b",
      border: "1px solid #334155",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    remoteVideo: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      backgroundColor: "#0f172a"
    },
    localVideoContainer: {
      position: "absolute",
      bottom: "20px",
      right: "20px",
      width: "120px",
      height: "160px",
      borderRadius: "16px",
      overflow: "hidden",
      border: "2px solid #38bdf8",
      backgroundColor: "#334155",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)"
    },
    localVideo: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    },
    waveformContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "24px"
    },
    avatarPulse: {
      width: "120px",
      height: "120px",
      borderRadius: "50%",
      backgroundColor: "rgba(56, 189, 248, 0.15)",
      border: "3px solid #38bdf8",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "36px",
      fontWeight: "bold",
      color: "#38bdf8",
      animation: "pulse 2s infinite ease-in-out"
    },
    hudPanel: {
      backgroundColor: "#1e293b",
      borderRadius: "24px",
      padding: "16px 24px",
      display: "flex",
      justifyContent: "space-evenly",
      alignItems: "center",
      maxWidth: "480px",
      margin: "0 auto 16px auto",
      width: "100%",
      boxSizing: "border-box",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)"
    },
    hudButton: (isActive, isHangUp = false) => ({
      width: "56px",
      height: "56px",
      borderRadius: "50%",
      border: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      fontSize: "18px",
      transition: "background-color 0.2s, transform 0.1s",
      backgroundColor: isHangUp ? "#ef4444" : isActive ? "rgba(255, 255, 255, 0.1)" : "#38bdf8",
      color: isHangUp ? "#ffffff" : isActive ? "#ffffff" : "#0f172a"
    }),
    centerAlert: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px",
      textAlign: "center"
    },
    errorTitle: {
      fontSize: "20px",
      fontWeight: "bold",
      color: "#f87171",
      marginBottom: "12px"
    },
    errorMessage: {
      fontSize: "14px",
      color: "#94a3b8",
      marginBottom: "24px",
      lineHeight: "1.5",
      maxWidth: "360px"
    },
    retryButton: {
      padding: "12px 24px",
      backgroundColor: "#38bdf8",
      color: "#0f172a",
      borderRadius: "12px",
      border: "none",
      fontWeight: "700",
      cursor: "pointer"
    }
  };

  // Add a dynamic keyframes animation for our voice waveforms pulse
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
      @keyframes pulse {
        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.4); }
        70% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(56, 189, 248, 0); }
        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); }
      }
    `;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  return (
    <div style={styles.overlayContainer}>
      {/* HUD Header displaying title & Call timer */}
      <div style={styles.header}>
        <h4 style={styles.sessionTitle}>
          {isVideoMode ? "Video Practice Session" : "Voice Practice Session"}
        </h4>
        <h2 style={styles.timerText}>
          {callStatus === "active" ? formatCallTime(duration) : callStatus.toUpperCase()}
        </h2>
        <p style={styles.partnerName}>
          {partnerProfile ? `Speaking with ${partnerProfile.name}` : "Language Peer"}
        </p>
      </div>

      {/* Main Viewport Grid */}
      <div style={styles.viewport}>
        {callStatus === "permission_error" ? (
          <div style={styles.centerAlert}>
            <div style={styles.errorTitle}>Permissions Required</div>
            <div style={styles.errorMessage}>{permissionError}</div>
            <button style={styles.retryButton} onClick={onCallEnded}>
              Close & Go Back
            </button>
          </div>
        ) : callStatus === "connecting" || callStatus === "ringing" ? (
          <div style={styles.centerAlert}>
            <div style={styles.avatarPulse}>
              {partnerProfile?.name ? partnerProfile.name.charAt(0).toUpperCase() : "..."}
            </div>
            <p style={{ marginTop: "24px", color: "#94a3b8" }}>
              {incomingCallId ? "Establishing encrypted signaling..." : "Ringing peer..."}
            </p>
          </div>
        ) : isVideoMode ? (
          // Video call mode viewports
          <>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={styles.remoteVideo}
              poster="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600"
            />
            {!isCamOff && (
              <div style={styles.localVideoContainer}>
                <video ref={localVideoRef} autoPlay playsInline muted style={styles.localVideo} />
              </div>
            )}
          </>
        ) : (
          // Audio voice-only waveform visual card
          <div style={styles.waveformContainer}>
            <div style={styles.avatarPulse}>
              {partnerProfile?.name ? partnerProfile.name.charAt(0).toUpperCase() : "P"}
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "18px", fontWeight: "600", margin: 0 }}>
                {partnerProfile?.name || "English Peer"}
              </p>
              <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
                Speaking from {partnerProfile?.country || "Earth"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Call Control UI Component */}
      <CallControls
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        isCamOff={isCamOff}
        onToggleCamera={handleToggleCamera}
        isVideoMode={isVideoMode}
        onHangUp={handleHangUp}
      />
    </div>
  );
}
