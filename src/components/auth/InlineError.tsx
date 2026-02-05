import React from "react";

interface InlineErrorProps {
  message?: string;
}

const InlineError: React.FC<InlineErrorProps> = ({ message }) => {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-500">{message}</p>;
};

export default InlineError;
