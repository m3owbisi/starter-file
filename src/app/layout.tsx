"use client";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "jsvectormap/dist/jsvectormap.css";
import "flatpickr/dist/flatpickr.min.css";
import "@/css/style.css";
import React, { useEffect, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { UserProvider } from "./context/UserContext";
import { SettingsProvider } from "./context/SettingsContext";
import { DatasetProvider } from "./context/DatasetContext";
import * as Ably from "ably";
import { AblyProvider, ChannelProvider } from "ably/react";
import Script from "next/script";

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
      <Script src="https://app.unpkg.com/@rdkit/rdkit@2025.3.3-1.0.0/files/dist/RDKit_minimal.js" strategy="beforeInteractive" />
      <body suppressHydrationWarning={true}>
      <div className="font-poppins dark:bg-boxdark-2 dark:text-bodydark">
              <SessionProvider>
          <UserProvider>
            <SettingsProvider>
              <DatasetProvider>
                <AblyProvider client={client}>
                  <ChannelProvider channelName="proteinbind-chat">
                    {children}
                  </ChannelProvider>
                </AblyProvider>
              </DatasetProvider>
            </SettingsProvider>
          </UserProvider>
        </SessionProvider>        
        <SpeedInsights />
      </div>
      </body>
    </html>
  );
}