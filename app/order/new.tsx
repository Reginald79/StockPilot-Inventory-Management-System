import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Badge, Button, Card, CardTitle, ErrorText, Input, Loading, Row, Screen } from "@/components/ui";
import { createPurchaseOrder, getProduct, listProducts, listSuppliers } from "@/lib/api";

interface OrderLine {
  product_id: string;
  name: string;
  quantity: number;
  unit_cost: number;
}

export default function NewOrder() {
  const router = useRouter();
  const qc = useQueryClient();
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [search, setSearch] = useState("");
  const [prefilled, setPrefilled] = useState(false);

  const suppliers = useQuery({ queryKey: ["suppliers"], queryFn: listSuppliers });
  const products = useQuery({ queryKey: ["products", search], queryFn: () => listProducts(search) });
  // Reorder shortcut from the low-stock alert list — prefill supplier + line.
  const reorderProduct = useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProduct(productId!),
    enabled: !!productId,
  });

  const addLine = (productId: string, name: string, cost: number) =>
    setLines((ls) => {
      const existing = ls.find((l) => l.product_id === productId);
      if (existing) return ls.map((l) => (l.product_id === productId ? { ...l, quantity: l.quantity + 1 } : l));
      return [...ls, { product_id: productId, name, quantity: 1, unit_cost: cost }];
    });

  useEffect(() => {
    if (!reorderProduct.data || prefilled) return;
    const p = reorderProduct.data;
    addLine(p.id, p.name, Number(p.cost_price));
    if (p.supplier_id) setSupplierId(p.supplier_id);
    setPrefilled(true);
  }, [reorderProduct.data, prefilled]);

  const submit = useMutation({
    mutationFn: () =>
      createPurchaseOrder(
        supplierId!,
        lines.map(({ product_id, quantity, unit_cost }) => ({ product_id, quantity, unit_cost }))
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      router.back();
    },
  });

  if (suppliers.isLoading) {
    return (
      <Screen scroll={false}>
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen>
      <Card className="mb-4">
        <CardTitle>1. Choose supplier</CardTitle>
        <View className="flex-row flex-wrap gap-2">
          {(suppliers.data ?? []).map((s) => (
            <Button
              key={s.id}
              title={s.name}
              variant={supplierId === s.id ? "default" : "outline"}
              onPress={() => setSupplierId(s.id)}
            />
          ))}
        </View>
      </Card>

      {lines.length > 0 && (
        <Card className="mb-4">
          <CardTitle>2. Order lines</CardTitle>
          {lines.map((l) => (
            <View key={l.product_id} className="flex-row items-center justify-between py-1.5">
              <Text className="flex-1 text-foreground" numberOfLines={1}>
                {l.name} × {l.quantity}
              </Text>
              <Badge label={`₵${(l.quantity * l.unit_cost).toFixed(2)}`} tone="muted" />
            </View>
          ))}
          <ErrorText message={submit.error?.message} />
          <Button
            title="Place order"
            onPress={() => submit.mutate()}
            loading={submit.isPending}
            disabled={!supplierId || lines.length === 0}
          />
        </Card>
      )}

      <CardTitle>Add products</CardTitle>
      <Input placeholder="Search products…" value={search} onChangeText={setSearch} />
      {(products.data ?? []).map((p) => (
        <Row
          key={p.id}
          title={p.name}
          subtitle={`${p.sku} · cost ₵${Number(p.cost_price).toFixed(2)}`}
          right={<Text className="font-semibold text-primary">+ Add</Text>}
          onPress={() => addLine(p.id, p.name, Number(p.cost_price))}
        />
      ))}
    </Screen>
  );
}
