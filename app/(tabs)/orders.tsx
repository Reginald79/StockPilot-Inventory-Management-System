import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import { Badge, Button, EmptyState, Loading, Row, Screen } from "@/components/ui";
import { listPurchaseOrders } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import type { PoStatus } from "@/lib/types";

const statusTone: Record<PoStatus, "muted" | "default" | "success" | "destructive"> = {
  draft: "muted",
  ordered: "default",
  received: "success",
  cancelled: "destructive",
};

export default function Orders() {
  const router = useRouter();
  const { profile } = useAuth();
  const pos = useQuery({ queryKey: ["purchase-orders"], queryFn: listPurchaseOrders });

  return (
    <Screen>
      {can.managePurchaseOrders(profile?.role) && (
        <View className="mb-3">
          <Button title="+ New purchase order" onPress={() => router.push("/order/new")} />
        </View>
      )}
      {pos.isLoading ? (
        <Loading />
      ) : (pos.data ?? []).length === 0 ? (
        <EmptyState message="No purchase orders yet." />
      ) : (
        (pos.data ?? []).map((po) => (
          <Row
            key={po.id}
            title={po.po_number}
            subtitle={`${po.suppliers?.name ?? "Unknown supplier"} · ${po.purchase_order_items?.length ?? 0} items`}
            right={<Badge label={po.status} tone={statusTone[po.status]} />}
            onPress={() => router.push({ pathname: "/order/[id]", params: { id: po.id } })}
          />
        ))
      )}
    </Screen>
  );
}
