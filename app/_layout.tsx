import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "HowToPronounce", headerLeft: () => null }} />
      <Stack.Screen name="pronounce" options={{ title: "Pronounce", headerLeft: () => null }} />
    </Stack>
  );
}
