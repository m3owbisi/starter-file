"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  icon: React.ReactNode;
  color?: "primary" | "success" | "warning" | "danger" | "info";
  loading?: boolean;
}

const colorClasses = {
  primary: {
    bg: "bg-gradient-to-br from-[#3c50e0]/10 to-[#3c50e0]/5",
    iconBg: "bg-gradient-to-br from-[#3c50e0] to-[#5b6fed]",
    text: "text-[#3c50e0]",
    border: "border-[#3c50e0]/20",
  },
  success: {
    bg: "bg-gradient-to-br from-[#10b981]/10 to-[#10b981]/5",
    iconBg: "bg-gradient-to-br from-[#10b981] to-[#34d399]",
    text: "text-[#10b981]",
    border: "border-[#10b981]/20",
  },
  warning: {
    bg: "bg-gradient-to-br from-[#f59e0b]/10 to-[#f59e0b]/5",
    iconBg: "bg-gradient-to-br from-[#f59e0b] to-[#fbbf24]",
    text: "text-[#f59e0b]",
    border: "border-[#f59e0b]/20",
  },
  danger: {
    bg: "bg-gradient-to-br from-[#ef4444]/10 to-[#ef4444]/5",
    iconBg: "bg-gradient-to-br from-[#ef4444] to-[#f87171]",
    text: "text-[#ef4444]",
    border: "border-[#ef4444]/20",
  },
  info: {
    bg: "bg-gradient-to-br from-[#06b6d4]/10 to-[#06b6d4]/5",
    iconBg: "bg-gradient-to-br from-[#06b6d4] to-[#22d3ee]",
    text: "text-[#06b6d4]",
    border: "border-[#06b6d4]/20",
  },
};

const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon,
  color = "primary",
  loading = false,
}) => {
  const colors = colorClasses[color];

  const getTrendIcon = () => {
    if (trend === undefined) return null;
    if (trend > 0) return <TrendingUp size={14} />;
    if (trend < 0) return <TrendingDown size={14} />;
    return <Minus size={14} />;
  };

  const getTrendColor = () => {
    if (trend === undefined) return "";
    if (trend > 0) return "text-[#10b981]";
    if (trend < 0) return "text-[#ef4444]";
    return "text-gray-500";
  };

  if (loading) {
    return (
      <div className={`analytics-card ${colors.bg} ${colors.border} animate-pulse`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24 mb-3"></div>
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
          </div>
          <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`analytics-card ${colors.bg} ${colors.border}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 lowercase">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 lowercase">
            {value}
          </h3>
          <div className="flex items-center gap-2">
            {trend !== undefined && (
              <span className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className="lowercase">{Math.abs(trend)}%</span>
              </span>
            )}
            {(trendLabel || subtitle) && (
              <span className="text-xs text-gray-500 dark:text-gray-400 lowercase">
                {trendLabel || subtitle}
              </span>
            )}
          </div>
        </div>
        <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${colors.iconBg} text-white shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default MetricsCard;
