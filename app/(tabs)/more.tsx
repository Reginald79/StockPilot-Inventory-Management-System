import { useRouter } from "expo-router";
import { BarChart3, LogOut, MapPin, Truck, Users as UsersIcon } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";
import { Badge, Card, CardTitle, Row, Screen, ThemeToggle } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { can } from "@/lib/permissions";

export default function More() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const initials = (profile?.full_name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <Screen>
      <View className="mb-6 items-center">
        <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-primary/12">
          <Text className="text-xl font-bold text-primary">{initials}</Text>
        </View>
        <Text className="text-lg font-semibold text-foreground">{profile?.full_name || "User"}</Text>
        <Badge label={profile?.role ?? "…"} tone="muted" />
      </View>

      <View className="mb-4 overflow-hidden rounded-xl border border-border shadow-sm shadow-black/5">
        <Row icon={Truck} title="Suppliers" subtitle="Manage supplier directory" onPress={() => router.push("/suppliers")} />
        {can.manageLocations(profile?.role) && (
          <Row icon={MapPin} title="Locations" subtitle="Warehouses & storefronts" onPress={() => router.push("/locations")} />
        )}
        <Row icon={BarChart3} title="Reports" subtitle="Sales & inventory analytics" onPress={() => router.push("/reports")} />
        {can.manageUsers(profile?.role) && (
          <Row icon={UsersIcon} title="Users & roles" subtitle="Admin only" onPress={() => router.push("/users")} />
        )}
      </View>

      <Card className="mb-4">
        <CardTitle>Appearance</CardTitle>
        <ThemeToggle />
      </Card>

      <View className="overflow-hidden rounded-xl border border-border shadow-sm shadow-black/5">
        <Row icon={LogOut} title="Sign out" onPress={signOut} />
      </View>
    </Screen>
  );
}
