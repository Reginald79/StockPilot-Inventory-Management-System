import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { Button, Card, CardTitle, ErrorText, Input, Loading, Row, Screen } from "@/components/ui";
import { getStockLevels, listProducts, recordSale } from "@/lib/api";

interface CartLine {
  product_id: string;
  name: string;
  unit_price: number;
  quantity: number;
}

export default function NewSale() {
  const router = useRouter();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [customer, setCustomer] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);

  const products = useQuery({ queryKey: ["products", search], queryFn: () => listProducts(search) });
  const stock = useQuery({ queryKey: ["stock-levels"], queryFn: getStockLevels });

  const total = useMemo(() => cart.reduce((s, l) => s + l.quantity * l.unit_price, 0), [cart]);

  const addToCart = (productId: string, name: string, price: number) =>
    setCart((c) => {
      const existing = c.find((l) => l.product_id === productId);
      if (existing) {
        return c.map((l) => (l.product_id === productId ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...c, { product_id: productId, name, unit_price: price, quantity: 1 }];
    });

  const removeFromCart = (productId: string) =>
    setCart((c) =>
      c
        .map((l) => (l.product_id === productId ? { ...l, quantity: l.quantity - 1 } : l))
        .filter((l) => l.quantity > 0)
    );

  const submit = useMutation({
    mutationFn: () =>
      recordSale(
        cart.map(({ product_id, quantity, unit_price }) => ({ product_id, quantity, unit_price })),
        customer.trim() || undefined
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["stock-levels"] });
      qc.invalidateQueries({ queryKey: ["low-stock"] });
      qc.invalidateQueries({ queryKey: ["sales-daily"] });
      router.back();
    },
  });

  return (
    <Screen>
      {cart.length > 0 && (
        <Card className="mb-4">
          <CardTitle>Cart — ₵{total.toFixed(2)}</CardTitle>
          {cart.map((l) => (
            <View key={l.product_id} className="flex-row items-center justify-between py-1.5">
              <Text className="flex-1 text-foreground" numberOfLines={1}>
                {l.name} × {l.quantity}
              </Text>
              <View className="flex-row items-center gap-2">
                <Text className="font-medium text-foreground">₵{(l.quantity * l.unit_price).toFixed(2)}</Text>
                <Button title="−" variant="outline" onPress={() => removeFromCart(l.product_id)} />
              </View>
            </View>
          ))}
          <Input label="Customer (optional)" value={customer} onChangeText={setCustomer} />
          <ErrorText message={submit.error?.message} />
          <Button title={`Complete sale · ₵${total.toFixed(2)}`} onPress={() => submit.mutate()} loading={submit.isPending} />
        </Card>
      )}

      <Input placeholder="Search products…" value={search} onChangeText={setSearch} />
      {products.isLoading ? (
        <Loading />
      ) : (
        (products.data ?? []).map((p) => {
          const qty = stock.data?.[p.id] ?? 0;
          return (
            <Row
              key={p.id}
              title={p.name}
              subtitle={`₵${Number(p.sell_price).toFixed(2)} · ${qty} in stock`}
              right={<Text className="font-semibold text-primary">+ Add</Text>}
              onPress={() => addToCart(p.id, p.name, Number(p.sell_price))}
            />
          );
        })
      )}
    </Screen>
  );
}
