"use client";
import dynamic from "next/dynamic";
import React from "react";

import CTACard from "./components/CTACard";
import { AtomIcon, MessageCircle, Network, SearchIcon } from "lucide-react";

const DashboardCardMap = dynamic(
  () => import("@/components/Dashboard/components/DashboardCardMap"),
  {
    ssr: false,
  },
);

const DashboardCardChat = dynamic(
  () => import("@/components/Dashboard/components/DashboardCardChat"),
  {
    ssr: false,
  },
);

const Index: React.FC = () => {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        <CTACard
          subtitle="access & manage molecular datasets"
          title="molecule bank"
          href="/molecule-bank"
          gradientFrom="#3c50e0"
          gradientTo="#6366f1"
        >
          <AtomIcon size={24} />
        </CTACard>
        <CTACard
          subtitle="AI-powered molecule generation"
          title="generate molecule"
          href="/model"
          gradientFrom="#8b5cf6"
          gradientTo="#a78bfa"
        >
          <Network size={24} />
        </CTACard>
        <CTACard
          subtitle="search PubChem compound database"
          title="search compounds"
          href="/research"
          gradientFrom="#06b6d4"
          gradientTo="#22d3ee"
        >
          <SearchIcon size={24} />
        </CTACard>
        <CTACard
          subtitle="real-time research discussions"
          title="collaborative research"
          href="/message"
          gradientFrom="#f59e0b"
          gradientTo="#fbbf24"
        >
          <MessageCircle size={24} />
        </CTACard>
      </div>

      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <DashboardCardChat />
        <DashboardCardMap />
      </div>
    </>
  );
};

export default Index;