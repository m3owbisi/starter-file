"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

// human-readable labels for route segments
const routeLabels: Record<string, string> = {
  "molecule-bank": "molecule bank",
  model: "generate molecules",
  research: "compound search",
  message: "collaborative research",
  "protein-viewer": "protein viewer",
  "dataset-upload": "dataset upload",
  "binding-prediction": "binding prediction",
  analytics: "analytics",
  experiments: "experiments",
  settings: "settings",
  profile: "profile",
};

const Breadcrumb: React.FC = () => {
  const pathname = usePathname();

  // split pathname into segments and remove empty strings
  const segments = pathname.split("/").filter(Boolean);

  // don't show breadcrumb on the dashboard
  if (segments.length === 0) return null;

  // build breadcrumb items with cumulative paths
  const breadcrumbItems = segments.map((segment, index) => {
    const path = "/" + segments.slice(0, index + 1).join("/");
    const label = routeLabels[segment] || segment.replace(/-/g, " ");
    const isLast = index === segments.length - 1;

    return { path, label, isLast };
  });

  return (
    <nav
      aria-label="breadcrumb"
      className="mb-6 flex items-center gap-1.5 text-sm"
    >
      {/* home link */}
      <Link
        href="/"
        className="flex items-center gap-1 text-bodydark transition-colors duration-200 hover:text-[#3c50e0] dark:text-bodydark dark:hover:text-[#3c50e0]"
      >
        <Home size={14} />
        <span>dashboard</span>
      </Link>

      {breadcrumbItems.map((item) => (
        <React.Fragment key={item.path}>
          <ChevronRight
            size={14}
            className="text-bodydark/50 dark:text-bodydark/50"
          />
          {item.isLast ? (
            <span className="font-medium text-[#3c50e0] dark:text-[#6366f1]">
              {item.label}
            </span>
          ) : (
            <Link
              href={item.path}
              className="text-bodydark transition-colors duration-200 hover:text-[#3c50e0] dark:text-bodydark dark:hover:text-[#3c50e0]"
            >
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
