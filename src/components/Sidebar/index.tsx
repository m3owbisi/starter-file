"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import SidebarItem from "@/components/Sidebar/SidebarItem";
import ClickOutside from "@/components/ClickOutside";
import useLocalStorage from "@/hooks/useLocalStorage";
import {
  LayoutGrid,
  Atom,
  Network,
  Microscope,
  Settings,
  MessageSquareText,
  ChevronLeft,
  Dna,
  Upload,
  Target,
  BarChart3,
  FlaskConical,
} from "lucide-react";
interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

const menuGroups = [
  {
    name: "",
    menuItems: [
      {
        icon: <LayoutGrid size={25} />,
        label: "dashboard",
        route: "/",
      },
      {
        icon: <Atom size={25} />,
        label: "molecules bank",
        route: "/molecule-bank",
      },
      {
        icon: <Network size={25} />,
        label: "model",
        route: "/model",
      },
      {
        icon: <Microscope size={25} />,
        label: "research",
        route: "/research",
      },
      {
        icon: <Dna size={25} />,
        label: "protein viewer",
        route: "/protein-viewer",
      },
      {
        icon: <Upload size={25} />,
        label: "dataset upload",
        route: "/dataset-upload",
      },
      {
        icon: <Target size={25} />,
        label: "binding prediction",
        route: "/binding-prediction",
      },
      {
        icon: <BarChart3 size={25} />,
        label: "analytics",
        route: "/analytics",
      },
      {
        icon: <FlaskConical size={25} />,
        label: "experiments",
        route: "/experiments",
      },
      {
        icon: <MessageSquareText size={25} />,
        label: "messages",
        route: "/message",
      },
    ],
  },
  {
    name: "others",
    menuItems: [
      {
        icon: <Settings size={25} />,
        label: "settings",
        route: "/settings",
      },
    ],
  },
];

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const pathname = usePathname();
  const [pageName, setPageName] = useLocalStorage("selectedMenu", "dashboard");

  return (
    <ClickOutside onClick={() => setSidebarOpen(false)}>
      <aside
        className={`fixed left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-black duration-300 ease-linear dark:bg-[#000000] lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
          <Link href="/">
            <div className="flex flex-row items-center justify-center space-x-2">
              <div className="ml-2 rounded-lg bg-[#3c4fe0] p-1">
                <Image
                  width={32}
                  height={32}
                  src={"/images/logo/dna.svg"}
                  alt="logo"
                  priority
                />
              </div>
              <p className="text-xl font-semibold text-white">protein bind</p>
            </div>
          </Link>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-controls="sidebar"
            className="block lg:hidden"
          >
            <ChevronLeft />
          </button>
        </div>

        <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
          <nav className="mt-5 px-4 py-4 lg:mt-9 lg:px-6">
            {menuGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">
                  {group.name}
                </h3>

                <ul className="mb-6 flex flex-col gap-2">
                  {group.menuItems.map((menuItem, menuIndex) => (
                    <SidebarItem
                      key={menuIndex}
                      item={menuItem}
                      pageName={pageName}
                      setPageName={setPageName}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </ClickOutside>
  );
};

export default Sidebar;