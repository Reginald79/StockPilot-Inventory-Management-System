import { Tabs } from "expo-router";
import { BarChart3, Boxes, LayoutDashboard, MoreHorizontal, Package, ShoppingCart } from "lucide-react-native";
import React from "react";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#18181b",
        tabBarInactiveTintColor: "#a1a1aa",
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Dashboard", tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="products"
        options={{ title: "Products", tabBarIcon: ({ color, size }) => <Package color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="stock"
        options={{ title: "Stock", tabBarIcon: ({ color, size }) => <Boxes color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="orders"
        options={{ title: "Orders", tabBarIcon: ({ color, size }) => <ShoppingCart color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="sales"
        options={{ title: "Sales", tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: "More", tabBarIcon: ({ color, size }) => <MoreHorizontal color={color} size={size} /> }}
      />
    </Tabs>
  );
}
