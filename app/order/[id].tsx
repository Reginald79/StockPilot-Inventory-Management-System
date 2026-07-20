import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { Badge, Button, Card, CardTitle, ErrorText, Loading, Screen } from "@/components/ui";
import { cancelPurchaseOrder, getPurchaseOrder, receivePurchaseOrder } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { can } from "@/lib/permissions";

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { profile } = useAuth();

  const po = useQuery({ queryKey: ["purchase-order", id], queryFn: () => getPurchaseOrder(id) });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["purchase-orders"] });
    qc.invalidateQueries({ queryKey: ["purchase-order", id] });
    qc.invalidateQueries({ queryKey: ["stock-levels"] });
    qc.invalidateQueries({ queryKey: ["low-stock"] });
  };

  const receive = useMutation({
    mutationFn: () => receivePurchaseOrder(id),
    onSuccess: () => {
      invalidate();
      router.back();
    },
  });

  const cancel = useMutation({
    mutationFn: () => cancelPurchaseOrder(id),
    onSuccess: () => {
      invalidate();
      router.back();
    },
  });

  if (po.isLoading || !po.data) {
    return (
      <Screen scroll={false}>
        <Loading />
      </Screen>
    );
  }

  const order = po.data;
  const total = (order.purchase_order_items ?? []).reduce((s, i) => s + i.quantity * Number(i.unit_cost), 0);

  return (
    <Screen>
      <Card className="mb-4">
        <Text className="text-xl font-bold text-foreground">{order.po_number}</Text>
        <Text className="mb-2 text-muted-foreground">{order.suppliers?.name}</Text>
        <Badge
          label={order.status}
          tone={order.status === "received" ? "success" : order.status === "cancelled" ? "destructive" : "default"}
        />
      </Card>

      <Card className="mb-4">
        <CardTitle>Items — total ₵{total.toFixed(2)}</CardTitle>
        {(order.purchase_order_items ?? []).map((i) => (
          <View key={i.id} className="flex-row justify-between py-1.5">
            <Text className="flex-1 text-foreground" numberOfLines={1}>
              {i.products?.name ?? i.product_id} × {i.quantity}
            </Text>
            <Text className="font-medium text-foreground">₵{(i.quantity * Number(i.unit_cost)).toFixed(2)}</Text>
          </View>
        ))}
      </Card>

      {order.status === "ordered" && can.managePurchaseOrders(profile?.role) && (
        <View className="gap-3">
          <ErrorText message={receive.error?.message || cancel.error?.message} />
          <Button title="Mark as received (adds stock)" onPress={() => receive.mutate()} loading={receive.isPending} />
          <Button title="Cancel order" variant="destructive" onPress={() => cancel.mutate()} loading={cancel.isPending} />
        </View>
      )}
    </Screen>
  );
}
