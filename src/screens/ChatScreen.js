import React, { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase/firebaseConfig";
import { 
  sendChatMessage, 
  subscribeToChatMessages, 
  subscribeToChatDetails, 
  setTypingStatus, 
  markChatAsSeen 
} from "../services/chatService";
import { getAICoachingFeedback, contentModerationCheck } from "../services/aiService";
import { makeCall, endCall } from "../services/callService";
import { blockUser, reportUser } from "../services/matchingService";
import { getUserProfile } from "../services/databaseService";
import { SimpleLevelBadge } from "../components/LevelProgressCard";

/**
 * ChatScreen Component
 * A production-grade chat client featuring real-time syncing, AI coaching, safety features,
 * seen receipts, typing indicators, and seamless voice calling.
 */
export default function ChatScreen({ currentUserId, partnerId, onBackClick, onStartVoiceCall }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [chatDetails, setChatDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  
  // Real-time states
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [isTypingLocal, setIsTypingLocal] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Safety System modals
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("Inappropriate behavior");
  const [reportDetails, setReportDetails] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);

  // AI Assistant settings
  const [aiEnabled, setAiEnabled] = useState(true);
  const [activeAiFeedback, setActiveAiFeedback] = useState(null); // Selected message's AI coach popup data

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch partner profile & subscribe to messages and typing updates
  useEffect(() => {
    if (!currentUserId || !partnerId) {
      setError("Invalid chat session details.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    // 1. Get partner details
    getUserProfile(partnerId)
      .then((profile) => {
        if (profile) {
          setPartnerProfile(profile);
          setIsPartnerOnline(profile.isOnline === true);
        } else {
          setPartnerProfile({ name: "Language Partner", englishLevel: "Intermediate", interests: [] });
        }
      })
      .catch((err) => console.error("Error loading partner profile:", err));

    // 2. Real-time Message Stream
    const unsubMessages = subscribeToChatMessages(currentUserId, partnerId, (chatMessages) => {
      setMessages(chatMessages);
      setLoading(false);
      setTimeout(scrollToBottom, 50);
      
      // Auto-mark conversation as seen when new messages arrive and we are actively reading
      markChatAsSeen(currentUserId, partnerId);
    });

    // 3. Real-time Chat Details (typing status and seen receipts)
    const unsubDetails = subscribeToChatDetails(currentUserId, partnerId, (details) => {
      setChatDetails(details);
      
      // Update typing state for partner
      if (details?.typingStatus && details.typingStatus[partnerId] !== undefined) {
        setIsPartnerTyping(details.typingStatus[partnerId]);
      }
    });

    return () => {
      if (unsubMessages) unsubMessages();
      if (unsubDetails) unsubDetails();
    };
  }, [currentUserId, partnerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPartnerTyping]);

  // Handle local typing indicator events
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);

    if (!isTypingLocal) {
      setIsTypingLocal(true);
      setTypingStatus(currentUserId, partnerId, true);
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTypingLocal(false);
      setTypingStatus(currentUserId, partnerId, false);
    }, 2000); // 2 seconds delay
  };

  // Handle sending message with real-time AI Coaching evaluation
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const textToSend = newMessage.trim();
    if (!textToSend || sending) return;

    // Safety Filter Check (Local Basic Moderation)
    if (!contentModerationCheck(textToSend)) {
      setError("Message content contains restricted language.");
      setTimeout(() => setError(""), 4000);
      return;
    }

    setSending(true);
    // Immediately set typing off
    setIsTypingLocal(false);
    setTypingStatus(currentUserId, partnerId, false);

    try {
      let aiFeedback = null;

      // Call AI Coach in real-time if enabled
      if (aiEnabled) {
        aiFeedback = await getAICoachingFeedback(textToSend);
      }

      await sendChatMessage(currentUserId, partnerId, textToSend, "text", aiFeedback);
      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to deliver message. Please check network connection.");
      setTimeout(() => setError(""), 4000);
    } finally {
      setSending(false);
    }
  };

  // Handle blocking user
  const handleBlockUser = async () => {
    const confirmBlock = window.confirm(`Are you sure you want to block ${partnerProfile?.name || "this user"}? You won't see them in matches or chats.`);
    if (confirmBlock) {
      try {
        await blockUser(currentUserId, partnerId);
        setIsBlocked(true);
        setError("User blocked successfully.");
        setTimeout(() => {
          if (onBackClick) onBackClick();
        }, 1500);
      } catch (err) {
        setError("Failed to block user. Try again.");
      }
    }
  };

  // Handle filing safety report
  const handleFileReport = async (e) => {
    e.preventDefault();
    try {
      await reportUser(currentUserId, partnerId, reportReason, reportDetails);
      setShowReportModal(false);
      setReportDetails("");
      alert("Thank you. Safety report submitted to moderation team.");
    } catch (err) {
      setError("Failed to submit report. Please try again.");
    }
  };

  // Modern Design Theme Styled Constants
  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      height: "560px",
      maxWidth: "540px",
      margin: "20px auto",
      backgroundColor: "#1e293b",
      borderRadius: "24px",
      boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3), 0 10px 10px -5px rgba(0,0,0,0.3)",
      border: "1px solid #334155",
      color: "#f8fafc",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      overflow: "hidden"
    },
    header: {
      display: "flex",
      alignItems: "center",
      padding: "16px 20px",
      backgroundColor: "#0f172a",
      borderBottom: "1px solid #334155",
      gap: "12px"
    },
    backBtn: {
      background: "none",
      border: "none",
      color: "#94a3b8",
      fontSize: "18px",
      cursor: "pointer",
      padding: "4px 8px"
    },
    avatarContainer: {
      position: "relative",
      flexShrink: 0
    },
    avatar: {
      width: "42px",
      height: "42px",
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
    onlineStatus: {
      position: "absolute",
      bottom: 0,
      right: 0,
      width: "11px",
      height: "11px",
      borderRadius: "50%",
      backgroundColor: isPartnerOnline ? "#10b981" : "#64748b",
      border: "2px solid #0f172a"
    },
    headerInfo: {
      flex: 1,
      minWidth: 0
    },
    partnerName: {
      fontSize: "15px",
      fontWeight: "700",
      color: "#f8fafc",
      margin: 0,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    },
    partnerStatusText: {
      fontSize: "11px",
      color: "#38bdf8",
      margin: "2px 0 0 0",
      display: "flex",
      alignItems: "center",
      gap: "6px"
    },
    actionContainer: {
      display: "flex",
      gap: "8px",
      alignItems: "center"
    },
    iconBtn: {
      background: "none",
      border: "none",
      color: "#38bdf8",
      fontSize: "18px",
      cursor: "pointer",
      padding: "8px",
      borderRadius: "50%",
      backgroundColor: "#1e293b",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "background-color 0.2s"
    },
    safetyBtn: {
      background: "none",
      border: "none",
      color: "#f87171",
      fontSize: "14px",
      cursor: "pointer",
      padding: "6px 10px",
      borderRadius: "8px",
      backgroundColor: "rgba(248, 113, 113, 0.1)",
      fontWeight: "600"
    },
    chatArea: {
      flex: 1,
      padding: "16px",
      overflowY: "auto",
      backgroundColor: "#0f172a",
      display: "flex",
      flexDirection: "column",
      gap: "12px"
    },
    messageRow: (isMe) => ({
      display: "flex",
      justifyContent: isMe ? "flex-end" : "flex-start",
      width: "100%",
      margin: "2px 0"
    }),
    messageBubble: (isMe) => ({
      maxWidth: "75%",
      padding: "10px 14px",
      borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
      backgroundColor: isMe ? "#0284c7" : "#1e293b",
      color: "#ffffff",
      fontSize: "14px",
      lineHeight: "1.4",
      position: "relative",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)"
    }),
    metaRow: {
      display: "flex",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: "4px",
      fontSize: "9px",
      color: "rgba(255, 255, 255, 0.5)",
      marginTop: "4px"
    },
    aiBadge: {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      fontSize: "10px",
      color: "#38bdf8",
      backgroundColor: "rgba(56, 189, 248, 0.15)",
      padding: "2px 6px",
      borderRadius: "6px",
      cursor: "pointer",
      marginTop: "6px",
      border: "1px solid rgba(56, 189, 248, 0.3)",
      fontWeight: "600"
    },
    inputForm: {
      display: "flex",
      padding: "14px",
      backgroundColor: "#1e293b",
      borderTop: "1px solid #334155",
      gap: "8px",
      alignItems: "center"
    },
    input: {
      flex: 1,
      padding: "10px 14px",
      borderRadius: "12px",
      backgroundColor: "#0f172a",
      border: "1px solid #334155",
      color: "#f8fafc",
      fontSize: "14px",
      outline: "none"
    },
    sendBtn: {
      padding: "10px 16px",
      backgroundColor: "#0284c7",
      color: "#ffffff",
      border: "none",
      borderRadius: "12px",
      fontWeight: "700",
      cursor: "pointer"
    },
    aiCoachPopup: {
      backgroundColor: "#1e293b",
      border: "1px solid #38bdf8",
      borderRadius: "16px",
      padding: "12px 16px",
      margin: "8px 16px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      fontSize: "13px"
    },
    coachHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: "1px solid #334155",
      paddingBottom: "6px",
      fontWeight: "700",
      color: "#38bdf8"
    },
    correctionText: {
      backgroundColor: "rgba(16, 185, 129, 0.1)",
      color: "#10b981",
      padding: "6px 10px",
      borderRadius: "8px",
      fontStyle: "italic",
      margin: "4px 0"
    },
    reportModal: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(15, 23, 42, 0.75)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    },
    reportBox: {
      backgroundColor: "#1e293b",
      padding: "24px",
      borderRadius: "20px",
      width: "90%",
      maxWidth: "400px",
      border: "1px solid #334155"
    }
  };

  const isLastMsgSeen = chatDetails?.seenStatus && chatDetails.seenStatus[partnerId] === true;

  return (
    <div style={styles.container}>
      {/* 1. Top Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBackClick}>
          ◀
        </button>
        <div style={styles.avatarContainer}>
          <div style={styles.avatar}>
            {partnerProfile?.name ? partnerProfile.name.charAt(0).toUpperCase() : "P"}
          </div>
          <span style={styles.onlineStatus} />
        </div>
        <div style={styles.headerInfo}>
          <h3 style={styles.partnerName}>{partnerProfile?.name || "Connecting..."}</h3>
          <div style={styles.partnerStatusText}>
            <SimpleLevelBadge level={partnerProfile?.englishLevel || "Intermediate"} />
            <span>{isPartnerOnline ? "• Online" : "• Offline"}</span>
          </div>
        </div>
        <div style={styles.actionContainer}>
          <button 
            style={styles.iconBtn} 
            title="Start Voice Call"
            onClick={() => onStartVoiceCall && onStartVoiceCall(partnerId, false)}
          >
            🎙️
          </button>
          <button style={styles.safetyBtn} onClick={() => setShowReportModal(true)}>
            🚨 Report
          </button>
          <button style={{ ...styles.safetyBtn, backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }} onClick={handleBlockUser}>
            🚫 Block
          </button>
        </div>
      </div>

      {error && <div style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#f87171", padding: "10px", fontSize: "12px", margin: "8px 16px", borderRadius: "10px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>{error}</div>}

      {/* AI AI Coach Popup Accordion */}
      {activeAiFeedback && (
        <div style={styles.aiCoachPopup}>
          <div style={styles.coachHeader}>
            <span>🤖 AI English Coach Feedback</span>
            <button style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "14px" }} onClick={() => setActiveAiFeedback(null)}>✕</button>
          </div>
          <div>
            <strong>Difficulty Level Score:</strong> <span style={{ color: "#38bdf8", fontWeight: "bold" }}>{activeAiFeedback.level || "N/A"}</span>
          </div>
          {activeAiFeedback.hasErrors ? (
            <>
              <div><strong>Suggested Correction:</strong></div>
              <div style={styles.correctionText}>"{activeAiFeedback.correction}"</div>
            </>
          ) : (
            <div style={{ color: "#10b981", fontWeight: "600", margin: "4px 0" }}>✓ Perfect Grammar! Outstanding work.</div>
          )}
          {activeAiFeedback.explanation && (
            <div><strong>Explanation:</strong> {activeAiFeedback.explanation}</div>
          )}
          {activeAiFeedback.suggestions && (
            <div><strong>Better Way to Express:</strong> {activeAiFeedback.suggestions}</div>
          )}
          {activeAiFeedback.autoReplies && activeAiFeedback.autoReplies.length > 0 && (
            <div style={{ marginTop: "6px" }}>
              <strong>Suggested Quick Responses:</strong>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                {activeAiFeedback.autoReplies.map((reply, i) => (
                  <span 
                    key={i} 
                    onClick={() => {
                      setNewMessage(reply);
                      setActiveAiFeedback(null);
                    }}
                    style={{ fontSize: "11px", backgroundColor: "rgba(56, 189, 248, 0.1)", border: "1px solid rgba(56, 189, 248, 0.2)", borderRadius: "6px", padding: "4px 8px", color: "#38bdf8", cursor: "pointer" }}
                  >
                    "{reply}"
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Messages Stream */}
      <div style={styles.chatArea}>
        {loading ? (
          <div style={{ textAlign: "center", color: "#64748b", margin: "auto" }}>Syncing direct messages...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "#64748b", margin: "auto", padding: "0 24px" }}>
            <p style={{ fontWeight: "700", color: "#94a3b8" }}>🚀 Start a Conversation</p>
            <p style={{ fontSize: "12px" }}>Say hello! Ask about their interests, native language, or schedule an English voice call.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === currentUserId;
            const hasFeedback = msg.aiFeedback !== undefined && msg.aiFeedback !== null;
            return (
              <div key={msg.id || idx} style={styles.messageRow(isMe)}>
                <div style={styles.messageBubble(isMe)}>
                  <div>{msg.text}</div>
                  
                  {/* Inline AI Coaching Trigger */}
                  {hasFeedback && (
                    <div 
                      style={styles.aiBadge} 
                      onClick={() => setActiveAiFeedback(msg.aiFeedback)}
                    >
                      <span>🤖 AI Coach ({msg.aiFeedback.level})</span>
                    </div>
                  )}

                  <div style={styles.metaRow}>
                    <span>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</span>
                    {isMe && (
                      <span style={{ color: "#38bdf8" }}>
                        {idx === messages.length - 1 && isLastMsgSeen ? "Seen ✓✓" : "Delivered ✓"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Real-time typing status */}
        {isPartnerTyping && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#94a3b8", fontSize: "12px", marginLeft: "4px" }}>
            <span style={{ width: "6px", height: "6px", backgroundColor: "#38bdf8", borderRadius: "50%", display: "inline-block", animation: "pulse 1.5s infinite" }} />
            <span>{partnerProfile?.name || "Partner"} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Input Message Panel */}
      <form style={styles.inputForm} onSubmit={handleSendMessage}>
        <button 
          type="button" 
          onClick={() => setAiEnabled(!aiEnabled)}
          style={{
            ...styles.iconBtn,
            backgroundColor: aiEnabled ? "rgba(56, 189, 248, 0.15)" : "#0f172a",
            color: aiEnabled ? "#38bdf8" : "#64748b",
            fontSize: "14px"
          }}
          title={aiEnabled ? "Real-time AI Coach Enabled" : "Real-time AI Coach Disabled"}
        >
          🤖
        </button>
        <input
          style={styles.input}
          type="text"
          placeholder="Send an English message..."
          value={newMessage}
          onChange={handleInputChange}
          maxLength={1000}
        />
        <button 
          type="submit" 
          style={{ ...styles.sendBtn, opacity: newMessage.trim() ? 1 : 0.6 }}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? "..." : "Send"}
        </button>
      </form>

      {/* Safety Report Modal */}
      {showReportModal && (
        <div style={styles.reportModal}>
          <form style={styles.reportBox} onSubmit={handleFileReport}>
            <h3 style={{ margin: "0 0 16px 0", color: "#f87171" }}>🚨 Report User</h3>
            
            <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Reason:</label>
            <select 
              value={reportReason} 
              onChange={(e) => setReportReason(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "8px", backgroundColor: "#0f172a", border: "1px solid #334155", color: "#f8fafc", marginBottom: "16px" }}
            >
              <option value="Inappropriate behavior">Inappropriate behavior</option>
              <option value="Harassment">Harassment / Bullying</option>
              <option value="Spam / Scams">Spam / Advertising</option>
              <option value="Fake profile">Fake Profile / Bot</option>
            </select>

            <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Details:</label>
            <textarea
              required
              rows={4}
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Please provide specifics about this interaction..."
              style={{ width: "100%", padding: "8px", borderRadius: "8px", backgroundColor: "#0f172a", border: "1px solid #334155", color: "#f8fafc", marginBottom: "16px", resize: "none" }}
            />

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowReportModal(false)} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "none", color: "#94a3b8", cursor: "pointer" }}>Cancel</button>
              <button type="submit" style={{ padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: "#ef4444", color: "white", fontWeight: "700", cursor: "pointer" }}>Submit Report</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
