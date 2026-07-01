import { db } from "../firebase/firebaseConfig";
import { 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from "firebase/firestore";

/**
 * Service to manage chats, messages, typing statuses, and seen receipts.
 * Uses:
 * - chats/{chatId}
 * - chats/{chatId}/messages/{messageId}
 */

/**
 * Returns a lexicographically sorted chatId combination for two user IDs.
 * @param {string} user1Id 
 * @param {string} user2Id 
 * @returns {string} Unique chatId.
 */
export const getChatId = (user1Id, user2Id) => {
  return user1Id < user2Id ? `${user1Id}_${user2Id}` : `${user2Id}_${user1Id}`;
};

/**
 * Ensures a chat session document exists in Firestore.
 * @param {string} user1Id 
 * @param {string} user2Id 
 */
export const ensureChatExists = async (user1Id, user2Id) => {
  const chatId = getChatId(user1Id, user2Id);
  const chatRef = doc(db, "chats", chatId);
  
  await setDoc(chatRef, {
    chatId,
    users: [user1Id, user2Id],
    createdAt: Date.now(),
    updatedAt: serverTimestamp(),
    lastMessage: "",
    typingStatus: {
      [user1Id]: false,
      [user2Id]: false
    },
    seenStatus: {
      [user1Id]: true,
      [user2Id]: true
    }
  }, { merge: true });

  return chatId;
};

/**
 * Sends a chat message. Also triggers AI English Coach if feedback is provided.
 * @param {string} senderId 
 * @param {string} receiverId 
 * @param {string} text 
 * @param {string} type - 'text' | 'voice' | 'image'
 * @param {Object} [aiFeedback] - Grammar/AI feedback structure if applicable
 */
export const sendChatMessage = async (senderId, receiverId, text, type = "text", aiFeedback = null) => {
  try {
    const chatId = await ensureChatExists(senderId, receiverId);
    
    const messagesCollection = collection(db, "chats", chatId, "messages");
    const messageData = {
      senderId,
      receiverId,
      text,
      type,
      timestamp: Date.now(),
      createdAt: serverTimestamp()
    };

    if (aiFeedback) {
      messageData.aiFeedback = aiFeedback;
    }

    // Add to subcollection
    const msgRef = await addDoc(messagesCollection, messageData);

    // Update the parent chat summary document
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
      lastMessage: type === "text" ? text : `[Sent a ${type}]`,
      lastMessageSenderId: senderId,
      lastMessageTime: Date.now(),
      updatedAt: serverTimestamp(),
      [`seenStatus.${senderId}`]: true,
      [`seenStatus.${receiverId}`]: false
    });

    // Backwards-compatible duplicate write for notifications/legacy list if needed
    const convRef = doc(db, "conversations", chatId);
    await setDoc(convRef, {
      chatId,
      participants: [senderId, receiverId],
      lastMessage: type === "text" ? text : `[Sent a ${type}]`,
      lastMessageSenderId: senderId,
      lastMessageTime: Date.now(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    return msgRef.id;
  } catch (error) {
    console.error("Error sending message in chatService:", error);
    throw error;
  }
};

/**
 * Listens to messages in a chat subcollection in real-time.
 * @param {string} user1Id 
 * @param {string} user2Id 
 * @param {Function} callback 
 * @returns {import("firebase/firestore").Unsubscribe}
 */
export const subscribeToChatMessages = (user1Id, user2Id, callback) => {
  const chatId = getChatId(user1Id, user2Id);
  const messagesCollection = collection(db, "chats", chatId, "messages");
  const q = query(messagesCollection, orderBy("timestamp", "asc"));

  return onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    callback(messages);
  }, (error) => {
    console.error(`Error in chat snapshot listener for ${chatId}:`, error);
  });
};

/**
 * Subscribes to chat document updates (to monitor typing and seen statuses).
 * @param {string} user1Id 
 * @param {string} user2Id 
 * @param {Function} callback 
 * @returns {import("firebase/firestore").Unsubscribe}
 */
export const subscribeToChatDetails = (user1Id, user2Id, callback) => {
  const chatId = getChatId(user1Id, user2Id);
  const chatRef = doc(db, "chats", chatId);

  return onSnapshot(chatRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    }
  }, (error) => {
    console.error("Error in chat details snapshot listener:", error);
  });
};

/**
 * Updates typing status for a user in a chat.
 * @param {string} senderId 
 * @param {string} receiverId 
 * @param {boolean} isTyping 
 */
export const setTypingStatus = async (senderId, receiverId, isTyping) => {
  try {
    const chatId = getChatId(senderId, receiverId);
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
      [`typingStatus.${senderId}`]: isTyping
    });
  } catch (err) {
    // Avoid console noise for rapid events
  }
};

/**
 * Marks messages as seen/read by a user.
 * @param {string} senderId 
 * @param {string} receiverId 
 */
export const markChatAsSeen = async (senderId, receiverId) => {
  try {
    const chatId = getChatId(senderId, receiverId);
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
      [`seenStatus.${senderId}`]: true
    });
  } catch (err) {
    // Avoid console noise for rapid events
  }
};
