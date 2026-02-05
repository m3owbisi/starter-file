"use client";

import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = "md", 
  message = "processing prediction..." 
}) => {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <div className="relative">
        {/* outer ring */}
        <div
          className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-primary/20`}
          style={{ borderTopColor: "#3c4fe0" }}
        />
        {/* inner glow effect */}
        <div
          className={`absolute inset-0 ${sizeClasses[size]} animate-pulse rounded-full bg-primary/10`}
        />
      </div>
      {message && (
        <p className="animate-pulse text-sm text-body dark:text-bodydark">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
