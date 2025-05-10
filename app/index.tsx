import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Index() {
  const [word, setWord] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleNext = () => {
    if (!word.trim()) {
      setError("Please enter a word.");
      return;
    }
    setError("");
    router.replace({ pathname: "/pronounce", params: { word } });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HowToPronounce</Text>
      <Text style={styles.label}>Enter a word to practice:</Text>
      <TextInput
        style={styles.input}
        value={word}
        onChangeText={setWord}
        placeholder="e.g. cut, kit, amend"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity
        style={styles.nextButton}
        onPress={handleNext}
        accessibilityLabel="Go to pronunciation screen"
        activeOpacity={0.8}
      >
        <MaterialIcons name="arrow-forward" size={40} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
  },
  label: {
    fontSize: 18,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    width: "100%",
    marginBottom: 12,
    fontSize: 18,
  },
  error: {
    color: "red",
    marginBottom: 8,
  },
  nextButton: {
    marginTop: 16,
    backgroundColor: "#4CAF50",
    borderRadius: 40,
    width: 64,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});
