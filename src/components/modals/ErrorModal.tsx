"use client";
import React from "react";
import { X } from "lucide-react";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  title = "error",
  message,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-boxdark">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
          >
            <X size={20} />
          </button>
        </div>
        <p className="mb-6 text-gray-700 dark:text-gray-300">{message}</p>
        <button
          onClick={onClose}
          className="w-full rounded-lg bg-primary p-3 text-white transition hover:bg-opacity-90"
        >
          close
        </button>
      </div>
    </div>
  );
};

export default ErrorModal;
