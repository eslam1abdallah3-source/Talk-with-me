import React, { useState, useEffect, useRef } from "react";
import { 
  subscribeToChatMessages, 
  sendChatMessage, 
  getUserProfile 
} from "./databaseService";
import { SimpleLevelBadge } from "./LevelProgressCard";

/**
 * ChatWindow Component
 * A modern, highly-polished chat interface for language exchanges.
 * Supports real-time Firestore synchronization, auto-scrolling, and partner profile headers.
 * 
 * @param {Object} props
 * @param {string} props.currentUserId - Authenticated user's unique ID
 * @param {string} props.partnerId - Language partner's unique ID
 * @param {Function} [props.onBackClick] - Optional callback to handle close/back navigation
 */
export default function ChatWindow({ currentUserId, partnerId, onBackClick }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch partner details and set up real-time message subscription
  useEffect(() => {
    if (!currentUserId || !partnerId) {
      setError("Invalid chat session details.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    // Fetch speaking partner's profile
    getUserProfile(partnerId)
      .then((profile) => {
        if (profile) {
          setPartnerProfile(profile);
        } else {
          setPartnerProfile({ name: "Language Partner", englishLevel: "N/A", interests: [] });
        }
      })
      .catch((err) => {
        console.error("Error loading partner profile:", err);
      });

    // Subscribe to firestore messages in real-time
    const unsubscribe = subscribeToChatMessages(currentUserId, partnerId, (chatMessages) => {
      setMessages(chatMessages);
      setLoading(false);
      // Wait a tiny bit for render cycle then scroll
      setTimeout(scrollToBottom, 50);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUserId, partnerId]);

  // Handle auto-scroll whenever messages list changes
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle sending a new text message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const textToSend = newMessage.trim();
    if (!textToSend || sending) return;

    setSending(true);
    try {
      await sendChatMessage(currentUserId, partnerId, textToSend);
      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to deliver message. Check connection.");
      setTimeout(() => setError(""), 4000);
    } finally {
      setSending(false);
    }
  };

  // Format message timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Modern Slate & Light Blue Design Theme (to match UserProfile & Android layout styling)
  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      height: "550px",
      maxWidth: "540px",
      margin: "20px auto",
      backgroundColor: "#1e293b", // Slate dark background
      borderRadius: "24px",
      boxShadow: "0 15px 30px -10px rgba(0, 0, 0, 0.4), 0 10px 15px -8px rgba(0, 0, 0, 0.4)",
      border: "1px solid #334155",
      color: "#f8fafc",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      overflow: "hidden"
    },
    header: {
      display: "flex",
      alignItems: "center",
      padding: "16px 20px",
      backgroundColor: "#0f172a",
      borderBottom: "1px solid #334155",
      gap: "14px"
    },
    backButton: {
      background: "none",
      border: "none",
      color: "#38bdf8",
      fontSize: "15px",
      fontWeight: "600",
      cursor: "pointer",
      padding: "8px 12px",
      borderRadius: "8px",
      transition: "background-color 0.2s",
      marginRight: "4px"
    },
    avatar: {
      width: "44px",
      height: "44px",
      borderRadius: "50%",
      backgroundColor: "rgba(56, 189, 248, 0.15)",
      border: "2px solid #38bdf8",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "700",
      color: "#38bdf8",
      fontSize: "18px"
    },
    headerDetails: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      minWidth: 0
    },
    partnerName: {
      fontSize: "16px",
      fontWeight: "700",
      color: "#f8fafc",
      margin: 0,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    },
    partnerSub: {
      fontSize: "12px",
      color: "#94a3b8",
      margin: "2px 0 0 0",
      display: "flex",
      gap: "8px"
    },
    badge: {
      backgroundColor: "rgba(56, 189, 248, 0.1)",
      color: "#38bdf8",
      padding: "1px 6px",
      borderRadius: "4px",
      fontSize: "10px",
      fontWeight: "600"
    },
    chatArea: {
      flex: 1,
      padding: "20px",
      overflowY: "auto",
      backgroundColor: "#0f172a",
      display: "flex",
      flexDirection: "column",
      gap: "14px"
    },
    messageRow: (isMe) => ({
      display: "flex",
      justifyContent: isMe ? "flex-end" : "flex-start",
      width: "100%"
    }),
    messageBubble: (isMe) => ({
      maxWidth: "75%",
      padding: "12px 16px",
      borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
      backgroundColor: isMe ? "#0284c7" : "#334155", // custom modern active coloring
      color: "#ffffff",
      fontSize: "14.5px",
      lineHeight: "1.4",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)"
    }),
    messageMeta: {
      display: "flex",
      justifyContent: "flex-end",
      fontSize: "10px",
      color: "rgba(255, 255, 255, 0.6)",
      marginTop: "4px",
      gap: "4px"
    },
    inputForm: {
      display: "flex",
      padding: "16px",
      backgroundColor: "#1e293b",
      borderTop: "1px solid #334155",
      gap: "10px",
      alignItems: "center"
    },
    inputField: {
      flex: 1,
      padding: "12px 16px",
      borderRadius: "14px",
      backgroundColor: "#0f172a",
      border: "1px solid #334155",
      color: "#f8fafc",
      fontSize: "14px",
      outline: "none",
      transition: "border-color 0.2s"
    },
    sendButton: {
      padding: "12px 20px",
      backgroundColor: "#0284c7",
      color: "#ffffff",
      borderRadius: "14px",
      border: "none",
      fontWeight: "600",
      fontSize: "14px",
      cursor: "pointer",
      transition: "opacity 0.2s"
    },
    loadingContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      color: "#94a3b8"
    },
    emptyContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      color: "#64748b",
      textAlign: "center",
      padding: "0 40px"
    },
    interestList: {
      fontSize: "11px",
      color: "#64748b",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      maxWidth: "180px"
    },
    errorAlert: {
      backgroundColor: "rgba(239, 68, 68, 0.15)",
      color: "#f87171",
      padding: "8px 12px",
      borderRadius: "8px",
      fontSize: "12px",
      margin: "10px 16px 0 16px",
      border: "1px solid rgba(239, 68, 68, 0.2)"
    }
  };

  return (
    <div style={styles.container}>
      {/* Header with Partner Info */}
      <div style={styles.header}>
        {onBackClick && (
          <button style={styles.backButton} onClick={onBackClick}>
            ✕ Close
          </button>
        )}
        <div style={styles.avatar}>
          {partnerProfile?.name ? partnerProfile.name.charAt(0).toUpperCase() : "P"}
        </div>
        <div style={styles.headerDetails}>
          <h3 style={styles.partnerName}>{partnerProfile?.name || "Loading..."}</h3>
          <div style={{ ...styles.partnerSub, alignItems: "center" }}>
            <SimpleLevelBadge level={partnerProfile?.englishLevel || "Intermediate"} style={{ transform: "scale(0.85)", transformOrigin: "left center", padding: "2px 6px" }} />
            {partnerProfile?.interests && partnerProfile.interests.length > 0 && (
              <span style={styles.interestList}>
                Interests: {partnerProfile.interests.slice(0, 2).join(", ")}
              </span>
            )}
          </div>
        </div>
      </div>

      {error && <div style={styles.errorAlert}>{error}</div>}

      {/* Real-time Message Area */}
      <div style={styles.chatArea}>
        {loading ? (
          <div style={styles.loadingContainer}>
            <p>Syncing encrypted messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div style={styles.emptyContainer}>
            <p style={{ fontSize: "16px", fontWeight: "600", marginBottom: "6px", color: "#94a3b8" }}>
              Start of speaking circle
            </p>
            <p style={{ fontSize: "13px", margin: 0 }}>
              Send a warm greeting! Introduce yourself, your native language, and plan a practice call together.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div key={msg.id} style={styles.messageRow(isMe)}>
                <div style={styles.messageBubble(isMe)}>
                  <div>{msg.text}</div>
                  <div style={styles.messageMeta}>
                    <span>{formatTime(msg.timestamp)}</span>
                    {isMe && <span>✓</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Message Form */}
      <form style={styles.inputForm} onSubmit={handleSendMessage}>
        <input
          style={styles.inputField}
          type="text"
          placeholder="Type an English message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={loading}
          maxLength={800}
        />
        <button
          type="submit"
          style={{
            ...styles.sendButton,
            opacity: newMessage.trim() && !sending ? 1 : 0.6,
            cursor: newMessage.trim() && !sending ? "pointer" : "not-allowed"
          }}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}
