"use client";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    // reset animation on route change
    setIsVisible(false);
    setDisplayChildren(children);

    // trigger entrance animation
    const timer = requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => cancelAnimationFrame(timer);
  }, [pathname, children]);

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-2 opacity-0"
      }`}
    >
      {displayChildren}
    </div>
  );
};

export default PageTransition;
