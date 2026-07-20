import { useRouter } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { Badge, Button, Row, Screen } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { can } from "@/lib/permissions";

export default function More() {
  const router = useRouter();
  const { profile, signOut } = useAuth();

  return (
    <Screen>
      <View className="mb-6 items-center">
        <Text className="text-lg font-semibold text-foreground">{profile?.full_name || "User"}</Text>
        <Badge label={profile?.role ?? "…"} tone="muted" />
      </View>

      <Row title="Suppliers" subtitle="Manage supplier directory" onPress={() => router.push("/suppliers")} />
      {can.manageLocations(profile?.role) && (
        <Row title="Locations" subtitle="Warehouses & storefronts" onPress={() => router.push("/locations")} />
      )}
      <Row title="Reports" subtitle="Sales & inventory analytics" onPress={() => router.push("/reports")} />
      {can.manageUsers(profile?.role) && (
        <Row title="Users & roles" subtitle="Admin only" onPress={() => router.push("/users")} />
      )}

      <View className="mt-8">
        <Button title="Sign out" variant="outline" onPress={signOut} />
      </View>
    </Screen>
  );
}
