import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { Button, Card, CardTitle, EmptyState, ErrorText, Input, Loading, Row, Screen } from "@/components/ui";
import { getStockByLocation, listLocations, listProducts, transferStock } from "@/lib/api";

export default function TransferStock() {
  const router = useRouter();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [fromId, setFromId] = useState<string | null>(null);
  const [toId, setToId] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [productName, setProductName] = useState<string>("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  const locations = useQuery({ queryKey: ["locations"], queryFn: listLocations });
  const products = useQuery({ queryKey: ["products", search], queryFn: () => listProducts(search) });
  const byLocation = useQuery({ queryKey: ["stock-by-location"], queryFn: getStockByLocation });

  const availableAtFrom = useMemo(() => {
    if (!fromId || !productId) return null;
    const row = (byLocation.data ?? []).find((r) => r.location_id === fromId && r.product_id === productId);
    return row?.quantity ?? 0;
  }, [byLocation.data, fromId, productId]);

  const submit = useMutation({
    mutationFn: () => transferStock(productId!, fromId!, toId!, Number(quantity), note.trim() || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-levels"] });
      qc.invalidateQueries({ queryKey: ["stock-by-location"] });
      qc.invalidateQueries({ queryKey: ["low-stock"] });
      qc.invalidateQueries({ queryKey: ["movements"] });
      router.back();
    },
  });

  if (locations.isLoading) {
    return (
      <Screen scroll={false}>
        <Loading />
      </Screen>
    );
  }

  if ((locations.data ?? []).length < 2) {
    return (
      <Screen>
        <EmptyState message="You need at least two locations to transfer stock between." />
        <Button title="Manage locations" onPress={() => router.push("/locations")} />
      </Screen>
    );
  }

  const qty = Number(quantity);
  const canSubmit =
    !!fromId && !!toId && fromId !== toId && !!productId && qty > 0 && (availableAtFrom === null || qty <= availableAtFrom);

  return (
    <Screen>
      <Card className="mb-4">
        <CardTitle>1. From location</CardTitle>
        <View className="flex-row flex-wrap gap-2">
          {(locations.data ?? []).map((l) => (
            <Button key={l.id} title={l.name} variant={fromId === l.id ? "default" : "outline"} onPress={() => setFromId(l.id)} />
          ))}
        </View>
      </Card>

      <Card className="mb-4">
        <CardTitle>2. To location</CardTitle>
        <View className="flex-row flex-wrap gap-2">
          {(locations.data ?? [])
            .filter((l) => l.id !== fromId)
            .map((l) => (
              <Button key={l.id} title={l.name} variant={toId === l.id ? "default" : "outline"} onPress={() => setToId(l.id)} />
            ))}
        </View>
      </Card>

      <Card className="mb-4">
        <CardTitle>3. Product</CardTitle>
        {productId ? (
          <View className="flex-row items-center justify-between">
            <Text className="text-foreground">{productName}</Text>
            <Button title="Change" variant="ghost" onPress={() => setProductId(null)} />
          </View>
        ) : (
          <>
            <Input placeholder="Search by name or SKU…" value={search} onChangeText={setSearch} />
            {products.isLoading ? (
              <Loading />
            ) : (
              (products.data ?? []).map((p) => (
                <Row
                  key={p.id}
                  title={p.name}
                  subtitle={p.sku}
                  onPress={() => {
                    setProductId(p.id);
                    setProductName(p.name);
                  }}
                />
              ))
            )}
          </>
        )}
      </Card>

      {productId && fromId && toId && (
        <Card className="mb-4">
          <CardTitle>4. Quantity</CardTitle>
          {availableAtFrom !== null && (
            <Text className="mb-2 text-sm text-muted-foreground">{availableAtFrom} available at source location</Text>
          )}
          <Input value={quantity} onChangeText={setQuantity} keyboardType="number-pad" placeholder="0" />
          <Input label="Note (optional)" value={note} onChangeText={setNote} placeholder="e.g. restocking storefront" />
          {availableAtFrom !== null && qty > availableAtFrom && (
            <Text className="mb-2 text-sm text-destructive">Not enough stock at source location.</Text>
          )}
          <ErrorText message={submit.error?.message} />
          <Button title="Transfer stock" onPress={() => submit.mutate()} loading={submit.isPending} disabled={!canSubmit} />
        </Card>
      )}
    </Screen>
  );
}
