import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { Button, Card, CardTitle, ErrorText, Input, Loading, Row, Screen } from "@/components/ui";
import { adjustStock, getStockLevels, listProducts } from "@/lib/api";

interface CountLine {
  product_id: string;
  name: string;
  system_qty: number;
  counted: string;
}

export default function CycleCount() {
  const router = useRouter();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [lines, setLines] = useState<CountLine[]>([]);

  const products = useQuery({ queryKey: ["products", search], queryFn: () => listProducts(search) });
  const stock = useQuery({ queryKey: ["stock-levels"], queryFn: getStockLevels });

  const addLine = (product_id: string, name: string) =>
    setLines((ls) => {
      if (ls.some((l) => l.product_id === product_id)) return ls;
      const system_qty = stock.data?.[product_id] ?? 0;
      return [...ls, { product_id, name, system_qty, counted: String(system_qty) }];
    });

  const setCounted = (product_id: string, counted: string) =>
    setLines((ls) => ls.map((l) => (l.product_id === product_id ? { ...l, counted } : l)));

  const removeLine = (product_id: string) => setLines((ls) => ls.filter((l) => l.product_id !== product_id));

  const changed = useMemo(
    () => lines.filter((l) => Number(l.counted) !== l.system_qty && l.counted.trim() !== ""),
    [lines]
  );

  const submit = useMutation({
    mutationFn: async () => {
      await Promise.all(
        changed.map((l) =>
          adjustStock(
            l.product_id,
            Number(l.counted) - l.system_qty,
            `Cycle count: ${l.system_qty} → ${l.counted}`
          )
        )
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-levels"] });
      qc.invalidateQueries({ queryKey: ["low-stock"] });
      qc.invalidateQueries({ queryKey: ["movements"] });
      router.back();
    },
  });

  if (stock.isLoading) {
    return (
      <Screen scroll={false}>
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text className="mb-4 text-sm text-muted-foreground">
        Physical inventory count. Enter what you actually counted for each item — the system will post the
        difference as an adjustment automatically.
      </Text>

      {lines.length > 0 && (
        <Card className="mb-4">
          <CardTitle>Count sheet</CardTitle>
          {lines.map((l) => {
            const delta = Number(l.counted) - l.system_qty;
            return (
              <View key={l.product_id} className="border-b border-border py-2">
                <View className="flex-row items-center justify-between">
                  <Text className="flex-1 text-foreground" numberOfLines={1}>
                    {l.name}
                  </Text>
                  <Button title="✕" variant="ghost" onPress={() => removeLine(l.product_id)} />
                </View>
                <View className="mt-1 flex-row items-center gap-3">
                  <Text className="text-sm text-muted-foreground">System: {l.system_qty}</Text>
                  <View className="w-20">
                    <Input value={l.counted} onChangeText={(v) => setCounted(l.product_id, v)} keyboardType="number-pad" />
                  </View>
                  {l.counted.trim() !== "" && !Number.isNaN(delta) && delta !== 0 && (
                    <Text className={`text-sm font-semibold ${delta > 0 ? "text-success" : "text-destructive"}`}>
                      {delta > 0 ? "+" : ""}
                      {delta}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
          <ErrorText message={submit.error?.message} />
          <View className="mt-3">
            <Button
              title={changed.length === 0 ? "No changes to post" : `Post ${changed.length} adjustment${changed.length === 1 ? "" : "s"}`}
              onPress={() => submit.mutate()}
              loading={submit.isPending}
              disabled={changed.length === 0}
            />
          </View>
        </Card>
      )}

      <CardTitle>Add products to count</CardTitle>
      <Input placeholder="Search by name or SKU…" value={search} onChangeText={setSearch} />
      {products.isLoading ? (
        <Loading />
      ) : (
        (products.data ?? []).map((p) => (
          <Row
            key={p.id}
            title={p.name}
            subtitle={p.sku}
            right={<Text className="font-semibold text-primary">+ Count</Text>}
            onPress={() => addLine(p.id, p.name)}
          />
        ))
      )}
    </Screen>
  );
}
