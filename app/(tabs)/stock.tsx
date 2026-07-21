import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ArrowLeftRight, ClipboardCheck, Package, Plus, TriangleAlert } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";
import { Badge, Button, Card, CardTitle, EmptyState, Loading, Row, Screen } from "@/components/ui";
import { getLowStockAlerts, getStockLevels, listProducts } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { useThemeColors } from "@/lib/theme";

export default function Stock() {
  const router = useRouter();
  const { profile } = useAuth();
  const colors = useThemeColors();
  const products = useQuery({ queryKey: ["products", ""], queryFn: () => listProducts() });
  const stock = useQuery({ queryKey: ["stock-levels"], queryFn: getStockLevels });
  const alerts = useQuery({ queryKey: ["low-stock"], queryFn: getLowStockAlerts });

  if (products.isLoading || stock.isLoading) {
    return (
      <Screen scroll={false}>
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen>
      {can.adjustStock(profile?.role) && (
        <View className="mb-4 flex-row flex-wrap gap-2">
          <Button title="Add stock" icon={Plus} onPress={() => router.push("/stock/add")} />
          <Button title="Transfer" icon={ArrowLeftRight} variant="outline" onPress={() => router.push("/stock/transfer")} />
          <Button title="Cycle count" icon={ClipboardCheck} variant="outline" onPress={() => router.push("/stock/count")} />
        </View>
      )}

      <Card className="mb-4">
        <CardTitle>Alerts</CardTitle>
        {(alerts.data ?? []).length === 0 ? (
          <Text className="text-muted-foreground">No low-stock items — everything is healthy.</Text>
        ) : (
          (alerts.data ?? []).map((a) => (
            <View
              key={`${a.product_id}-${a.location_id}`}
              className="flex-row items-center justify-between border-b border-border py-2"
            >
              <View className="flex-1 flex-row items-center pr-2">
                <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-warning/12">
                  <TriangleAlert color={colors.mutedForeground} size={16} />
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-foreground" numberOfLines={1}>
                    {a.name}
                  </Text>
                  <Text className="text-sm text-warning">
                    {a.quantity} left (reorder at {a.reorder_point})
                  </Text>
                </View>
              </View>
              {can.managePurchaseOrders(profile?.role) && (
                <Button
                  title="Reorder"
                  size="sm"
                  variant="outline"
                  onPress={() => router.push({ pathname: "/order/new", params: { productId: a.product_id } })}
                />
              )}
            </View>
          ))
        )}
      </Card>

      <CardTitle>Stock levels</CardTitle>
      {(products.data ?? []).length === 0 ? (
        <EmptyState icon={Package} message="No products yet." />
      ) : (
        (products.data ?? []).map((p) => {
          const qty = stock.data?.[p.id] ?? 0;
          return (
            <Row
              key={p.id}
              title={p.name}
              subtitle={p.sku}
              right={<Badge label={`${qty} ${p.unit}`} tone={qty <= p.reorder_point ? "warning" : "success"} />}
              onPress={() => router.push({ pathname: "/product/[id]", params: { id: p.id } })}
            />
          );
        })
      )}
    </Screen>
  );
}
