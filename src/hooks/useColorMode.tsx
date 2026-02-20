"use client";

import { useSettings } from "@/app/context/SettingsContext";

/**
 * Drop-in replacement — now backed by SettingsContext
 * so the theme persists to the database across sessions.
 */
const useColorMode = (): [string, (mode: string) => void] => {
  const { theme, setTheme } = useSettings();

  const setColorMode = (mode: string) => {
    if (mode === "dark" || mode === "light") {
      setTheme(mode);
    }
  };

  return [theme, setColorMode];
};

export default useColorMode;