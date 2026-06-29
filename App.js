import React, { useState, useEffect } from "react";
import { 
  HashRouter, 
  Routes, 
  Route, 
  NavLink, 
  Navigate,
  useNavigate,
  useLocation
} from "react-router-dom";
import { auth, db } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { 
  signInWithEmail, 
  signUpWithEmail, 
  signInWithGoogle, 
  logoutUser,
  initAuthPersistence 
} from "./authService";
import { saveUserProfile, subscribeToConversations } from "./databaseService";
import UserProfile from "./UserProfile";
import ChatWindow from "./ChatWindow";
import MatchingView from "./MatchingView";
import HistoryView from "./HistoryView";
import CallWindow from "./CallWindow";
import SidebarTips from "./SidebarTips";
import IncomingCallAlert from "./IncomingCallAlert";
import PostCallRating from "./PostCallRating";
import DailyGoalsTracker from "./DailyGoalsTracker";
import DailyVocabularyQuiz from "./DailyVocabularyQuiz";

// Initialize local session storage persistence immediately
initAuthPersistence().catch(console.error);

/**
 * Modern Material Slate login and registration screen
 */
function LoginScreen({ onAuthSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all credentials.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      if (isRegistering) {
        if (!displayName.trim()) {
          setError("Please specify a display name.");
          setLoading(false);
          return;
        }
        const user = await signUpWithEmail(email, password);
        // Save initial profile setup in Firestore
        await saveUserProfile(user.uid, {
          name: displayName.trim(),
          email: email.trim(),
          englishLevel: "Intermediate",
          country: "United States",
          nativeLanguage: "Spanish",
          interests: ["Music", "Travel", "Tech"],
          isOnline: true,
          lastActive: Date.now()
        });
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const user = await signInWithGoogle();
      // Ensure profile document matches Google Auth profile
      await saveUserProfile(user.uid, {
        name: user.displayName || "Google Peer",
        email: user.email,
        englishLevel: "Intermediate",
        country: "United States",
        nativeLanguage: "Spanish",
        interests: ["Music", "Travel", "Tech"],
        isOnline: true,
        lastActive: Date.now()
      });
    } catch (err) {
      console.error(err);
      setError("Google authentication cancelled or blocked.");
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    card: {
      maxWidth: "420px",
      margin: "60px auto",
      padding: "36px",
      borderRadius: "24px",
      backgroundColor: "#1e293b",
      color: "#f8fafc",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.4)",
      border: "1px solid #334155",
      boxSizing: "border-box"
    },
    title: {
      fontSize: "28px",
      fontWeight: "800",
      color: "#38bdf8",
      marginBottom: "6px",
      textAlign: "center",
      letterSpacing: "-0.5px"
    },
    subtitle: {
      fontSize: "13px",
      color: "#94a3b8",
      marginBottom: "28px",
      textAlign: "center"
    },
    formGroup: {
      marginBottom: "18px"
    },
    label: {
      display: "block",
      fontSize: "13px",
      color: "#94a3b8",
      marginBottom: "6px",
      fontWeight: "500"
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
      boxSizing: "border-box"
    },
    button: {
      width: "100%",
      padding: "13px",
      borderRadius: "12px",
      backgroundColor: "#0284c7",
      color: "#ffffff",
      fontSize: "15px",
      fontWeight: "600",
      border: "none",
      cursor: "pointer",
      marginTop: "12px",
      transition: "background-color 0.2s"
    },
    googleButton: {
      width: "100%",
      padding: "12px",
      borderRadius: "12px",
      backgroundColor: "#ffffff",
      color: "#1e293b",
      fontSize: "14px",
      fontWeight: "600",
      border: "1px solid #cbd5e1",
      cursor: "pointer",
      marginTop: "16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px"
    },
    divider: {
      display: "flex",
      alignItems: "center",
      margin: "20px 0",
      color: "#64748b",
      fontSize: "12px"
    },
    dividerLine: {
      flex: 1,
      height: "1px",
      backgroundColor: "#334155"
    },
    toggleText: {
      textAlign: "center",
      fontSize: "13.5px",
      color: "#94a3b8",
      marginTop: "20px"
    },
    toggleLink: {
      color: "#38bdf8",
      cursor: "pointer",
      fontWeight: "600",
      marginLeft: "4px"
    },
    errorAlert: {
      backgroundColor: "rgba(239, 68, 68, 0.15)",
      color: "#f87171",
      padding: "10px 14px",
      borderRadius: "10px",
      fontSize: "13px",
      marginBottom: "20px",
      border: "1px solid rgba(239, 68, 68, 0.2)"
    }
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>English Circle</h2>
      <p style={styles.subtitle}>Speak English with global language partners</p>

      {error && <div style={styles.errorAlert}>{error}</div>}

      <form onSubmit={handleAuth}>
        {isRegistering && (
          <div style={styles.formGroup}>
            <label style={styles.label}>Full Name</label>
            <input
              style={styles.input}
              type="text"
              placeholder="e.g. Liam Smith"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
        )}

        <div style={styles.formGroup}>
          <label style={styles.label}>Email Address</label>
          <input
            style={styles.input}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Authenticating session..." : isRegistering ? "Create Free Account" : "Sign In & Practice"}
        </button>
      </form>

      <div style={styles.divider}>
        <div style={styles.dividerLine} />
        <span style={{ padding: "0 10px" }}>OR</span>
        <div style={styles.dividerLine} />
      </div>

      <button style={styles.googleButton} onClick={handleGoogleSignIn} disabled={loading}>
        <svg style={{ width: "18px", height: "18px" }} viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.99 5.99 0 0 1 8 12.527a5.99 5.99 0 0 1 5.99-5.99c2.443 0 4.545 1.458 5.483 3.565l3.961-3.072C21.05 3.324 17.755 1 13.99 1 7.644 1 2.5 6.144 2.5 12.49c0 6.345 5.144 11.49 11.49 11.49 5.762 0 10.278-4.048 10.278-10.284 0-.54-.055-1.06-.144-1.571l-11.884.16z"
          />
        </svg>
        Sign In with Google
      </button>

      <p style={styles.toggleText}>
        {isRegistering ? "Already have an account?" : "New to English Circle?"}
        <span
          style={styles.toggleLink}
          onClick={() => {
            setIsRegistering(!isRegistering);
            setError("");
          }}
        >
          {isRegistering ? "Sign In" : "Register Now"}
        </span>
      </p>
    </div>
  );
}

/**
 * Navigation Bar Layout holding persistent sidebar/tabs
 */
function MainLayout({ currentUser, onLogout, activeCallDetails, setActiveCallDetails }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [selectedChatPartner, setSelectedChatPartner] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showFeedbackPartnerId, setShowFeedbackPartnerId] = useState(null);

  // Listen to window size to make sidebar layouts fully responsive
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Monitor conversation channels in real-time
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToConversations(currentUser.uid, (convList) => {
      setConversations(convList);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  // Handle navigating from matchmaking success directly into active chats
  const handlePartnerSelect = (partner) => {
    setSelectedChatPartner(partner);
    navigate("/chat");
  };

  // Launch direct CallWindow Overlay
  const handleStartCall = (partnerId, isVideo) => {
    setActiveCallDetails({
      partnerId,
      isVideo,
      incomingCallId: null
    });
  };

  const handleLogout = async () => {
    await logoutUser();
    navigate("/");
  };

  const styles = {
    appWrapper: {
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      backgroundColor: "#0f172a",
      color: "#f8fafc",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    },
    topBar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 24px",
      backgroundColor: "#1e293b",
      borderBottom: "1px solid #334155"
    },
    logo: {
      fontSize: "20px",
      fontWeight: "800",
      color: "#38bdf8",
      letterSpacing: "-0.5px",
      textDecoration: "none"
    },
    userPill: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      backgroundColor: "#0f172a",
      padding: "6px 14px",
      borderRadius: "20px",
      fontSize: "13px",
      border: "1px solid #334155"
    },
    avatar: {
      width: "24px",
      height: "24px",
      borderRadius: "50%",
      backgroundColor: "#38bdf8",
      color: "#0f172a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "bold",
      fontSize: "12px"
    },
    logoutBtn: {
      background: "none",
      border: "none",
      color: "#ef4444",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "12px",
      padding: "2px 6px"
    },
    layoutBody: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      flex: 1,
      maxWidth: "1250px",
      margin: "0 auto",
      width: "100%",
      boxSizing: "border-box",
      padding: isMobile ? "0 16px" : "0 24px",
      gap: "24px",
      minHeight: 0
    },
    contentArea: {
      flex: 1,
      padding: "20px 0",
      boxSizing: "border-box",
      minWidth: 0
    },
    sidebarContainer: {
      width: isMobile ? "100%" : "300px",
      padding: isMobile ? "0 0 40px 0" : "20px 0",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      gap: "24px",
      justifyContent: "flex-start",
      alignItems: "stretch",
      flexShrink: 0
    },
    navBar: {
      display: "flex",
      justifyContent: "space-around",
      backgroundColor: "#1e293b",
      borderTop: "1px solid #334155",
      padding: "12px 0",
      position: "sticky",
      bottom: 0,
      width: "100%",
      zIndex: 10
    },
    navLink: (isActive) => ({
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textDecoration: "none",
      color: isActive ? "#38bdf8" : "#94a3b8",
      fontSize: "11px",
      fontWeight: "500",
      gap: "4px",
      transition: "color 0.2s"
    }),
    navIcon: {
      fontSize: "20px"
    },
    chatLayout: {
      display: "grid",
      gridTemplateColumns: "1fr",
      maxWidth: "540px",
      margin: "0 auto",
      height: "550px",
      borderRadius: "24px",
      border: "1px solid #334155",
      backgroundColor: "#1e293b",
      overflow: "hidden"
    },
    convListHeader: {
      padding: "16px 20px",
      borderBottom: "1px solid #334155",
      backgroundColor: "#0f172a",
      margin: 0,
      fontSize: "16px",
      fontWeight: "700"
    },
    convScroll: {
      overflowY: "auto",
      flex: 1
    },
    convItem: (isSelected) => ({
      display: "flex",
      alignItems: "center",
      padding: "14px 20px",
      borderBottom: "1px solid #334155",
      cursor: "pointer",
      backgroundColor: isSelected ? "rgba(56, 189, 248, 0.08)" : "transparent",
      transition: "background-color 0.2s"
    }),
    convName: {
      fontWeight: "600",
      fontSize: "14px",
      margin: "0 0 4px 0"
    },
    convText: {
      fontSize: "12px",
      color: "#94a3b8",
      margin: 0,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      maxWidth: "280px"
    }
  };

  return (
    <div style={styles.appWrapper}>
      {/* Persistent App Header */}
      <header style={styles.topBar}>
        <NavLink to="/matching" style={styles.logo}>
          🌎 English Circle
        </NavLink>
        <div style={styles.userPill}>
          <div style={styles.avatar}>
            {currentUser.email ? currentUser.email.charAt(0).toUpperCase() : "U"}
          </div>
          <span>{currentUser.email}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Main Dynamic Viewport with Sidebar Layout */}
      <div style={styles.layoutBody}>
        <main style={styles.contentArea}>
          <Routes>
            <Route 
              path="/matching" 
              element={
                <MatchingView 
                  currentUserId={currentUser.uid} 
                  onPartnerSelected={handlePartnerSelect}
                  onStartCall={handleStartCall}
                />
              } 
            />
            <Route 
              path="/profile" 
              element={<UserProfile />} 
            />
            <Route 
              path="/chat" 
              element={
                selectedChatPartner ? (
                  <ChatWindow 
                    currentUserId={currentUser.uid} 
                    partnerId={selectedChatPartner.id} 
                    onBackClick={() => setSelectedChatPartner(null)}
                  />
                ) : (
                  <div style={styles.chatLayout}>
                    <h3 style={styles.convListHeader}>My Conversational Circles</h3>
                    <div style={styles.convScroll}>
                      {conversations.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "60px 24px", color: "#64748b" }}>
                          <p style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>No active chats yet</p>
                          <p style={{ fontSize: "12px" }}>Find a language peer in the Matching tab to start exchanging text messages!</p>
                        </div>
                      ) : (
                        conversations.map((conv) => {
                          // Find partner ID
                          const partnerId = conv.participants.find(p => p !== currentUser.uid) || "Partner";
                          return (
                            <div 
                              key={conv.id} 
                              style={styles.convItem(false)}
                              onClick={() => setSelectedChatPartner({ id: partnerId })}
                            >
                              <div style={{ ...styles.avatar, width: "36px", height: "36px", marginRight: "12px", fontSize: "14px" }}>
                                {partnerId.charAt(0).toUpperCase()}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <h4 style={styles.convName}>Peer ID: {partnerId.substring(0, 8)}...</h4>
                                <p style={styles.convText}>{conv.lastMessage || "No messages yet"}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )
              } 
            />
            <Route 
              path="/history" 
              element={
                <HistoryView 
                  currentUserId={currentUser.uid} 
                  conversations={conversations} 
                  onPartnerSelected={handlePartnerSelect}
                />
              } 
            />
            <Route path="*" element={<Navigate to="/matching" replace />} />
          </Routes>
        </main>

        <aside style={styles.sidebarContainer}>
          <DailyGoalsTracker userId={currentUser.uid} />
          <DailyVocabularyQuiz />
          <SidebarTips />
        </aside>
      </div>

      {/* Persistent Bottom Tab Navigation (Material M3 inspired) */}
      <nav style={styles.navBar}>
        <NavLink 
          to="/matching" 
          style={({ isActive }) => styles.navLink(isActive)}
        >
          <span style={styles.navIcon}>🔍</span>
          <span>Match</span>
        </NavLink>
        <NavLink 
          to="/chat" 
          style={({ isActive }) => styles.navLink(isActive || selectedChatPartner !== null)}
        >
          <span style={styles.navIcon}>💬</span>
          <span>Chats</span>
        </NavLink>
        <NavLink 
          to="/profile" 
          style={({ isActive }) => styles.navLink(isActive)}
        >
          <span style={styles.navIcon}>👤</span>
          <span>Profile</span>
        </NavLink>
        <NavLink 
          to="/history" 
          style={({ isActive }) => styles.navLink(isActive)}
        >
          <span style={styles.navIcon}>📜</span>
          <span>History</span>
        </NavLink>
      </nav>

      {/* WebRTC Call Overlay (triggered from Matchmaking) */}
      {activeCallDetails && (
        <CallWindow
          currentUserId={currentUser.uid}
          targetPartnerId={activeCallDetails.partnerId}
          incomingCallId={activeCallDetails.incomingCallId}
          isVideoMode={activeCallDetails.isVideo}
          onCallEnded={() => {
            if (activeCallDetails.partnerId) {
              setShowFeedbackPartnerId(activeCallDetails.partnerId);
            }
            setActiveCallDetails(null);
          }}
        />
      )}

      {/* Post-Call Rating Overlay */}
      {showFeedbackPartnerId && (
        <PostCallRating
          partnerId={showFeedbackPartnerId}
          currentUserId={currentUser.uid}
          onFinished={() => setShowFeedbackPartnerId(null)}
        />
      )}
    </div>
  );
}

/**
 * Root App router wrapping matching views
 */
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCallDetails, setActiveCallDetails] = useState(null);
  const [incomingCallNotification, setIncomingCallNotification] = useState(null);

  useEffect(() => {
    // Monitor Auth State
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Set up listener for incoming WebRTC calls once authenticated
  useEffect(() => {
    if (!currentUser) return;

    let activeUnsubscribe;
    const bindListener = async () => {
      const { WebRtcService } = await import("./webrtcService");
      activeUnsubscribe = WebRtcService.listenForIncomingCalls(currentUser.uid, (incomingCall) => {
        if (incomingCall.type === "added") {
          setIncomingCallNotification(incomingCall);
        } else if (incomingCall.type === "removed") {
          setIncomingCallNotification((prev) => {
            if (prev && prev.callId === incomingCall.callId) {
              return null;
            }
            return prev;
          });
        }
      });
    };
    bindListener();

    return () => {
      if (activeUnsubscribe) activeUnsubscribe();
    };
  }, [currentUser]);

  if (loading) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "#0f172a",
        color: "#94a3b8",
        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        <h2>Loading English Circles...</h2>
        <p style={{ fontSize: "13px" }}>Connecting securely to Firestore and WebRTC triggers</p>
      </div>
    );
  }

  return (
    <HashRouter>
      {!currentUser ? (
        <LoginScreen onAuthSuccess={(user) => setCurrentUser(user)} />
      ) : (
        <>
          <MainLayout 
            currentUser={currentUser} 
            onLogout={() => setCurrentUser(null)}
            activeCallDetails={activeCallDetails}
            setActiveCallDetails={setActiveCallDetails}
          />
          {incomingCallNotification && (
            <IncomingCallAlert
              notification={incomingCallNotification}
              onAccept={(notification) => {
                setIncomingCallNotification(null);
                setActiveCallDetails({
                  partnerId: notification.callerId,
                  isVideo: notification.isVideo,
                  incomingCallId: notification.callId
                });
              }}
              onDecline={() => {
                setIncomingCallNotification(null);
              }}
            />
          )}
        </>
      )}
    </HashRouter>
  );
}
