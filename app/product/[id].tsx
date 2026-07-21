import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Text, View } from "react-native";
import { Badge, Button, Card, CardTitle, ErrorText, Input, Loading, Screen } from "@/components/ui";
import { adjustStock, archiveProduct, getMovements, getProduct, getStockLevels } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { can } from "@/lib/permissions";

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");

  const product = useQuery({ queryKey: ["product", id], queryFn: () => getProduct(id) });
  const stock = useQuery({ queryKey: ["stock-levels"], queryFn: getStockLevels });
  const movements = useQuery({ queryKey: ["movements", id], queryFn: () => getMovements(id) });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["stock-levels"] });
    qc.invalidateQueries({ queryKey: ["movements", id] });
    qc.invalidateQueries({ queryKey: ["low-stock"] });
  };

  const adjust = useMutation({
    mutationFn: () => adjustStock(id, Number(delta), note || undefined),
    onSuccess: () => {
      setDelta("");
      setNote("");
      invalidate();
    },
  });

  const archive = useMutation({
    mutationFn: () => archiveProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      router.back();
    },
  });

  if (product.isLoading || !product.data) {
    return (
      <Screen scroll={false}>
        <Loading />
      </Screen>
    );
  }

  const p = product.data;
  const qty = stock.data?.[p.id] ?? 0;

  return (
    <Screen>
      <Card className="mb-4">
        <Text className="text-xl font-bold text-foreground">{p.name}</Text>
        <Text className="mb-2 text-muted-foreground">{p.sku}</Text>
        <View className="flex-row flex-wrap gap-2">
          <Badge label={`${qty} ${p.unit} in stock`} tone={qty <= p.reorder_point ? "warning" : "success"} />
          <Badge label={`Cost ₵${Number(p.cost_price).toFixed(2)}`} tone="muted" />
          <Badge label={`Sell ₵${Number(p.sell_price).toFixed(2)}`} tone="muted" />
          <Badge label={`Reorder at ${p.reorder_point}`} tone="muted" />
        </View>
      </Card>

      {can.adjustStock(profile?.role) && (
        <Card className="mb-4">
          <CardTitle>Adjust stock</CardTitle>
          <Input
            label="Quantity (+ receive / − remove)"
            value={delta}
            onChangeText={setDelta}
            keyboardType="numbers-and-punctuation"
            placeholder="e.g. 10 or -3"
          />
          <Input label="Note" value={note} onChangeText={setNote} placeholder="Reason (optional)" />
          <ErrorText message={adjust.error?.message} />
          <Button
            title="Apply adjustment"
            onPress={() => adjust.mutate()}
            loading={adjust.isPending}
            disabled={!delta || Number.isNaN(Number(delta)) || Number(delta) === 0}
          />
        </Card>
      )}

      <Card className="mb-4">
        <CardTitle>Recent movements</CardTitle>
        {(movements.data ?? []).length === 0 ? (
          <Text className="text-muted-foreground">No movements yet.</Text>
        ) : (
          (movements.data ?? []).map((m) => (
            <View key={m.id} className="flex-row justify-between py-1.5">
              <Text className="text-sm text-muted-foreground">
                {new Date(m.created_at).toLocaleDateString()} · {m.reason}
              </Text>
              <Text className={`text-sm font-semibold ${m.delta > 0 ? "text-success" : "text-destructive"}`}>
                {m.delta > 0 ? "+" : ""}
                {m.delta}
              </Text>
            </View>
          ))
        )}
      </Card>

      {can.editProducts(profile?.role) && (
        <Button
          title="Archive product"
          variant="destructive"
          onPress={() =>
            Alert.alert("Archive this product?", `${p.name} will be hidden from active listings. This can't be undone from the app.`, [
              { text: "Cancel", style: "cancel" },
              { text: "Archive", style: "destructive", onPress: () => archive.mutate() },
            ])
          }
          loading={archive.isPending}
        />
      )}
    </Screen>
  );
}
