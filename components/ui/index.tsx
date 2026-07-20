// shadcn-style primitives for React Native (NativeWind)
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ── Screen ────────────────────────────────────────────────────────────
export function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const inner = <View className="flex-1 w-full max-w-3xl self-center px-4 py-4">{children}</View>;
  return (
    <SafeAreaView className="flex-1 bg-secondary" edges={["bottom"]}>
      {scroll ? <ScrollView contentContainerClassName="pb-8">{inner}</ScrollView> : inner}
    </SafeAreaView>
  );
}

// ── Button ────────────────────────────────────────────────────────────
type Variant = "default" | "secondary" | "destructive" | "outline" | "ghost";
const btnBase = "flex-row items-center justify-center rounded-xl px-4 py-3";
const btnVariants: Record<Variant, string> = {
  default: "bg-primary active:opacity-80",
  secondary: "bg-secondary border border-border active:opacity-80",
  destructive: "bg-destructive active:opacity-80",
  outline: "border border-border bg-background active:bg-secondary",
  ghost: "active:bg-secondary",
};
const btnText: Record<Variant, string> = {
  default: "text-primary-foreground font-semibold",
  secondary: "text-foreground font-semibold",
  destructive: "text-destructive-foreground font-semibold",
  outline: "text-foreground font-semibold",
  ghost: "text-foreground font-semibold",
};

export function Button({
  title,
  onPress,
  variant = "default",
  disabled,
  loading,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`${btnBase} ${btnVariants[variant]} ${disabled || loading ? "opacity-50" : ""}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === "default" ? "#fff" : "#18181b"} />
      ) : (
        <Text className={btnText[variant]}>{title}</Text>
      )}
    </Pressable>
  );
}

// ── Input ─────────────────────────────────────────────────────────────
export function Input({ label, ...props }: TextInputProps & { label?: string }) {
  return (
    <View className="mb-3">
      {label ? <Text className="mb-1 text-sm font-medium text-muted-foreground">{label}</Text> : null}
      <TextInput
        placeholderTextColor="#a1a1aa"
        className="rounded-xl border border-border bg-background px-3 py-3 text-foreground"
        {...props}
      />
    </View>
  );
}

// ── Card ──────────────────────────────────────────────────────────────
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <View className={`rounded-xl border border-border bg-card p-4 ${className}`}>{children}</View>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <Text className="mb-2 text-base font-semibold text-foreground">{children}</Text>;
}

// ── Badge ─────────────────────────────────────────────────────────────
type BadgeTone = "default" | "success" | "warning" | "destructive" | "muted";
const badgeTones: Record<BadgeTone, [string, string]> = {
  default: ["bg-primary", "text-primary-foreground"],
  success: ["bg-success", "text-success-foreground"],
  warning: ["bg-warning", "text-warning-foreground"],
  destructive: ["bg-destructive", "text-destructive-foreground"],
  muted: ["bg-muted", "text-muted-foreground"],
};

export function Badge({ label, tone = "default" }: { label: string; tone?: BadgeTone }) {
  const [bg, fg] = badgeTones[tone];
  return (
    <View className={`self-start rounded-full px-2.5 py-0.5 ${bg}`}>
      <Text className={`text-xs font-medium ${fg}`}>{label}</Text>
    </View>
  );
}

// ── List row ──────────────────────────────────────────────────────────
export function Row({
  title,
  subtitle,
  right,
  onPress,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between border-b border-border bg-card px-4 py-3 active:bg-secondary"
    >
      <View className="flex-1 pr-3">
        <Text className="font-medium text-foreground" numberOfLines={1}>{title}</Text>
        {subtitle ? <Text className="text-sm text-muted-foreground" numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {right}
    </Pressable>
  );
}

// ── Empty / loading states ────────────────────────────────────────────
export function EmptyState({ message }: { message: string }) {
  return (
    <View className="items-center py-12">
      <Text className="text-muted-foreground">{message}</Text>
    </View>
  );
}

export function Loading() {
  return (
    <View className="flex-1 items-center justify-center py-12">
      <ActivityIndicator size="large" />
    </View>
  );
}

export function ErrorText({ message }: { message?: string | null }) {
  if (!message) return null;
  return <Text className="mb-2 text-sm text-destructive">{message}</Text>;
}

// ── Stat tile ─────────────────────────────────────────────────────────
export function Stat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "warning" }) {
  return (
    <Card className="flex-1">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className={`mt-1 text-2xl font-bold ${tone === "warning" ? "text-warning" : "text-foreground"}`}>
        {value}
      </Text>
    </Card>
  );
}
