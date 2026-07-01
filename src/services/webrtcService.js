import { db } from "../firebase/firebaseConfig";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  collectionGroup,
  query,
  where,
  deleteDoc,
  getDocs
} from "firebase/firestore";

// Standard public STUN configurations for peer discovery (no TURN server needed for typical client environments)
const iceConfiguration = {
  iceServers: [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
        "stun:stun3.l.google.com:19302",
        "stun:stun4.l.google.com:19302"
      ]
    }
  ]
};

/**
 * WebRTC Signaling & Connection Helper Service
 */
export class WebRtcService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.callId = null;
    this.unsubscribeList = [];
  }

  /**
   * Request user media permissions and return the local stream.
   * Handles camera/microphone configuration depending on call mode.
   * @param {boolean} video - If true, request video stream
   * @param {boolean} audio - If true, request audio stream
   * @returns {Promise<MediaStream>} The acquired local media stream
   */
  async getLocalMedia(video = true, audio = true) {
    try {
      if (this.localStream) {
        this.stopLocalMedia();
      }
      
      const constraints = {
        video: video ? { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } : false,
        audio: audio
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.localStream;
    } catch (error) {
      console.error("Error accessing camera or microphone:", error);
      throw new Error(`Media capture failed: ${error.message}. Please check browser permissions.`);
    }
  }

  /**
   * Initialize a new peer connection and set up candidate gathering.
   * @param {Function} onTrackCallback - Triggers when remote stream tracks are received
   * @param {Function} onIceStateChange - Triggers on ICE connection state changes
   */
  initPeerConnection(onTrackCallback, onIceStateChange) {
    this.peerConnection = new RTCPeerConnection(iceConfiguration);

    // Add local tracks to the connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }

    // Set up remote stream container
    this.remoteStream = new MediaStream();
    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        this.remoteStream.addTrack(track);
      });
      if (onTrackCallback) onTrackCallback(this.remoteStream);
    };

    // Track ICE Connection state changes
    this.peerConnection.oniceconnectionstatechange = () => {
      if (onIceStateChange) onIceStateChange(this.peerConnection.iceConnectionState);
    };
  }

  /**
   * Create an outgoing call: generates an offer, creates a Firestore record, and listens for the answer.
   * @param {string} callerId 
   * @param {string} calleeId 
   * @param {boolean} isVideo 
   * @param {Function} onTrackCallback - For remote stream
   * @param {Function} onIceStateChange - For connection states
   * @returns {Promise<string>} The generated unique Call ID
   */
  async startOutgoingCall(callerId, calleeId, isVideo, onTrackCallback, onIceStateChange) {
    try {
      // 1. Get media streams
      await this.getLocalMedia(isVideo, true);

      // 2. Setup RTCPeerConnection
      this.initPeerConnection(onTrackCallback, onIceStateChange);

      // 3. Create signaling document in Firestore
      const callCollRef = collection(db, "calls");
      const callDocRef = doc(callCollRef); // Generate unique call document
      this.callId = callDocRef.id;

      // Collection for candidates
      const callerCandidatesCollection = collection(callDocRef, "callerCandidates");
      const calleeCandidatesCollection = collection(callDocRef, "calleeCandidates");

      // Handle local ICE candidate collection
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(callerCandidatesCollection, event.candidate.toJSON()).catch(e => 
            console.error("Error writing caller ICE candidate:", e)
          );
        }
      };

      // 4. Create WebRTC Offer
      const offerDescription = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offerDescription);

      const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type
      };

      // 5. Save signaling session
      await setDoc(callDocRef, {
        callId: this.callId,
        callerId,
        calleeId,
        isVideo,
        offer,
        status: "ringing",
        timestamp: Date.now()
      });

      // 6. Listen for callee's answered description
      const unsubCall = onSnapshot(callDocRef, async (snapshot) => {
        const data = snapshot.data();
        if (data && data.answer && !this.peerConnection.currentRemoteDescription) {
          const answerDescription = new RTCSessionDescription(data.answer);
          await this.peerConnection.setRemoteDescription(answerDescription);
        }
        
        // Listen if callee ended call
        if (data && data.status === "ended") {
          this.terminateLocalCall();
        }
      });
      this.unsubscribeList.push(unsubCall);

      // 7. Listen for callee ICE candidates
      const unsubCalleeCandidates = onSnapshot(calleeCandidatesCollection, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            const candidate = new RTCIceCandidate(data);
            if (this.peerConnection && this.peerConnection.remoteDescription) {
              await this.peerConnection.addIceCandidate(candidate).catch(e => 
                console.error("Error adding callee ICE candidate:", e)
              );
            }
          }
        });
      });
      this.unsubscribeList.push(unsubCalleeCandidates);

      return this.callId;
    } catch (error) {
      console.error("Error starting outgoing call:", error);
      this.terminateLocalCall();
      throw error;
    }
  }

  /**
   * Accept/Answer an incoming call, generate session answers, and synchronize candidates.
   * @param {string} callId - Firestore Call document ID
   * @param {Function} onTrackCallback 
   * @param {Function} onIceStateChange 
   */
  async answerIncomingCall(callId, onTrackCallback, onIceStateChange) {
    try {
      this.callId = callId;
      const callDocRef = doc(db, "calls", callId);
      const callSnap = await getDoc(callDocRef);
      if (!callSnap.exists()) {
        throw new Error("Call signaling session expired.");
      }

      const callData = callSnap.data();
      const isVideo = callData.isVideo;

      // 1. Get user media
      await this.getLocalMedia(isVideo, true);

      // 2. Setup RTCPeerConnection
      this.initPeerConnection(onTrackCallback, onIceStateChange);

      const callerCandidatesCollection = collection(callDocRef, "callerCandidates");
      const calleeCandidatesCollection = collection(callDocRef, "calleeCandidates");

      // Handle local ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(calleeCandidatesCollection, event.candidate.toJSON()).catch(e => 
            console.error("Error writing callee ICE candidate:", e)
          );
        }
      };

      // 3. Apply Caller offer description
      const offerDescription = new RTCSessionDescription(callData.offer);
      await this.peerConnection.setRemoteDescription(offerDescription);

      // 4. Create local Answer description
      const answerDescription = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answerDescription);

      const answer = {
        type: answerDescription.type,
        sdp: answerDescription.sdp
      };

      // 5. Update Firestore record to accept call
      await updateDoc(callDocRef, {
        answer,
        status: "active",
        answeredAt: Date.now()
      });

      // 6. Listen for changes in call status (e.g. caller ended call)
      const unsubCall = onSnapshot(callDocRef, (snapshot) => {
        const data = snapshot.data();
        if (data && data.status === "ended") {
          this.terminateLocalCall();
        }
      });
      this.unsubscribeList.push(unsubCall);

      // 7. Synchronize caller ICE candidates
      const unsubCallerCandidates = onSnapshot(callerCandidatesCollection, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            const candidate = new RTCIceCandidate(data);
            if (this.peerConnection) {
              await this.peerConnection.addIceCandidate(candidate).catch(e => 
                console.error("Error adding caller ICE candidate:", e)
              );
            }
          }
        });
      });
      this.unsubscribeList.push(unsubCallerCandidates);

    } catch (error) {
      console.error("Error answering incoming call:", error);
      this.terminateLocalCall();
      throw error;
    }
  }

  /**
   * Monitor Firestore for incoming call alerts targeting the current user.
   * @param {string} userId - The authenticated user's ID
   * @param {Function} onIncomingCallCallback - Triggers when an active call offer is discovered
   * @returns {Function} Unsubscribe listener function
   */
  static listenForIncomingCalls(userId, onIncomingCallCallback) {
    const q = query(
      collection(db, "calls"),
      where("calleeId", "==", userId),
      where("status", "==", "ringing")
    );

    return onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const callData = change.doc.data();
          // Verify call is recent (under 60 seconds old to prevent ghost notifications)
          if (Date.now() - callData.timestamp < 60000) {
            onIncomingCallCallback({
              type: "added",
              callId: change.doc.id,
              callerId: callData.callerId,
              isVideo: callData.isVideo
            });
          }
        } else if (change.type === "removed" || change.type === "modified") {
          const callData = change.doc.data();
          // If the status has moved from ringing to ended, or doc deleted, dismiss it
          if (!callData || callData.status !== "ringing") {
            onIncomingCallCallback({
              type: "removed",
              callId: change.doc.id
            });
          }
        }
      });
    }, (error) => {
      console.error("Error listening for incoming calls in WebRTC service:", error);
    });
  }

  /**
   * Static method to decline/reject an incoming call without establishing a local connection
   * @param {string} callId - Firestore Call document ID
   */
  static async rejectCall(callId) {
    try {
      const callDocRef = doc(db, "calls", callId);
      await updateDoc(callDocRef, {
        status: "ended",
        endedAt: Date.now()
      });
    } catch (error) {
      console.error("Error rejecting call in WebRtcService:", error);
    }
  }

  /**
   * Explicitly end and clean up an active WebRTC session on both client and Firestore.
   */
  async endCallSession() {
    if (this.callId) {
      try {
        const callDocRef = doc(db, "calls", this.callId);
        await updateDoc(callDocRef, { status: "ended", endedAt: Date.now() });
      } catch (error) {
        console.error("Error updating call document to ended:", error);
      }
    }
    this.terminateLocalCall();
  }

  /**
   * Release media streams, close peer connections, and reset helper states locally.
   */
  terminateLocalCall() {
    // Unsubscribe from all snapshots
    this.unsubscribeList.forEach((unsub) => {
      if (typeof unsub === "function") unsub();
    });
    this.unsubscribeList = [];

    // Stop and clear local media tracks
    this.stopLocalMedia();

    // Close WebRTC Connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
    this.callId = null;
  }

  /**
   * Safely release camera and audio hardware captures.
   */
  stopLocalMedia() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }

  /**
   * Mute or unmute local audio tracks.
   * @param {boolean} isMuted 
   */
  setMute(isMuted) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }

  /**
   * Enable or disable local video transmission.
   * @param {boolean} isCamOff 
   */
  setCameraStatus(isCamOff) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = !isCamOff;
      });
    }
  }
}
