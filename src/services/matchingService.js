import { db } from "../firebase/firebaseConfig";
import { collection, getDocs, query, where, doc, getDoc, setDoc, arrayUnion } from "firebase/firestore";

/**
 * Service to handle learner matching, ranking, and blocking/reporting safety.
 */

/**
 * Rates the match score between two user profiles.
 * @param {Object} me - Current user's profile data
 * @param {Object} other - Prospective match profile data
 * @returns {number} Score used to sort matching relevance
 */
export const calculateMatchScore = (me, other) => {
  let score = 0;

  if (!me || !other) return 0;

  // 1. Same learning language -> high priority
  if (me.learningLanguage && other.learningLanguage && me.learningLanguage === other.learningLanguage) {
    score += 100;
  }

  // 1b. Language exchange synergy (my native is their learning, their native is my learning)
  if (me.nativeLanguage && other.learningLanguage && me.nativeLanguage === other.learningLanguage) {
    score += 80;
  }
  if (me.learningLanguage && other.nativeLanguage && me.learningLanguage === other.nativeLanguage) {
    score += 80;
  }

  // 2. Similar englishLevel / level -> medium priority
  const levels = ["Beginner", "Intermediate", "Advanced", "Fluent"];
  const myLevelIdx = levels.indexOf(me.englishLevel || me.level || "Intermediate");
  const otherLevelIdx = levels.indexOf(other.englishLevel || other.level || "Intermediate");
  
  if (myLevelIdx !== -1 && otherLevelIdx !== -1) {
    const diff = Math.abs(myLevelIdx - otherLevelIdx);
    if (diff === 0) {
      score += 50; // exact level match
    } else if (diff === 1) {
      score += 25; // adjacent levels
    }
  }

  // 3. Shared interests -> bonus points
  const myInterests = me.interests || [];
  const otherInterests = other.interests || [];
  if (Array.isArray(myInterests) && Array.isArray(otherInterests)) {
    const shared = myInterests.filter(interest => otherInterests.includes(interest));
    score += shared.length * 15;
  }

  // 4. Online users -> priority boost
  if (other.isOnline === true) {
    score += 150;
  }

  return score;
};

/**
 * Fetch and rank potential matches for a user, excluding themselves and blocked users.
 * @param {string} currentUserId - The authenticated user's ID
 * @param {Array<Object>} allUsersList - A list of all other user profiles
 * @param {Array<string>} blockedIds - List of user IDs blocked by or blocking the current user
 * @returns {Array<Object>} Ranked matches list sorted by relevance score desc
 */
export const getRankedMatches = (currentUserProfile, allUsersList, blockedIds = []) => {
  if (!currentUserProfile) return allUsersList;

  const currentUserId = currentUserProfile.uid || currentUserProfile.id;

  return allUsersList
    .filter(user => user.id !== currentUserId && !blockedIds.includes(user.id))
    .map(user => {
      const score = calculateMatchScore(currentUserProfile, user);
      return { ...user, matchScore: score };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
};

/**
 * Fetch blocked user IDs for the given user.
 * @param {string} userId - Current user ID
 * @returns {Promise<Array<string>>} List of blocked user IDs
 */
export const getBlockedUsers = async (userId) => {
  if (!userId) return [];
  try {
    const docRef = doc(db, "blockedUsers", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().blockedUids || [];
    }
    return [];
  } catch (err) {
    console.error("Error fetching blocked users list:", err);
    return [];
  }
};

/**
 * Block a user.
 * @param {string} currentUserId - Blocker ID
 * @param {string} targetUserId - Blocked ID
 */
export const blockUser = async (currentUserId, targetUserId) => {
  if (!currentUserId || !targetUserId) return;
  try {
    const blockerDocRef = doc(db, "blockedUsers", currentUserId);
    const blockerSnap = await getDoc(blockerDocRef);
    if (blockerSnap.exists()) {
      await setDoc(blockerDocRef, {
        blockedUids: arrayUnion(targetUserId)
      }, { merge: true });
    } else {
      await setDoc(blockerDocRef, {
        blockedUids: [targetUserId]
      });
    }
    console.log(`Successfully blocked user ${targetUserId} for user ${currentUserId}`);
  } catch (err) {
    console.error("Error blocking user:", err);
    throw err;
  }
};

/**
 * File a safety/abuse report against a user.
 * @param {string} reporterId - Reporter ID
 * @param {string} targetUserId - Reported ID
 * @param {string} reason - Reason for report
 * @param {string} details - Additional comments
 */
export const reportUser = async (reporterId, targetUserId, reason, details) => {
  if (!reporterId || !targetUserId) return;
  try {
    const reportRef = doc(collection(db, "reports"));
    await setDoc(reportRef, {
      reportId: reportRef.id,
      reporterId,
      targetUserId,
      reason,
      details: details || "",
      timestamp: Date.now(),
      status: "pending"
    });
    console.log(`Report created against ${targetUserId} by ${reporterId}`);
  } catch (err) {
    console.error("Error creating safety report:", err);
    throw err;
  }
};
