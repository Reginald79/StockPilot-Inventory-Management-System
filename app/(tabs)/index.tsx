import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { Badge, Button, Card, CardTitle, EmptyState, Loading, Screen, Stat } from "@/components/ui";
import { getInventoryValue, getLowStockAlerts, getSalesDaily } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function Dashboard() {
  const router = useRouter();
  const { profile } = useAuth();

  const alerts = useQuery({ queryKey: ["low-stock"], queryFn: getLowStockAlerts });
  const salesDaily = useQuery({ queryKey: ["sales-daily"], queryFn: getSalesDaily });
  const invValue = useQuery({ queryKey: ["inventory-value"], queryFn: getInventoryValue });

  if (alerts.isLoading || salesDaily.isLoading || invValue.isLoading) {
    return (
      <Screen scroll={false}>
        <Loading />
      </Screen>
    );
  }

  const today = salesDaily.data?.[0];
  const totalStockValue = (invValue.data ?? []).reduce((s, r) => s + Number(r.stock_value_cost), 0);

  return (
    <Screen>
      <Text className="mb-4 text-muted-foreground">
        Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}
      </Text>

      <View className="mb-4 flex-row gap-3">
        <Stat label="Today's revenue" value={`₵${Number(today?.revenue ?? 0).toFixed(2)}`} />
        <Stat label="Stock value (cost)" value={`₵${totalStockValue.toFixed(2)}`} />
      </View>
      <View className="mb-4 flex-row gap-3">
        <Stat label="Sales today" value={String(today?.num_sales ?? 0)} />
        <Stat
          label="Low-stock items"
          value={String(alerts.data?.length ?? 0)}
          tone={(alerts.data?.length ?? 0) > 0 ? "warning" : "default"}
        />
      </View>

      <Card className="mb-4">
        <CardTitle>Low-stock alerts</CardTitle>
        {(alerts.data ?? []).length === 0 ? (
          <EmptyState message="All stock levels are healthy." />
        ) : (
          (alerts.data ?? []).slice(0, 8).map((a) => (
            <View key={`${a.product_id}-${a.location_id}`} className="flex-row items-center justify-between py-2">
              <View className="flex-1 pr-2">
                <Text className="font-medium text-foreground">{a.name}</Text>
                <Text className="text-sm text-muted-foreground">
                  {a.sku} · {a.location_name}
                </Text>
              </View>
              <Badge label={`${a.quantity} left (min ${a.reorder_point})`} tone="warning" />
            </View>
          ))
        )}
      </Card>

      <View className="gap-3">
        <Button title="Record a sale" onPress={() => router.push("/sale/new")} />
        <Button title="View reports" variant="outline" onPress={() => router.push("/reports")} />
      </View>
    </Screen>
  );
}
