import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { Button, Card, CardTitle, ErrorText, Input, Loading, Row, Screen } from "@/components/ui";
import { adjustStock, listProducts } from "@/lib/api";

interface ReceiveLine {
  product_id: string;
  name: string;
  sku: string;
  quantity: number;
}

export default function AddStock() {
  const router = useRouter();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [reference, setReference] = useState("");
  const [lines, setLines] = useState<ReceiveLine[]>([]);

  const products = useQuery({ queryKey: ["products", search], queryFn: () => listProducts(search) });

  const totalUnits = useMemo(() => lines.reduce((s, l) => s + l.quantity, 0), [lines]);

  const addLine = (product_id: string, name: string, sku: string) =>
    setLines((ls) => {
      const existing = ls.find((l) => l.product_id === product_id);
      if (existing) return ls.map((l) => (l.product_id === product_id ? { ...l, quantity: l.quantity + 1 } : l));
      return [...ls, { product_id, name, sku, quantity: 1 }];
    });

  const setQuantity = (product_id: string, quantity: number) =>
    setLines((ls) => ls.map((l) => (l.product_id === product_id ? { ...l, quantity: Math.max(0, quantity) } : l)));

  const removeLine = (product_id: string) => setLines((ls) => ls.filter((l) => l.product_id !== product_id));

  const submit = useMutation({
    mutationFn: async () => {
      const note = reference.trim() ? `Stock received — ${reference.trim()}` : "Stock received";
      await Promise.all(
        lines.filter((l) => l.quantity > 0).map((l) => adjustStock(l.product_id, l.quantity, note))
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-levels"] });
      qc.invalidateQueries({ queryKey: ["low-stock"] });
      qc.invalidateQueries({ queryKey: ["movements"] });
      router.back();
    },
  });

  return (
    <Screen>
      {lines.length > 0 && (
        <Card className="mb-4">
          <CardTitle>Receiving — {totalUnits} unit{totalUnits === 1 ? "" : "s"}</CardTitle>
          {lines.map((l) => (
            <View key={l.product_id} className="flex-row items-center justify-between py-1.5">
              <Text className="flex-1 text-foreground" numberOfLines={1}>
                {l.name}
              </Text>
              <View className="flex-row items-center gap-2">
                <Button title="−" variant="outline" onPress={() => setQuantity(l.product_id, l.quantity - 1)} />
                <Text className="min-w-[28px] text-center font-semibold text-foreground">{l.quantity}</Text>
                <Button title="+" variant="outline" onPress={() => setQuantity(l.product_id, l.quantity + 1)} />
                <Button title="✕" variant="ghost" onPress={() => removeLine(l.product_id)} />
              </View>
            </View>
          ))}
          <Input
            label="Reference (optional)"
            placeholder="e.g. PO-260718-ab12, supplier delivery note #"
            value={reference}
            onChangeText={setReference}
          />
          <ErrorText message={submit.error?.message} />
          <Button
            title={`Add ${totalUnits} unit${totalUnits === 1 ? "" : "s"} to stock`}
            onPress={() => submit.mutate()}
            loading={submit.isPending}
            disabled={totalUnits === 0}
          />
        </Card>
      )}

      <CardTitle>Add products</CardTitle>
      <Input placeholder="Search by name or SKU…" value={search} onChangeText={setSearch} />
      {products.isLoading ? (
        <Loading />
      ) : (
        (products.data ?? []).map((p) => (
          <Row
            key={p.id}
            title={p.name}
            subtitle={p.sku}
            right={<Text className="font-semibold text-primary">+ Add</Text>}
            onPress={() => addLine(p.id, p.name, p.sku)}
          />
        ))
      )}
    </Screen>
  );
}
