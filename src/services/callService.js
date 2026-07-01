import { db } from "../firebase/firebaseConfig";
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  getDocs, 
  limit 
} from "firebase/firestore";
import { WebRtcService } from "./webrtcService";

/**
 * Service to manage voice and video calls, call status monitoring, and media toggles.
 */

// Instantiate shared WebRtcService
export const webrtcInstance = new WebRtcService();

/**
 * Starts an outgoing call.
 * @param {string} currentUserId - The caller ID
 * @param {string} partnerId - The callee ID
 * @param {boolean} isVideo - true if video call, false for audio-only
 * @param {Function} onRemoteStream - Triggers when the remote audio/video stream starts
 * @param {Function} onIceState - Triggers on ICE connection state changes
 * @returns {Promise<string>} Call ID
 */
export const makeCall = async (currentUserId, partnerId, isVideo = false, onRemoteStream, onIceState) => {
  try {
    const callId = await webrtcInstance.startOutgoingCall(
      currentUserId,
      partnerId,
      isVideo,
      onRemoteStream,
      onIceState
    );
    return callId;
  } catch (error) {
    console.error("Failed to make call:", error);
    throw error;
  }
};

/**
 * Accepts an incoming call.
 * @param {string} callId - Call document ID
 * @param {Function} onRemoteStream - Triggers when remote stream starts
 * @param {Function} onIceState - ICE connection status changes
 */
export const acceptCall = async (callId, onRemoteStream, onIceState) => {
  try {
    await webrtcInstance.answerIncomingCall(callId, onRemoteStream, onIceState);
    const callDocRef = doc(db, "calls", callId);
    await updateDoc(callDocRef, {
      status: "active"
    });
  } catch (error) {
    console.error("Failed to accept call:", error);
    throw error;
  }
};

/**
 * Rejects an incoming call.
 * @param {string} callId - Call ID
 */
export const rejectCall = async (callId) => {
  try {
    await webrtcInstance.rejectIncomingCall(callId);
  } catch (error) {
    console.error("Failed to reject call:", error);
    throw error;
  }
};

/**
 * Ends/terminates an ongoing call.
 * @param {string} callId - Call ID
 */
export const endCall = async (callId) => {
  try {
    if (callId) {
      await webrtcInstance.endCall(callId);
    } else {
      webrtcInstance.terminateLocalCall();
    }
  } catch (error) {
    console.error("Failed to end call:", error);
    webrtcInstance.terminateLocalCall();
  }
};

/**
 * Moniters incoming calls for a user in real-time.
 * @param {string} userId - The current user's ID
 * @param {Function} onIncomingCall - Triggered when a new incoming call is detected
 * @returns {import("firebase/firestore").Unsubscribe} Unsubscribe function
 */
export const subscribeToIncomingCalls = (userId, onIncomingCall) => {
  const q = query(
    collection(db, "calls"),
    where("calleeId", "==", userId),
    where("status", "==", "ringing"),
    limit(1)
  );

  return onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      const docData = snapshot.docs[0].data();
      onIncomingCall({ id: snapshot.docs[0].id, ...docData });
    } else {
      onIncomingCall(null);
    }
  }, (error) => {
    console.error("Error subscribing to incoming calls:", error);
  });
};

/**
 * Monitors the current call document's status in real-time.
 * @param {string} callId - The Call ID
 * @param {Function} onStatusChange - Triggered on document updates
 * @returns {import("firebase/firestore").Unsubscribe}
 */
export const subscribeToCallStatus = (callId, onStatusChange) => {
  const docRef = doc(db, "calls", callId);
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      onStatusChange(snapshot.data());
    } else {
      onStatusChange(null);
    }
  }, (error) => {
    console.error("Error subscribing to call status:", error);
  });
};

/**
 * Mutes or unmutes the local audio track.
 * @param {boolean} isMuted 
 */
export const toggleMuteLocalAudio = (isMuted) => {
  if (webrtcInstance.localStream) {
    webrtcInstance.localStream.getAudioTracks().forEach(track => {
      track.enabled = !isMuted;
    });
    return true;
  }
  return false;
};

/**
 * Toggles the local video track (if video call).
 * @param {boolean} isVideoOff 
 */
export const toggleLocalVideo = (isVideoOff) => {
  if (webrtcInstance.localStream) {
    webrtcInstance.localStream.getVideoTracks().forEach(track => {
      track.enabled = !isVideoOff;
    });
    return true;
  }
  return false;
};
