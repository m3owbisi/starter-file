"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  code?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  onRetry,
  code 
}) => {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800/30 dark:bg-red-900/10">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
        <div className="flex flex-col">
          <p className="text-sm font-medium text-red-800 dark:text-red-300">
            {message}
          </p>
          {code && (
            <p className="text-xs text-red-600/70 dark:text-red-400/70">
              error code: {code}
            </p>
          )}
        </div>
      </div>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 transition-all hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
        >
          <RefreshCw className="h-4 w-4" />
          retry prediction
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
