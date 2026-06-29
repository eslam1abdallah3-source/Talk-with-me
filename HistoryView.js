import React, { useState, useEffect } from "react";
import { getUserProfile } from "./databaseService";
import { SimpleLevelBadge } from "./LevelProgressCard";

/**
 * HistoryView Component
 * Renders past conversations with links to re-open chat or view partner profiles.
 * Features:
 * - Real-time conversational list filter by partner name, level, or country.
 * - Dynamic peer profile fetching with progress loaders.
 * - Interactive modal/details overlay to inspect the partner's profile (including level, interests, badges, and peer ratings).
 * - Immediate quick action to re-open text chat.
 * 
 * @param {Object} props
 * @param {string} props.currentUserId - ID of authenticated user
 * @param {Array} props.conversations - List of past conversation objects
 * @param {Function} props.onPartnerSelected - Callback to set partner and navigate to chat
 */
export default function HistoryView({ currentUserId, conversations = [], onPartnerSelected }) {
  const [partnerProfiles, setPartnerProfiles] = useState({});
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPartnerDetail, setSelectedPartnerDetail] = useState(null);

  // Fetch profiles for all unique partners in conversations
  useEffect(() => {
    if (!currentUserId || conversations.length === 0) {
      setLoadingProfiles(false);
      return;
    }

    const fetchProfiles = async () => {
      setLoadingProfiles(true);
      const profiles = { ...partnerProfiles };
      let updated = false;

      for (const conv of conversations) {
        const partnerId = conv.participants.find((p) => p !== currentUserId);
        if (partnerId && !profiles[partnerId]) {
          try {
            const profile = await getUserProfile(partnerId);
            if (profile) {
              profiles[partnerId] = profile;
              updated = true;
            } else {
              // Fallback placeholder profile
              profiles[partnerId] = {
                id: partnerId,
                name: `Peer ${partnerId.substring(0, 5)}`,
                englishLevel: "Intermediate",
                country: "Unknown",
                nativeLanguage: "English",
                interests: [],
                ratingCount: 0,
                avgFriendliness: 0,
                avgClarity: 0,
                badges: []
              };
              updated = true;
            }
          } catch (err) {
            console.error(`Error loading profile for partner ${partnerId}:`, err);
          }
        }
      }

      if (updated || Object.keys(partnerProfiles).length === 0) {
        setPartnerProfiles(profiles);
      }
      setLoadingProfiles(false);
    };

    fetchProfiles();
  }, [conversations, currentUserId]);

  // Format relative timestamp helper
  const formatTime = (timestamp) => {
    if (!timestamp) return "Some time ago";
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  };

  // Filter conversations based on query matches in last message, partner name, level, or country
  const filteredConversations = conversations.filter((conv) => {
    const partnerId = conv.participants.find((p) => p !== currentUserId);
    const profile = partnerProfiles[partnerId] || {};
    const query = searchQuery.toLowerCase();

    const nameMatch = (profile.name || "").toLowerCase().includes(query);
    const countryMatch = (profile.country || "").toLowerCase().includes(query);
    const levelMatch = (profile.englishLevel || "").toLowerCase().includes(query);
    const messageMatch = (conv.lastMessage || "").toLowerCase().includes(query);
    const idMatch = partnerId ? partnerId.toLowerCase().includes(query) : false;

    return nameMatch || countryMatch || levelMatch || messageMatch || idMatch;
  });

  const styles = {
    container: {
      maxWidth: "540px",
      margin: "40px auto",
      padding: "24px",
      borderRadius: "24px",
      backgroundColor: "#1e293b",
      color: "#f8fafc",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
      border: "1px solid #334155"
    },
    headerRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px"
    },
    title: {
      fontSize: "24px",
      fontWeight: "800",
      color: "#38bdf8",
      margin: 0,
      letterSpacing: "-0.5px"
    },
    countBadge: {
      backgroundColor: "rgba(56, 189, 248, 0.12)",
      color: "#38bdf8",
      fontSize: "12px",
      fontWeight: "700",
      padding: "4px 12px",
      borderRadius: "20px"
    },
    searchBar: {
      width: "100%",
      backgroundColor: "#0f172a",
      border: "1px solid #334155",
      borderRadius: "14px",
      padding: "12px 16px",
      color: "#ffffff",
      fontSize: "14px",
      outline: "none",
      boxSizing: "border-box",
      marginBottom: "24px",
      transition: "border-color 0.15s ease"
    },
    historyList: {
      display: "flex",
      flexDirection: "column",
      gap: "16px"
    },
    historyCard: {
      backgroundColor: "#0f172a",
      border: "1px solid #334155",
      borderRadius: "18px",
      padding: "16px",
      boxSizing: "border-box",
      transition: "transform 0.2s, border-color 0.2s"
    },
    cardHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "10px"
    },
    profileSummary: {
      display: "flex",
      alignItems: "center",
      gap: "12px"
    },
    avatar: {
      width: "44px",
      height: "44px",
      borderRadius: "50%",
      backgroundColor: "rgba(56, 189, 248, 0.15)",
      border: "2px solid #38bdf8",
      color: "#38bdf8",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "800",
      fontSize: "18px"
    },
    nameText: {
      fontSize: "15px",
      fontWeight: "700",
      color: "#ffffff",
      margin: 0
    },
    subMeta: {
      fontSize: "11px",
      color: "#94a3b8",
      margin: "2px 0 0 0"
    },
    timestamp: {
      fontSize: "11px",
      color: "#64748b",
      fontWeight: "600"
    },
    messagePreviewBox: {
      backgroundColor: "#1e293b",
      padding: "10px 14px",
      borderRadius: "10px",
      marginBottom: "12px",
      fontSize: "12px",
      color: "#cbd5e1",
      fontStyle: "italic",
      lineHeight: "1.4",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    },
    cardActions: {
      display: "flex",
      gap: "10px"
    },
    btnPrimary: {
      flex: 1,
      backgroundColor: "#38bdf8",
      color: "#0f172a",
      border: "none",
      borderRadius: "10px",
      padding: "8px 12px",
      fontSize: "12px",
      fontWeight: "700",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      minHeight: "40px"
    },
    btnSecondary: {
      flex: 1,
      backgroundColor: "transparent",
      color: "#94a3b8",
      border: "1px solid #334155",
      borderRadius: "10px",
      padding: "8px 12px",
      fontSize: "12px",
      fontWeight: "700",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      minHeight: "40px",
      transition: "all 0.15s ease"
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "20px"
    },
    modalCard: {
      backgroundColor: "#1e293b",
      border: "1.5px solid #334155",
      borderRadius: "24px",
      width: "100%",
      maxWidth: "440px",
      padding: "24px",
      boxSizing: "border-box",
      color: "#f8fafc",
      boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)"
    },
    modalHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
      borderBottom: "1px solid #334155",
      paddingBottom: "12px"
    },
    modalTitle: {
      fontSize: "18px",
      fontWeight: "800",
      color: "#38bdf8",
      margin: 0
    },
    btnClose: {
      backgroundColor: "transparent",
      border: "none",
      color: "#94a3b8",
      fontSize: "20px",
      cursor: "pointer",
      outline: "none"
    },
    modalAvatarBlock: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
      marginBottom: "20px",
      backgroundColor: "#0f172a",
      padding: "16px",
      borderRadius: "16px",
      border: "1px solid #334155"
    },
    modalAvatar: {
      width: "56px",
      height: "56px",
      borderRadius: "50%",
      backgroundColor: "rgba(56, 189, 248, 0.15)",
      border: "2px solid #38bdf8",
      color: "#38bdf8",
      fontSize: "24px",
      fontWeight: "900",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    detailGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "12px",
      marginBottom: "20px"
    },
    detailBox: {
      backgroundColor: "#0f172a",
      padding: "10px 14px",
      borderRadius: "12px",
      border: "1px solid #334155"
    },
    detailLabel: {
      fontSize: "10px",
      color: "#64748b",
      fontWeight: "700",
      textTransform: "uppercase",
      marginBottom: "4px"
    },
    detailValue: {
      fontSize: "13px",
      fontWeight: "600",
      color: "#e2e8f0"
    },
    badgeRow: {
      backgroundColor: "rgba(56, 189, 248, 0.08)",
      color: "#38bdf8",
      fontSize: "11px",
      fontWeight: "700",
      padding: "4px 10px",
      borderRadius: "6px",
      display: "inline-block"
    },
    interestsSection: {
      marginBottom: "20px"
    },
    interestChips: {
      display: "flex",
      flexWrap: "wrap",
      gap: "6px",
      marginTop: "6px"
    },
    chip: {
      fontSize: "11px",
      padding: "4px 10px",
      borderRadius: "12px",
      backgroundColor: "#0f172a",
      color: "#cbd5e1",
      border: "1px solid #334155"
    },
    ratingsSection: {
      backgroundColor: "rgba(30, 41, 59, 0.5)",
      borderRadius: "16px",
      padding: "14px 16px",
      border: "1px solid #334155",
      marginBottom: "24px"
    },
    ratingRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: "12px",
      color: "#94a3b8",
      marginBottom: "6px"
    }
  };

  return (
    <div style={styles.container} aria-label="Past Conversational Circles History">
      <div style={styles.headerRow}>
        <h2 style={styles.title}>Conversational History</h2>
        <span style={styles.countBadge}>
          {conversations.length} {conversations.length === 1 ? "Partner" : "Partners"}
        </span>
      </div>

      <input
        style={styles.searchBar}
        type="text"
        placeholder="Search past peers by name, level, or country..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        title="Search history"
      />

      {conversations.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 10px", color: "#64748b" }}>
          <span style={{ fontSize: "40px", display: "block", marginBottom: "12px" }}>📜</span>
          <p style={{ fontSize: "15px", fontWeight: "700", color: "#94a3b8", margin: "0 0 4px 0" }}>
            No Conversational History
          </p>
          <p style={{ fontSize: "12px", margin: 0 }}>
            Find peer partners in the <strong>Match</strong> tab to begin exchanging messages.
          </p>
        </div>
      ) : filteredConversations.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px 10px", color: "#64748b" }}>
          <p style={{ fontSize: "14px", fontWeight: "600" }}>No matching results found.</p>
        </div>
      ) : (
        <div style={styles.historyList}>
          {filteredConversations.map((conv) => {
            const partnerId = conv.participants.find((p) => p !== currentUserId);
            const profile = partnerProfiles[partnerId] || {
              id: partnerId,
              name: `Peer ${partnerId?.substring(0, 5) || "U"}`,
              englishLevel: "Intermediate",
              country: "Unknown",
              nativeLanguage: "Unknown",
              interests: []
            };

            return (
              <div key={conv.id} style={styles.historyCard}>
                <div style={styles.cardHeader}>
                  <div style={styles.profileSummary}>
                    <div style={styles.avatar}>
                      {profile.name ? profile.name.charAt(0).toUpperCase() : "P"}
                    </div>
                    <div>
                      <h4 style={styles.nameText}>{profile.name}</h4>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "4px", flexWrap: "wrap" }}>
                        <span style={styles.subMeta}>📍 {profile.country || "Earth"}</span>
                        <SimpleLevelBadge level={profile.englishLevel || "Intermediate"} style={{ transform: "scale(0.85)", transformOrigin: "left center", padding: "2px 6px" }} />
                      </div>
                    </div>
                  </div>
                  <span style={styles.timestamp}>{formatTime(conv.lastMessageTime)}</span>
                </div>

                <div style={styles.messagePreviewBox} title={conv.lastMessage || "No messages yet"}>
                  {conv.lastMessageSenderId === currentUserId ? "You: " : ""}
                  {conv.lastMessage || "No messages exchanged yet."}
                </div>

                <div style={styles.cardActions}>
                  <button
                    style={styles.btnPrimary}
                    onClick={() => onPartnerSelected(profile)}
                    title="Open chat session"
                  >
                    💬 Re-open Chat
                  </button>
                  <button
                    style={styles.btnSecondary}
                    onClick={() => setSelectedPartnerDetail(profile)}
                    title="View details of this peer profile"
                  >
                    👤 View Profile
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Partner Profile Detail Modal */}
      {selectedPartnerDetail && (
        <div style={styles.modalOverlay} onClick={() => setSelectedPartnerDetail(null)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Language Peer Card</h3>
              <button style={styles.btnClose} onClick={() => setSelectedPartnerDetail(null)}>
                ×
              </button>
            </div>

            <div style={styles.modalAvatarBlock}>
              <div style={styles.modalAvatar}>
                {selectedPartnerDetail.name ? selectedPartnerDetail.name.charAt(0).toUpperCase() : "P"}
              </div>
              <div>
                <h4 style={{ ...styles.nameText, fontSize: "16px" }}>{selectedPartnerDetail.name}</h4>
                <p style={{ ...styles.subMeta, fontSize: "12px", marginTop: "4px" }}>
                  Active Language Exchange Partner
                </p>
              </div>
            </div>

            <div style={styles.detailGrid}>
              <div style={styles.detailBox}>
                <div style={styles.detailLabel}>Location</div>
                <div style={styles.detailValue}>📍 {selectedPartnerDetail.country || "Earth"}</div>
              </div>
              <div style={styles.detailBox}>
                <div style={styles.detailLabel}>Proficiency</div>
                <div style={{ marginTop: "4px" }}>
                  <SimpleLevelBadge level={selectedPartnerDetail.englishLevel || "Intermediate"} />
                </div>
              </div>
              <div style={styles.detailBox}>
                <div style={styles.detailLabel}>Native Language</div>
                <div style={styles.detailValue}>💬 {selectedPartnerDetail.nativeLanguage || "Spanish"}</div>
              </div>
              <div style={styles.detailBox}>
                <div style={styles.detailLabel}>Earned Badges</div>
                <div style={styles.detailValue}>
                  🏆 {selectedPartnerDetail.badges?.length || 0} Badges
                </div>
              </div>
            </div>

            {selectedPartnerDetail.interests && selectedPartnerDetail.interests.length > 0 && (
              <div style={styles.interestsSection}>
                <div style={styles.detailLabel}>Peer Interests</div>
                <div style={styles.interestChips}>
                  {selectedPartnerDetail.interests.map((interest) => (
                    <span key={interest} style={styles.chip}>
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={styles.ratingsSection}>
              <div style={{ ...styles.detailLabel, marginBottom: "8px", color: "#38bdf8" }}>
                Peer Discussion Ratings
              </div>
              <div style={styles.ratingRow}>
                <span>Average Friendliness</span>
                <strong>
                  {selectedPartnerDetail.avgFriendliness || "5.0"}{" "}
                  <span style={{ color: "#eab308" }}>★</span>
                </strong>
              </div>
              <div style={styles.ratingRow}>
                <span>English Clarity</span>
                <strong>
                  {selectedPartnerDetail.avgClarity || "5.0"}{" "}
                  <span style={{ color: "#eab308" }}>★</span>
                </strong>
              </div>
              <p style={{ fontSize: "10px", color: "#64748b", margin: "6px 0 0 0", fontStyle: "italic", textAlign: "right" }}>
                Based on {selectedPartnerDetail.ratingCount || 0} reviews
              </p>
            </div>

            <button
              style={{ ...styles.btnPrimary, width: "100%" }}
              onClick={() => {
                onPartnerSelected(selectedPartnerDetail);
                setSelectedPartnerDetail(null);
              }}
              title="Open direct chat window"
            >
              💬 Open Text Chat Room
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
