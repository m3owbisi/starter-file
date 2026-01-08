"use client";

import * as Ably from "ably";
import ChatBox from "./chat-box.jsx";

export default function Chat() {
  const client = new Ably.Realtime({
    key: "hOKf0g.MYq_gA:vBCLEgU6f7tHCgiFfB0iRLYGFVoYAeYgjZMtoe2eULQ",
  });
  return <ChatBox />;
}