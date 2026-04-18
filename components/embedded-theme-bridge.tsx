"use client";

import {useEffect} from "react";
import {useTheme} from "next-themes";

type EmbeddedTheme = "light" | "dark";

const EMBEDDED_THEME_MESSAGE_TYPE = "CHECK_CX_EMBED_THEME";

function getEmbeddedThemeFromUrl(): EmbeddedTheme | null {
  const params = new URLSearchParams(window.location.search);
  if (params.get("ui_mode") !== "embedded") {
    return null;
  }
  const theme = params.get("theme");
  return theme === "dark" || theme === "light" ? theme : null;
}

function getAllowedHostOrigin(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("src_host");
}

function applyEmbeddedTheme(theme: EmbeddedTheme) {
  const root = document.documentElement;
  const isDark = theme === "dark";
  root.classList.toggle("dark", isDark);
  root.style.colorScheme = isDark ? "dark" : "light";
}

export function EmbeddedThemeBridge() {
  const {setTheme} = useTheme();

  useEffect(() => {
    const initialTheme = getEmbeddedThemeFromUrl();
    if (!initialTheme) {
      return;
    }

    applyEmbeddedTheme(initialTheme);
    setTheme(initialTheme);
    const allowedHostOrigin = getAllowedHostOrigin();

    const handleMessage = (event: MessageEvent) => {
      if (allowedHostOrigin && event.origin !== allowedHostOrigin) {
        return;
      }

      const data = event.data as { type?: string; theme?: unknown } | undefined;
      if (data?.type !== EMBEDDED_THEME_MESSAGE_TYPE) {
        return;
      }

      if (data.theme !== "dark" && data.theme !== "light") {
        return;
      }

      setTheme(data.theme);
      applyEmbeddedTheme(data.theme);
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [setTheme]);

  return null;
}
