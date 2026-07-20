import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { Button, EmptyState, Loading, Row, Screen } from "@/components/ui";
import { listSales } from "@/lib/api";

export default function Sales() {
  const router = useRouter();
  const sales = useQuery({ queryKey: ["sales"], queryFn: listSales });

  return (
    <Screen>
      <View className="mb-3">
        <Button title="+ Record sale" onPress={() => router.push("/sale/new")} />
      </View>
      {sales.isLoading ? (
        <Loading />
      ) : (sales.data ?? []).length === 0 ? (
        <EmptyState message="No sales recorded yet." />
      ) : (
        (sales.data ?? []).map((s) => (
          <Row
            key={s.id}
            title={s.sale_number}
            subtitle={`${new Date(s.created_at).toLocaleString()}${s.customer_name ? ` · ${s.customer_name}` : ""}`}
            right={<Text className="font-semibold text-foreground">₵{Number(s.total).toFixed(2)}</Text>}
          />
        ))
      )}
    </Screen>
  );
}
