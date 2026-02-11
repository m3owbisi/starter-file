"use client";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import React, { ReactNode } from "react";

interface CTACardProps {
  title: string;
  subtitle: string;
  href: string;
  children: ReactNode;
  gradientFrom?: string;
  gradientTo?: string;
}

const CTACard: React.FC<CTACardProps> = ({
  title,
  subtitle,
  href,
  children,
  gradientFrom = "#3c50e0",
  gradientTo = "#8b5cf6",
}) => {
  return (
    <Link href={href} id={`cta-card-${href.replace("/", "")}`} className="group block h-full">
      <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-stroke bg-white px-7.5 py-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 dark:border-[#1e1e1e] dark:bg-[#181818]">
        {/* animated gradient border top */}
        <div
          className="absolute left-0 right-0 top-0 h-[3px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `linear-gradient(90deg, ${gradientFrom}, ${gradientTo})`,
          }}
        />

        {/* icon with animated background */}
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110"
          style={{
            background: `linear-gradient(135deg, ${gradientFrom}15, ${gradientTo}15)`,
            color: gradientFrom,
          }}
        >
          {children}
        </div>

        <div className="mt-4 flex flex-1 items-end justify-between">
          <div>
            <h4 className="text-title-md font-semibold text-black dark:text-white">
              {title}
            </h4>
            <span className="text-sm font-medium text-body dark:text-bodydark">
              {subtitle}
            </span>
          </div>
        </div>

        {/* animated arrow button */}
        <div
          className="mt-3 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 group-hover:translate-x-1"
          style={{
            background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
          }}
        >
          <ArrowRight size={18} className="text-white" />
        </div>

        {/* subtle background glow on hover */}
        <div
          className="pointer-events-none absolute -bottom-12 -right-12 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20"
          style={{ background: gradientFrom }}
        />
      </div>
    </Link>
  );
};

export default CTACard;