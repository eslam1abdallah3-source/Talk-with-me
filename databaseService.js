import { db } from "./firebaseConfig";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  addDoc,
  onSnapshot,
  getDocs,
  serverTimestamp,
  limit
} from "firebase/firestore";

/**
 * Save or update user profile data in Firestore.
 * @param {string} uid - The authenticated user's unique ID.
 * @param {Object} profileData - The profile fields to save.
 */
export const saveUserProfile = async (uid, profileData) => {
  try {
    const docRef = doc(db, "users", uid);
    const data = {
      ...profileData,
      updatedAt: serverTimestamp()
    };
    await setDoc(docRef, data, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
};

/**
 * Fetch a user profile by ID.
 * @param {string} uid - The user's ID.
 * @returns {Promise<Object|null>} The user profile data or null if not found.
 */
export const getUserProfile = async (uid) => {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

/**
 * Fetch all online users for matchmaking, excluding the current user.
 * @param {string} currentUserId - The current user's ID to exclude.
 * @returns {Promise<Array>} A list of active, online user profiles.
 */
export const getOnlineUsers = async (currentUserId) => {
  try {
    const q = query(
      collection(db, "users"),
      where("isOnline", "==", true)
    );
    const querySnapshot = await getDocs(q);
    const users = [];
    querySnapshot.forEach((doc) => {
      if (doc.id !== currentUserId) {
        users.push({ id: doc.id, ...doc.data() });
      }
    });
    return users;
  } catch (error) {
    console.error("Error getting online users:", error);
    throw error;
  }
};

/**
 * Retrieve or create a direct conversation/chat channel ID between two users.
 * Uses a lexicographically sorted combination of user IDs to ensure uniqueness.
 * @param {string} user1Id 
 * @param {string} user2Id 
 * @returns {string} Unique chatId for the two participants.
 */
export const getOrCreateConversationId = (user1Id, user2Id) => {
  return user1Id < user2Id ? `${user1Id}_${user2Id}` : `${user2Id}_${user1Id}`;
};

/**
 * Send a chat message to a conversation.
 * @param {string} senderId - ID of the sender.
 * @param {string} receiverId - ID of the receiver.
 * @param {string} text - Message content.
 */
export const sendChatMessage = async (senderId, receiverId, text) => {
  try {
    const chatId = getOrCreateConversationId(senderId, receiverId);
    
    // Save message structure
    const messageData = {
      chatId,
      senderId,
      receiverId,
      text,
      timestamp: Date.now(),
      createdAt: serverTimestamp()
    };

    // Add to 'chats' collection
    await addDoc(collection(db, "chats"), messageData);

    // Update the conversation's last message details
    const convRef = doc(db, "conversations", chatId);
    await setDoc(convRef, {
      chatId,
      participants: [senderId, receiverId],
      lastMessage: text,
      lastMessageSenderId: senderId,
      lastMessageTime: Date.now(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    return true;
  } catch (error) {
    console.error("Error sending chat message:", error);
    throw error;
  }
};

/**
 * Listen to messages in a conversation in real-time.
 * @param {string} user1Id 
 * @param {string} user2Id 
 * @param {Function} callback - Callback function with messages list.
 * @returns {import("firebase/firestore").Unsubscribe} Unsubscribe function.
 */
export const subscribeToChatMessages = (user1Id, user2Id, callback) => {
  const chatId = getOrCreateConversationId(user1Id, user2Id);
  const q = query(
    collection(db, "chats"),
    where("chatId", "==", chatId),
    orderBy("timestamp", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    callback(messages);
  }, (error) => {
    console.error("Error in chat messages snapshot listener:", error);
  });
};

/**
 * Fetch recent conversations/chats for a specific user.
 * @param {string} userId - Current authenticated user ID.
 * @param {Function} callback - Callback function that receives list of active chats.
 * @returns {import("firebase/firestore").Unsubscribe} Unsubscribe function.
 */
export const subscribeToConversations = (userId, callback) => {
  const q = query(
    collection(db, "conversations"),
    where("participants", "array-contains", userId),
    orderBy("lastMessageTime", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const conversations = [];
    snapshot.forEach((doc) => {
      conversations.push({ id: doc.id, ...doc.data() });
    });
    callback(conversations);
  }, (error) => {
    console.error("Error in conversation snapshot listener:", error);
  });
};

/**
 * Find another online user with a matching English level and at least one shared interest.
 * @param {string} currentUserId - The ID of the user requesting a match.
 * @param {string} englishLevel - The current user's English proficiency level.
 * @param {Array<string>} interests - The current user's array of interests.
 * @returns {Promise<Object|null>} A matched user profile, or null if no matching user is found.
 */
export const findMatchingUser = async (currentUserId, englishLevel, interests) => {
  try {
    // Query online users
    const q = query(
      collection(db, "users"),
      where("isOnline", "==", true)
    );
    const querySnapshot = await getDocs(q);
    
    const candidates = [];
    const cleanUserInterests = (interests || []).map(i => i.trim().toLowerCase());

    querySnapshot.forEach((doc) => {
      const userData = { id: doc.id, ...doc.data() };
      
      // Exclude current user
      if (userData.id === currentUserId) return;
      
      // Match English proficiency level (case-insensitive)
      const candidateLevel = userData.englishLevel || "";
      if (candidateLevel.toLowerCase() !== englishLevel.toLowerCase()) return;
      
      // Normalize interests (supports both Firestore array list or comma-separated string)
      let candidateInterests = [];
      if (Array.isArray(userData.interests)) {
        candidateInterests = userData.interests;
      } else if (typeof userData.interests === "string") {
        candidateInterests = userData.interests ? userData.interests.split(",") : [];
      }
      
      const cleanCandidateInterests = candidateInterests.map(i => i.trim().toLowerCase());
      
      // Check if there is at least one shared interest
      const sharedInterests = cleanUserInterests.filter(interest => 
        cleanCandidateInterests.includes(interest)
      );
      
      if (sharedInterests.length > 0) {
        candidates.push({
          user: userData,
          score: sharedInterests.length // Higher score means more shared interests
        });
      }
    });
    
    if (candidates.length === 0) {
      return null;
    }
    
    // Sort by best score first and return the top match
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].user;
    
  } catch (error) {
    console.error("Error finding matching user in Firestore:", error);
    throw error;
  }
};

/**
 * Save post-call peer review rating and update the target user's aggregated ratings.
 * @param {string} raterId - ID of the user giving the rating.
 * @param {string} partnerId - ID of the user being rated.
 * @param {number} friendliness - Friendliness score (1-5).
 * @param {number} clarity - English clarity score (1-5).
 * @param {string} comment - Optional text comment feedback.
 */
export const savePostCallRating = async (raterId, partnerId, friendliness, clarity, comment) => {
  try {
    // 1. Write the raw review to the "ratings" collection
    const ratingData = {
      raterId,
      partnerId,
      friendlinessRating: friendliness,
      clarityRating: clarity,
      feedbackComment: comment || "",
      timestamp: Date.now(),
      createdAt: serverTimestamp()
    };
    await addDoc(collection(db, "ratings"), ratingData);

    // 2. Fetch partner's profile to compute and aggregate average ratings
    const partnerDocRef = doc(db, "users", partnerId);
    const partnerSnap = await getDoc(partnerDocRef);
    
    if (partnerSnap.exists()) {
      const partnerData = partnerSnap.data();
      const ratingCount = partnerData.ratingCount || 0;
      const avgFriendliness = partnerData.avgFriendliness || 0;
      const avgClarity = partnerData.avgClarity || 0;

      const newRatingCount = ratingCount + 1;
      const newAvgFriendliness = parseFloat(((avgFriendliness * ratingCount + friendliness) / newRatingCount).toFixed(2));
      const newAvgClarity = parseFloat(((avgClarity * ratingCount + clarity) / newRatingCount).toFixed(2));

      await updateDoc(partnerDocRef, {
        ratingCount: newRatingCount,
        avgFriendliness: newAvgFriendliness,
        avgClarity: newAvgClarity
      });
    }

    return true;
  } catch (error) {
    console.error("Error saving post-call rating:", error);
    throw error;
  }
};

/**
 * Increment or add practice minutes for a user on the current date, and update streaks.
 * @param {string} userId - User's unique ID.
 * @param {number} minutes - Minutes to add.
 */
export const addPracticeMinutes = async (userId, minutes) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) return;

    const data = userSnap.data();
    const practiceLogs = data.practiceLogs || {};
    const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD format in local timezone

    // Increment minutes for today
    const currentTodayMinutes = practiceLogs[todayStr] || 0;
    practiceLogs[todayStr] = parseFloat((currentTodayMinutes + minutes).toFixed(1));

    // Calculate updated streak
    const streakResult = computeStreakFromLogs(practiceLogs);
    const newLongestStreak = Math.max(data.longestStreak || 0, streakResult.currentStreak);

    // Compute updated badges
    const currentBadges = data.badges || [];
    const earnedBadgeIds = computeEarnedBadges(practiceLogs, streakResult.currentStreak, newLongestStreak);
    const updatedBadges = [...new Set([...currentBadges, ...earnedBadgeIds])];

    await updateDoc(userDocRef, {
      practiceLogs: practiceLogs,
      currentStreak: streakResult.currentStreak,
      longestStreak: newLongestStreak,
      badges: updatedBadges,
      updatedAt: serverTimestamp()
    });

    return { practiceLogs, streak: streakResult.currentStreak, badges: updatedBadges };
  } catch (error) {
    console.error("Error adding practice minutes:", error);
    throw error;
  }
};

/**
 * Helper to compute current streak from practice logs map.
 * @param {Object} logs - Map of YYYY-MM-DD -> minutes
 */
export const computeStreakFromLogs = (logs) => {
  if (!logs || Object.keys(logs).length === 0) {
    return { currentStreak: 0 };
  }

  // Get active dates with positive practice time
  const sortedDates = Object.keys(logs)
    .filter(date => logs[date] > 0)
    .sort((a, b) => new Date(b) - new Date(a)); // desc sorted

  if (sortedDates.length === 0) {
    return { currentStreak: 0 };
  }

  const todayStr = new Date().toLocaleDateString("en-CA");
  
  // Calculate yesterday string
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString("en-CA");

  // If the most recent log is older than yesterday, streak is broken
  const mostRecent = sortedDates[0];
  if (mostRecent !== todayStr && mostRecent !== yesterdayStr) {
    return { currentStreak: 0 };
  }

  let currentStreak = 0;
  let checkDate = new Date(mostRecent);

  // We can count consecutive days back
  while (true) {
    const dateStr = checkDate.toLocaleDateString("en-CA");
    if (logs[dateStr] && logs[dateStr] > 0) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return { currentStreak };
};

/**
 * Update daily learning goals (in minutes).
 * @param {string} userId 
 * @param {number} dailyGoal - New target in minutes
 */
export const updateDailyGoal = async (userId, dailyGoal) => {
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      dailyGoal: dailyGoal,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error updating daily goal:", error);
    throw error;
  }
};

/**
 * Virtual Badge Definitions
 */
export const BADGE_DEFINITIONS = [
  {
    id: "conv_starter",
    name: "Conversation Starter",
    description: "Begin your language journey by completing 5 minutes of practice.",
    icon: "💬",
    category: "duration",
    target: 5,
    unit: "mins"
  },
  {
    id: "consistent_learner",
    name: "Consistent Learner",
    description: "Build a strong habit by maintaining a 3-day practice streak.",
    icon: "⚡",
    category: "streak",
    target: 3,
    unit: "days"
  },
  {
    id: "grammar_pro",
    name: "Grammar Pro",
    description: "Solidify your speaking foundations with 30 minutes of total practice.",
    icon: "📝",
    category: "duration",
    target: 30,
    unit: "mins"
  },
  {
    id: "dedication_champ",
    name: "Dedication Champion",
    description: "Go above and beyond with 120 minutes (2 hours) of practice.",
    icon: "🏆",
    category: "duration",
    target: 120,
    unit: "mins"
  },
  {
    id: "streak_legend",
    name: "Streak Legend",
    description: "Show absolute commitment with a 7-day practice streak.",
    icon: "🔥",
    category: "streak",
    target: 7,
    unit: "days"
  },
  {
    id: "fluency_explorer",
    name: "Fluency Explorer",
    description: "Acquire speaking comfort with 300 minutes (5 hours) of practice.",
    icon: "🌍",
    category: "duration",
    target: 300,
    unit: "mins"
  }
];

/**
 * Computes which badge IDs should be unlocked based on logs and streak parameters.
 * @param {Object} practiceLogs - Map of YYYY-MM-DD -> minutes
 * @param {number} currentStreak 
 * @param {number} longestStreak 
 * @returns {Array<string>} List of unlocked badge IDs
 */
export const computeEarnedBadges = (practiceLogs, currentStreak, longestStreak) => {
  const badgeIds = [];
  const logs = practiceLogs || {};
  const totalMinutes = Object.values(logs).reduce((acc, curr) => acc + (typeof curr === 'number' ? curr : 0), 0);
  const maxStreak = Math.max(currentStreak || 0, longestStreak || 0);

  BADGE_DEFINITIONS.forEach((badge) => {
    if (badge.category === "duration" && totalMinutes >= badge.target) {
      badgeIds.push(badge.id);
    } else if (badge.category === "streak" && maxStreak >= badge.target) {
      badgeIds.push(badge.id);
    }
  });

  return badgeIds;
};

/**
 * Scans a user's practice stats, computes badges, and syncs/saves them to Firestore.
 * Useful on initial loads, profiles loads, or after quiz completions.
 * @param {string} userId 
 * @returns {Promise<Array<string>>} The updated list of user badges
 */
export const syncUserBadges = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) return [];

    const data = userSnap.data();
    const practiceLogs = data.practiceLogs || {};
    const currentStreak = data.currentStreak || 0;
    const longestStreak = data.longestStreak || 0;
    const currentBadges = data.badges || [];

    const earnedBadgeIds = computeEarnedBadges(practiceLogs, currentStreak, longestStreak);
    
    // Check if there are any badges that are earned but not in Firestore yet
    const hasNewBadges = earnedBadgeIds.some(id => !currentBadges.includes(id));
    
    if (hasNewBadges) {
      const updatedBadges = [...new Set([...currentBadges, ...earnedBadgeIds])];
      await updateDoc(userDocRef, {
        badges: updatedBadges,
        updatedAt: serverTimestamp()
      });
      return updatedBadges;
    }

    return currentBadges;
  } catch (error) {
    console.error("Error syncing user badges:", error);
    return [];
  }
};



