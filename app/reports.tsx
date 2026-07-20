import { useQuery } from "@tanstack/react-query";
import React from "react";
import { Text, View } from "react-native";
import { Card, CardTitle, EmptyState, Loading, Screen } from "@/components/ui";
import { getInventoryValue, getSalesDaily } from "@/lib/api";

export default function Reports() {
  const salesDaily = useQuery({ queryKey: ["sales-daily"], queryFn: getSalesDaily });
  const invValue = useQuery({ queryKey: ["inventory-value"], queryFn: getInventoryValue });

  if (salesDaily.isLoading || invValue.isLoading) {
    return (
      <Screen scroll={false}>
        <Loading />
      </Screen>
    );
  }

  const totalCost = (invValue.data ?? []).reduce((s, r) => s + Number(r.stock_value_cost), 0);
  const totalRetail = (invValue.data ?? []).reduce((s, r) => s + Number(r.stock_value_retail), 0);
  const maxRevenue = Math.max(1, ...(salesDaily.data ?? []).map((d) => Number(d.revenue)));

  return (
    <Screen>
      <Card className="mb-4">
        <CardTitle>Sales — last 30 days</CardTitle>
        {(salesDaily.data ?? []).length === 0 ? (
          <EmptyState message="No sales data yet." />
        ) : (
          (salesDaily.data ?? []).map((d) => (
            <View key={d.day} className="py-1.5">
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted-foreground">{d.day}</Text>
                <Text className="text-sm font-medium text-foreground">
                  ₵{Number(d.revenue).toFixed(2)} · {d.num_sales} sales
                </Text>
              </View>
              <View className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                <View
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${(Number(d.revenue) / maxRevenue) * 100}%` }}
                />
              </View>
            </View>
          ))
        )}
      </Card>

      <Card className="mb-4">
        <CardTitle>Inventory valuation</CardTitle>
        <View className="mb-2 flex-row justify-between">
          <Text className="text-muted-foreground">At cost</Text>
          <Text className="font-semibold text-foreground">₵{totalCost.toFixed(2)}</Text>
        </View>
        <View className="mb-4 flex-row justify-between">
          <Text className="text-muted-foreground">At retail</Text>
          <Text className="font-semibold text-foreground">₵{totalRetail.toFixed(2)}</Text>
        </View>
        {(invValue.data ?? []).slice(0, 15).map((r) => (
          <View key={r.product_id} className="flex-row justify-between py-1">
            <Text className="flex-1 text-sm text-foreground" numberOfLines={1}>
              {r.name} ({r.total_quantity})
            </Text>
            <Text className="text-sm text-muted-foreground">₵{Number(r.stock_value_cost).toFixed(2)}</Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
