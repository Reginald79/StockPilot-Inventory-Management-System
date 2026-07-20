import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";
import { Badge, Button, EmptyState, Input, Loading, Row, Screen } from "@/components/ui";
import { getStockLevels, listProducts } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { can } from "@/lib/permissions";

export default function Products() {
  const router = useRouter();
  const { profile } = useAuth();
  const [search, setSearch] = useState("");

  const products = useQuery({ queryKey: ["products", search], queryFn: () => listProducts(search) });
  const stock = useQuery({ queryKey: ["stock-levels"], queryFn: getStockLevels });

  return (
    <Screen>
      <Input placeholder="Search by name or SKU…" value={search} onChangeText={setSearch} />
      {can.editProducts(profile?.role) && (
        <View className="mb-3">
          <Button title="+ New product" onPress={() => router.push("/product/new")} />
        </View>
      )}
      {products.isLoading ? (
        <Loading />
      ) : (products.data ?? []).length === 0 ? (
        <EmptyState message="No products found." />
      ) : (
        (products.data ?? []).map((p) => {
          const qty = stock.data?.[p.id] ?? 0;
          return (
            <Row
              key={p.id}
              title={p.name}
              subtitle={`${p.sku} · ₵${Number(p.sell_price).toFixed(2)}`}
              right={<Badge label={`${qty} ${p.unit}`} tone={qty <= p.reorder_point ? "warning" : "muted"} />}
              onPress={() => router.push({ pathname: "/product/[id]", params: { id: p.id } })}
            />
          );
        })
      )}
    </Screen>
  );
}
