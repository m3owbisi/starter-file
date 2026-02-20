"use client";

import ChatBox from "./chat-box.jsx";

/**
 * the Ably client is already initialised in layout.tsx and
 * provided via AblyProvider + ChannelProvider.
 * this wrapper simply renders ChatBox without creating a
 * duplicate client instance.
 */
export default function Chat() {
  return <ChatBox />;
}