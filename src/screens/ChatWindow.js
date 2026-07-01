import React from "react";
import ChatScreen from "./ChatScreen";

/**
 * ChatWindow Component
 * Upgraded to serve as the main entrypoint wrapper for ChatScreen,
 * delivering a premium AI coaching and real-time social learning environment.
 */
export default function ChatWindow({ currentUserId, partnerId, onBackClick, onStartVoiceCall }) {
  return (
    <ChatScreen
      currentUserId={currentUserId}
      partnerId={partnerId}
      onBackClick={onBackClick}
      onStartVoiceCall={onStartVoiceCall}
    />
  );
}
