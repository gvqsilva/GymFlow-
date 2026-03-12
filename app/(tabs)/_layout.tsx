// app/(tabs)/_layout.tsx

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

const themeColor = "#5a4fcf";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: themeColor,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={28}
              name={focused ? "home" : "home-outline"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="esportes"
        options={{
          title: "Esportes",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={28}
              name={focused ? "barbell" : "barbell-outline"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="suplementos"
        options={{
          title: "Suplementos",
          headerShown: true,
          headerStyle: { backgroundColor: themeColor },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "700" },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={28}
              name={focused ? "flask" : "flask-outline"}
              color={color}
            />
          ),
        }}
      />
      {/* ABA DE ALIMENTAÇÃO */}
      <Tabs.Screen
        name="historico" // Corresponde ao ficheiro historico.tsx
        options={{
          title: "Alimentação",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={28}
              name={focused ? "restaurant" : "restaurant-outline"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={28}
              name={focused ? "person-circle" : "person-circle-outline"}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
