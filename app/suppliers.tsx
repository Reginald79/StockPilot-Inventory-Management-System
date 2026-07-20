import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { View } from "react-native";
import { Button, Card, CardTitle, EmptyState, ErrorText, Input, Loading, Row, Screen } from "@/components/ui";
import { listSuppliers, upsertSupplier } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { can } from "@/lib/permissions";

export default function Suppliers() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", contact_name: "", email: "", phone: "" });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const suppliers = useQuery({ queryKey: ["suppliers"], queryFn: listSuppliers });

  const create = useMutation({
    mutationFn: () =>
      upsertSupplier({
        name: form.name.trim(),
        contact_name: form.contact_name.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      setForm({ name: "", contact_name: "", email: "", phone: "" });
      setShowForm(false);
    },
  });

  return (
    <Screen>
      {can.editSuppliers(profile?.role) && (
        <View className="mb-3">
          <Button
            title={showForm ? "Close" : "+ New supplier"}
            variant={showForm ? "outline" : "default"}
            onPress={() => setShowForm(!showForm)}
          />
        </View>
      )}

      {showForm && (
        <Card className="mb-4">
          <CardTitle>New supplier</CardTitle>
          <Input label="Name *" value={form.name} onChangeText={set("name")} />
          <Input label="Contact person" value={form.contact_name} onChangeText={set("contact_name")} />
          <Input label="Email" value={form.email} onChangeText={set("email")} keyboardType="email-address" autoCapitalize="none" />
          <Input label="Phone" value={form.phone} onChangeText={set("phone")} keyboardType="phone-pad" />
          <ErrorText message={create.error?.message} />
          <Button title="Save supplier" onPress={() => create.mutate()} loading={create.isPending} disabled={!form.name.trim()} />
        </Card>
      )}

      {suppliers.isLoading ? (
        <Loading />
      ) : (suppliers.data ?? []).length === 0 ? (
        <EmptyState message="No suppliers yet." />
      ) : (
        (suppliers.data ?? []).map((s) => (
          <Row key={s.id} title={s.name} subtitle={[s.contact_name, s.phone, s.email].filter(Boolean).join(" · ")} />
        ))
      )}
    </Screen>
  );
}
