"use client";
import React from "react";
import Link from "next/link";
import SidebarDropdown from "@/components/Sidebar/SidebarDropdown";
import { usePathname } from "next/navigation";

const SidebarItem = ({ item, pageName, setPageName }: any) => {
  const handleClick = () => {
    const updatedPageName =
      pageName !== item.label.toLowerCase() ? item.label.toLowerCase() : "";
    return setPageName(updatedPageName);
  };

  const pathname = usePathname();

  const isActive = (item: any) => {
    if (item.route === pathname) return true;
    if (item.route !== "/" && pathname.startsWith(item.route)) return true;
    if (item.children) {
      return item.children.some((child: any) => isActive(child));
    }
    return false;
  };

  const isItemActive = isActive(item);

  return (
    <>
      <li>
        <Link
          href={item.route}
          onClick={handleClick}
          className={`${
            isItemActive
              ? "bg-gradient-to-r from-[#3c50e0]/20 to-[#8b5cf6]/10 text-white border-l-[3px] border-[#3c50e0]"
              : "border-l-[3px] border-transparent"
          } group relative flex items-center gap-2.5 rounded-md px-4 py-2.5 text-bodydark1 transition-all duration-200 ease-in-out hover:bg-gradient-to-r hover:from-[#3c50e0]/10 hover:to-transparent hover:border-l-[3px] hover:border-[#3c50e0]/50`}
        >
          {/* icon with optional active glow */}
          <span
            className={`transition-all duration-200 ${
              isItemActive
                ? "text-[#3c50e0] drop-shadow-[0_0_6px_rgba(60,80,224,0.4)]"
                : "text-bodydark1 group-hover:text-[#3c50e0]"
            }`}
          >
            {item.icon}
          </span>
          <span
            className={`transition-colors duration-200 ${
              isItemActive ? "font-medium text-white" : ""
            }`}
          >
            {item.label}
          </span>

          {/* active indicator dot */}
          {isItemActive && (
            <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-[#3c50e0] shadow-[0_0_6px_rgba(60,80,224,0.6)]" />
          )}
        </Link>

        {item.children && (
          <div
            className={`translate transform overflow-hidden ${
              pageName !== item.label.toLowerCase() && "hidden"
            }`}
          >
            <SidebarDropdown item={item.children} />
          </div>
        )}
      </li>
    </>
  );
};

export default SidebarItem;