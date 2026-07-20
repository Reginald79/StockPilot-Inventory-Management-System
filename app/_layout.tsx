import "../global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Loading } from "@/components/ui";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function RootNavigator() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!session && !inAuthGroup) router.replace("/(auth)/sign-in");
    if (session && inAuthGroup) router.replace("/(tabs)");
  }, [session, loading, segments]);

  if (loading) return <Loading />;

  return (
    <Stack screenOptions={{ headerTitleStyle: { fontWeight: "600" } }}>
      <Stack.Screen name="(auth)/sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="product/new" options={{ title: "New product" }} />
      <Stack.Screen name="product/[id]" options={{ title: "Product" }} />
      <Stack.Screen name="order/new" options={{ title: "New purchase order" }} />
      <Stack.Screen name="order/[id]" options={{ title: "Purchase order" }} />
      <Stack.Screen name="sale/new" options={{ title: "New sale" }} />
      <Stack.Screen name="stock/add" options={{ title: "Add stock" }} />
      <Stack.Screen name="stock/transfer" options={{ title: "Transfer stock" }} />
      <Stack.Screen name="stock/count" options={{ title: "Cycle count" }} />
      <Stack.Screen name="suppliers" options={{ title: "Suppliers" }} />
      <Stack.Screen name="locations" options={{ title: "Locations" }} />
      <Stack.Screen name="reports" options={{ title: "Reports" }} />
      <Stack.Screen name="users" options={{ title: "Users & roles" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </QueryClientProvider>
  );
}
