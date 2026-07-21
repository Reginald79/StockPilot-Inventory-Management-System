// shadcn-style primitives for React Native (NativeWind)
import { ChevronRight, Monitor, Moon, Sun } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type ColorValue,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, useThemeColors, type ThemePreference } from "@/lib/theme";

type IconType = React.ComponentType<{ color?: ColorValue; size?: number | string }>;

// ── Screen ────────────────────────────────────────────────────────────
export function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const inner = <View className="flex-1 w-full max-w-3xl self-center px-4 py-4">{children}</View>;
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      {scroll ? <ScrollView contentContainerClassName="pb-8">{inner}</ScrollView> : inner}
    </SafeAreaView>
  );
}

// ── Button ────────────────────────────────────────────────────────────
type Variant = "default" | "secondary" | "destructive" | "outline" | "ghost";
type Size = "default" | "sm";

const btnBase = "flex-row items-center justify-center gap-2 rounded-lg";
const btnSizes: Record<Size, string> = {
  default: "px-4 py-3",
  sm: "px-3 py-1.5",
};
const btnVariants: Record<Variant, string> = {
  default: "bg-primary active:opacity-80 shadow-sm shadow-black/10",
  secondary: "bg-secondary border border-border active:opacity-80",
  destructive: "bg-destructive active:opacity-80",
  outline: "border border-border bg-card active:bg-secondary",
  ghost: "active:bg-secondary",
};
const btnText: Record<Variant, string> = {
  default: "text-primary-foreground font-semibold",
  secondary: "text-foreground font-semibold",
  destructive: "text-destructive-foreground font-semibold",
  outline: "text-foreground font-semibold",
  ghost: "text-foreground font-semibold",
};
const btnTextSize: Record<Size, string> = { default: "text-base", sm: "text-sm" };
const btnIconSize: Record<Size, number> = { default: 16, sm: 14 };

export function Button({
  title,
  onPress,
  variant = "default",
  size = "default",
  icon: Icon,
  disabled,
  loading,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  icon?: IconType;
  disabled?: boolean;
  loading?: boolean;
}) {
  const colors = useThemeColors();
  const contentColor = variant === "default" ? colors.primaryForeground : variant === "destructive" ? "#FFFFFF" : colors.foreground;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`${btnBase} ${btnSizes[size]} ${btnVariants[variant]} ${disabled || loading ? "opacity-50" : ""}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={contentColor} />
      ) : (
        <>
          {Icon ? <Icon color={contentColor} size={btnIconSize[size]} /> : null}
          <Text className={`${btnText[variant]} ${btnTextSize[size]}`}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

// ── Input ─────────────────────────────────────────────────────────────
export function Input({
  label,
  error,
  className = "",
  onFocus,
  onBlur,
  ...props
}: TextInputProps & { label?: string; error?: string | null; className?: string }) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);
  const borderClass = error ? "border-destructive" : focused ? "border-primary" : "border-border";

  return (
    <View className="mb-3">
      {label ? <Text className="mb-1 text-sm font-medium text-muted-foreground">{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.mutedForeground}
        className={`rounded-lg border bg-card px-3 py-3 text-foreground ${borderClass} ${className}`}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
      {error ? <Text className="mt-1 text-xs text-destructive">{error}</Text> : null}
    </View>
  );
}

// ── Card ──────────────────────────────────────────────────────────────
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <View className={`rounded-xl border border-border bg-card p-4 shadow-sm shadow-black/5 ${className}`}>{children}</View>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <Text className="mb-2 text-base font-semibold text-foreground">{children}</Text>;
}

// ── Badge ─────────────────────────────────────────────────────────────
type BadgeTone = "default" | "success" | "warning" | "destructive" | "muted";
const badgeTones: Record<BadgeTone, string> = {
  default: "bg-primary/12 text-primary",
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/12 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

export function Badge({ label, tone = "default" }: { label: string; tone?: BadgeTone }) {
  return (
    <View className={`self-start rounded-full px-2.5 py-1 ${badgeTones[tone].split(" ")[0]}`}>
      <Text className={`text-xs font-medium ${badgeTones[tone].split(" ")[1]}`}>{label}</Text>
    </View>
  );
}

// ── List row ──────────────────────────────────────────────────────────
export function Row({
  title,
  subtitle,
  right,
  icon: Icon,
  onPress,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  icon?: IconType;
  onPress?: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className={`flex-row items-center justify-between border-b border-border bg-card px-4 py-3 ${onPress ? "active:bg-secondary" : ""}`}
    >
      <View className="flex-1 flex-row items-center pr-3">
        {Icon ? (
          <View className="mr-3 h-9 w-9 items-center justify-center rounded-lg bg-secondary">
            <Icon color={colors.mutedForeground} size={18} />
          </View>
        ) : null}
        <View className="flex-1">
          <Text className="font-medium text-foreground" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text className="text-sm text-muted-foreground" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      <View className="flex-row items-center gap-2">
        {right}
        {onPress ? <ChevronRight color={colors.mutedForeground} size={18} /> : null}
      </View>
    </Pressable>
  );
}

// ── Divider ───────────────────────────────────────────────────────────
export function Divider({ className = "" }: { className?: string }) {
  return <View className={`h-px bg-border ${className}`} />;
}

// ── Empty / loading states ────────────────────────────────────────────
export function EmptyState({ message, icon: Icon }: { message: string; icon?: IconType }) {
  const colors = useThemeColors();
  return (
    <View className="items-center py-12">
      {Icon ? (
        <View className="mb-3 h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Icon color={colors.mutedForeground} size={22} />
        </View>
      ) : null}
      <Text className="text-muted-foreground">{message}</Text>
    </View>
  );
}

export function Loading() {
  const colors = useThemeColors();
  return (
    <View className="flex-1 items-center justify-center py-12">
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function ErrorText({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <View className="mb-3 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2">
      <Text className="text-sm text-destructive">{message}</Text>
    </View>
  );
}

// ── Stat tile ─────────────────────────────────────────────────────────
export function Stat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "warning" }) {
  return (
    <Card className="flex-1">
      <Text className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</Text>
      <Text className={`mt-1.5 text-2xl font-bold ${tone === "warning" ? "text-warning" : "text-foreground"}`}>
        {value}
      </Text>
    </Card>
  );
}

// ── Segmented control ────────────────────────────────────────────────
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: IconType }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const colors = useThemeColors();
  return (
    <View className="flex-row rounded-lg bg-secondary p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        const Icon = opt.icon;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-md py-2 ${active ? "bg-card shadow-sm shadow-black/5" : ""}`}
          >
            {Icon ? <Icon color={active ? colors.primary : colors.mutedForeground} size={15} /> : null}
            <Text className={`text-sm font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Theme toggle ──────────────────────────────────────────────────────
export function ThemeToggle() {
  const { preference, setPreference } = useTheme();
  return (
    <SegmentedControl<ThemePreference>
      value={preference}
      onChange={setPreference}
      options={[
        { value: "light", label: "Light", icon: Sun },
        { value: "dark", label: "Dark", icon: Moon },
        { value: "system", label: "Auto", icon: Monitor },
      ]}
    />
  );
}
