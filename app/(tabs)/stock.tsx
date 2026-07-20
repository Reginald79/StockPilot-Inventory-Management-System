import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { Badge, Button, Card, CardTitle, EmptyState, Loading, Row, Screen } from "@/components/ui";
import { getLowStockAlerts, getStockLevels, listProducts } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { can } from "@/lib/permissions";

export default function Stock() {
  const router = useRouter();
  const { profile } = useAuth();
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
          <Button title="+ Add stock" onPress={() => router.push("/stock/add")} />
          <Button title="Transfer" variant="outline" onPress={() => router.push("/stock/transfer")} />
          <Button title="Cycle count" variant="outline" onPress={() => router.push("/stock/count")} />
        </View>
      )}

      <Card className="mb-4">
        <CardTitle>Alerts</CardTitle>
        {(alerts.data ?? []).length === 0 ? (
          <Text className="text-muted-foreground">No low-stock items.</Text>
        ) : (
          (alerts.data ?? []).map((a) => (
            <View
              key={`${a.product_id}-${a.location_id}`}
              className="flex-row items-center justify-between border-b border-border py-1.5"
            >
              <Text className="flex-1 pr-2 text-warning">
                ⚠ {a.name}: {a.quantity} left (reorder at {a.reorder_point})
              </Text>
              {can.managePurchaseOrders(profile?.role) && (
                <Button
                  title="Reorder"
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
        <EmptyState message="No products yet." />
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
