import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { View } from "react-native";
import { Badge, Button, Card, CardTitle, EmptyState, ErrorText, Input, Loading, Row, Screen } from "@/components/ui";
import { listLocations, upsertLocation } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { can } from "@/lib/permissions";

export default function Locations() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");

  const locations = useQuery({ queryKey: ["locations"], queryFn: listLocations });

  const create = useMutation({
    mutationFn: () => upsertLocation({ name: name.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locations"] });
      setName("");
      setShowForm(false);
    },
  });

  return (
    <Screen>
      {can.manageLocations(profile?.role) && (
        <View className="mb-3">
          <Button
            title={showForm ? "Close" : "+ New location"}
            variant={showForm ? "outline" : "default"}
            onPress={() => setShowForm(!showForm)}
          />
        </View>
      )}

      {showForm && (
        <Card className="mb-4">
          <CardTitle>New location</CardTitle>
          <Input label="Name *" value={name} onChangeText={setName} placeholder="e.g. Kumasi Depot" />
          <ErrorText message={create.error?.message} />
          <Button title="Save location" onPress={() => create.mutate()} loading={create.isPending} disabled={!name.trim()} />
        </Card>
      )}

      {locations.isLoading ? (
        <Loading />
      ) : (locations.data ?? []).length === 0 ? (
        <EmptyState message="No locations yet." />
      ) : (
        (locations.data ?? []).map((l) => (
          <Row key={l.id} title={l.name} right={l.is_default ? <Badge label="Default" tone="muted" /> : undefined} />
        ))
      )}
    </Screen>
  );
}
