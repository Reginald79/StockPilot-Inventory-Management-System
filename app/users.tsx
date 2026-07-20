import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { Text, View } from "react-native";
import { Badge, Button, Card, EmptyState, Loading, Screen } from "@/components/ui";
import { listProfiles, updateProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { UserRole } from "@/lib/types";

const ROLES: UserRole[] = ["admin", "manager", "staff"];

export default function Users() {
  const qc = useQueryClient();
  const { profile: me } = useAuth();
  const profiles = useQuery({ queryKey: ["profiles"], queryFn: listProfiles });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof updateProfile>[1] }) =>
      updateProfile(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profiles"] }),
  });

  if (me?.role !== "admin") {
    return (
      <Screen scroll={false}>
        <EmptyState message="Admin access required." />
      </Screen>
    );
  }

  if (profiles.isLoading) {
    return (
      <Screen scroll={false}>
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen>
      {(profiles.data ?? []).map((p) => (
        <Card key={p.id} className="mb-3">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="font-semibold text-foreground">{p.full_name || "(no name)"}</Text>
            <Badge label={p.active ? "active" : "disabled"} tone={p.active ? "success" : "destructive"} />
          </View>
          <View className="flex-row flex-wrap gap-2">
            {ROLES.map((r) => (
              <Button
                key={r}
                title={r}
                variant={p.role === r ? "default" : "outline"}
                disabled={p.id === me.id}
                onPress={() => update.mutate({ id: p.id, patch: { role: r } })}
              />
            ))}
            {p.id !== me.id && (
              <Button
                title={p.active ? "Disable" : "Enable"}
                variant="destructive"
                onPress={() => update.mutate({ id: p.id, patch: { active: !p.active } })}
              />
            )}
          </View>
        </Card>
      ))}
    </Screen>
  );
}
