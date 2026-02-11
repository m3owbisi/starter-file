"use client";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "jsvectormap/dist/jsvectormap.css";
import "flatpickr/dist/flatpickr.min.css";
import "@/css/style.css";
import React, { useEffect, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { UserProvider } from "./context/UserContext";
import * as Ably from "ably";
import { AblyProvider, ChannelProvider } from "ably/react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const client = new Ably.Realtime({
    key: "hOKf0g.MYq_gA:vBCLEgU6f7tHCgiFfB0iRLYGFVoYAeYgjZMtoe2eULQ",
  });
  return (
    <html lang="en">
      <script src="https://app.unpkg.com/@rdkit/rdkit@2025.3.3-1.0.0/files/dist/RDKit_minimal.js"></script>
      <body suppressHydrationWarning={true}>
      <div className="font-poppins dark:bg-boxdark-2 dark:text-bodydark">
              <SessionProvider>
          <UserProvider>
            <AblyProvider client={client}>
              <ChannelProvider channelName="chat-demo1">
                {children}
              </ChannelProvider>
            </AblyProvider>
          </UserProvider>
        </SessionProvider>        
        <SpeedInsights />
      </div>
      </body>
    </html>
  );
}