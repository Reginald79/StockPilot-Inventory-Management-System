import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Button, ErrorText, Input, Screen } from "@/components/ui";
import { upsertProduct } from "@/lib/api";

export default function NewProduct() {
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    sku: "",
    name: "",
    cost_price: "",
    sell_price: "",
    reorder_point: "0",
    unit: "pcs",
    barcode: "",
  });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () =>
      upsertProduct({
        sku: form.sku.trim(),
        name: form.name.trim(),
        cost_price: Number(form.cost_price) || 0,
        sell_price: Number(form.sell_price) || 0,
        reorder_point: Number(form.reorder_point) || 0,
        unit: form.unit.trim() || "pcs",
        barcode: form.barcode.trim() || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      router.back();
    },
  });

  return (
    <Screen>
      <Input label="SKU *" value={form.sku} onChangeText={set("sku")} autoCapitalize="characters" />
      <Input label="Name *" value={form.name} onChangeText={set("name")} />
      <Input label="Cost price" value={form.cost_price} onChangeText={set("cost_price")} keyboardType="decimal-pad" />
      <Input label="Sell price" value={form.sell_price} onChangeText={set("sell_price")} keyboardType="decimal-pad" />
      <Input
        label="Reorder point (low-stock alert threshold)"
        value={form.reorder_point}
        onChangeText={set("reorder_point")}
        keyboardType="number-pad"
      />
      <Input label="Unit" value={form.unit} onChangeText={set("unit")} />
      <Input label="Barcode" value={form.barcode} onChangeText={set("barcode")} />
      <ErrorText message={mutation.error?.message} />
      <Button
        title="Create product"
        onPress={() => mutation.mutate()}
        loading={mutation.isPending}
        disabled={!form.sku.trim() || !form.name.trim()}
      />
    </Screen>
  );
}
