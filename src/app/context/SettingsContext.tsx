"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import {
  getUserTheme,
  updateUserTheme,
} from "@/lib/actions/settings.actions";

// ─────────────────────────────────────────────────────────────────────
// Context shape
// ─────────────────────────────────────────────────────────────────────
interface SettingsContextValue {
  theme: "dark" | "light";
  setTheme: (mode: "dark" | "light") => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  theme: "light",
  setTheme: () => {},
});

// ─────────────────────────────────────────────────────────────────────
// DOM helper — apply or remove the "dark" class on <body>
// ─────────────────────────────────────────────────────────────────────
function applyTheme(t: "dark" | "light") {
  if (typeof window === "undefined") return;
  if (t === "dark") {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }
}

// ─────────────────────────────────────────────────────────────────────
// localStorage helpers (instant reload, no flicker)
// ─────────────────────────────────────────────────────────────────────
const LS_KEY = "proteinbind_theme";

function readLocal(): "dark" | "light" | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(LS_KEY);
    return v === "dark" ? "dark" : v === "light" ? "light" : null;
  } catch {
    return null;
  }
}

function writeLocal(t: "dark" | "light") {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, t);
  } catch {
    /* noop */
  }
}

// ─────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────
export function SettingsProvider({ children }: { children: ReactNode }) {
  // 1. Hydrate from localStorage instantly (prevents theme flicker)
  const [theme, setThemeState] = useState<"dark" | "light">(() => {
    const cached = readLocal();
    if (cached) {
      applyTheme(cached);
      return cached;
    }
    return "light";
  });

  const { data: session, status } = useSession();
  const didSync = useRef(false);

  // 2. On login — fetch from DB (source of truth) & reconcile
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.email) return;
    if (didSync.current) return;
    didSync.current = true;

    (async () => {
      try {
        const dbTheme = await getUserTheme(session.user!.email!);
        setThemeState(dbTheme);
        writeLocal(dbTheme);
        applyTheme(dbTheme);
      } catch {
        // keep localStorage value as fallback
      }
    })();
  }, [status, session?.user?.email]);

  // 3. Keep body class in sync whenever state changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // 4. Update handler — optimistic UI, then persist to DB
  const setTheme = useCallback(
    (mode: "dark" | "light") => {
      // instant UI
      setThemeState(mode);
      writeLocal(mode);
      applyTheme(mode);

      // persist to DB in background
      if (session?.user?.email) {
        updateUserTheme(session.user.email, mode).catch((err) =>
          console.error("failed to persist theme:", err),
        );
      }
    },
    [session?.user?.email],
  );

  return (
    <SettingsContext.Provider value={{ theme, setTheme }}>
      {children}
    </SettingsContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────
export function useSettings() {
  return useContext(SettingsContext);
}
