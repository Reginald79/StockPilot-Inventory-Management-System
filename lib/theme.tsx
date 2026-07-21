import { DarkTheme, DefaultTheme, type Theme as NavigationTheme } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";

export type ThemePreference = "light" | "dark" | "system";
export type EffectiveScheme = "light" | "dark";

const STORAGE_KEY = "stockpilot-theme-preference";

interface ThemeContextValue {
  preference: ThemePreference;
  effective: EffectiveScheme;
  setPreference: (p: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { setColorScheme } = useNativeWindColorScheme();
  const systemScheme = useSystemColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === "light" || stored === "dark" || stored === "system") {
        setPreferenceState(stored);
        setColorScheme(stored);
      }
    });
  }, []);

  const setPreference = (p: ThemePreference) => {
    setPreferenceState(p);
    setColorScheme(p);
    AsyncStorage.setItem(STORAGE_KEY, p);
  };

  const effective: EffectiveScheme = preference === "system" ? (systemScheme ?? "light") : preference;

  return <ThemeContext.Provider value={{ preference, effective, setPreference }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

// Raw hex mirrors of the CSS vars in global.css, for spots that need an
// actual color string rather than a className (icon `color` props,
// ActivityIndicator, TextInput placeholder color).
const palette: Record<
  EffectiveScheme,
  { foreground: string; mutedForeground: string; primary: string; primaryForeground: string; card: string; background: string; border: string; destructive: string }
> = {
  light: {
    foreground: "#1E2129",
    mutedForeground: "#6B7280",
    primary: "#476C9E",
    primaryForeground: "#FAFAFB",
    card: "#FFFFFF",
    background: "#F4F5F7",
    border: "#E0E2E7",
    destructive: "#C53A3A",
  },
  dark: {
    foreground: "#E5E7EB",
    mutedForeground: "#9CA3AF",
    primary: "#7698C7",
    primaryForeground: "#0F1217",
    card: "#1A1D23",
    background: "#13151A",
    border: "#2C3038",
    destructive: "#D6524C",
  },
};

export function useThemeColors() {
  const { effective } = useTheme();
  return palette[effective];
}

// React Navigation renders its own chrome (stack headers, tab bar) outside
// NativeWind's className system, so it needs an explicit matching theme.
export function getNavigationTheme(effective: EffectiveScheme): NavigationTheme {
  const base = effective === "dark" ? DarkTheme : DefaultTheme;
  const p = palette[effective];
  return {
    ...base,
    dark: effective === "dark",
    colors: { ...base.colors, background: p.background, card: p.card, text: p.foreground, border: p.border, primary: p.primary, notification: p.destructive },
  };
}
