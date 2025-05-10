import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + (a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1)
      );
    }
  }
  return matrix[a.length][b.length];
}

function getScoreColor(score: number) {
  if (score >= 8) return "#4CAF50"; // green
  if (score >= 5) return "#FFC107"; // yellow
  return "#F44336"; // red
}

// Simple rule-based tips for common mistakes
function getPronunciationTip(word: string, transcript: string): string | null {
  if (!word || !transcript) return null;
  const w = word.toLowerCase();
  const t = transcript.toLowerCase();

  // Common short vowel confusion
  if (["kit", "kid", "kick"].includes(w) && t.includes("keet")) {
    return "Try to make the 'i' sound short, like in 'sit'.";
  }
  if (["cut", "cup"].includes(w) && t.includes("cat")) {
    return "The 'u' in 'cut' is like 'uh', not 'a' as in 'cat'.";
  }
  if (["cap", "cat"].includes(w) && t.includes("cup")) {
    return "The 'a' in 'cap' is a short, open sound, not 'uh'.";
  }
  // Ending sounds
  if (w.endsWith("d") && !t.endsWith("d")) {
    return "Make sure to pronounce the ending 'd' sound.";
  }
  if (w.endsWith("t") && !t.endsWith("t")) {
    return "Try to finish with a clear 't' sound at the end.";
  }
  // Consonant confusion
  if (w.startsWith("dr") && t.startsWith("gr")) {
    return "Start with a 'd' sound, not 'g'.";
  }
  // General tip for low scores
  if (t && t[0] !== w[0]) {
    return "Try to start the word with the correct sound.";
  }
  if (w.length > 4 && t.length > 0 && Math.abs(w.length - t.length) > 2) {
    return "Try to match the number of syllables in the word.";
  }
  // Fallback
  return "Listen carefully to the word and try to match each sound.";
}

export default function Pronounce() {
  const { word } = useLocalSearchParams<{ word: string }>();
  const [recognizing, setRecognizing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tip, setTip] = useState<string | null>(null);
  const router = useRouter();

  useSpeechRecognitionEvent("start", () => setRecognizing(true));
  useSpeechRecognitionEvent("end", () => setRecognizing(false));
  useSpeechRecognitionEvent("result", (event) => {
    const spoken = event.results[0]?.transcript || "";
    setTranscript(spoken);
    if (word) {
      const dist = levenshtein(word, spoken);
      // Score: 10 if perfect, 0 if totally different
      const maxLen = Math.max(word.length, spoken.length, 1);
      const rawScore = Math.max(0, 1 - dist / maxLen);
      const newScore = Math.round(rawScore * 10);
      setScore(newScore);
      if (newScore < 8) {
        setTip(getPronunciationTip(word, spoken));
      } else {
        setTip(null);
      }
    }
    setLoading(false);
  });
  useSpeechRecognitionEvent("error", (event) => {
    setError(event.message || "Speech recognition error");
    setLoading(false);
    setRecognizing(false);
  });

  const handleStart = useCallback(async () => {
    setError("");
    setTranscript("");
    setScore(null);
    setLoading(true);
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) {
      setError("Microphone or speech recognition permission not granted.");
      setLoading(false);
      return;
    }
    ExpoSpeechRecognitionModule.start({
      lang: "en-US",
      interimResults: false,
      continuous: false,
    });
  }, [word]);

  const handleStop = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
    setLoading(false);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pronounce the word:</Text>
      <Text style={styles.word}>{word}</Text>
      <View style={styles.spacer} />
      {!recognizing && !loading && (
        <TouchableOpacity
          style={styles.micButton}
          onPress={handleStart}
          accessibilityLabel="Start pronunciation"
          activeOpacity={0.8}
        >
          <MaterialIcons name="mic" size={40} color="#fff" />
        </TouchableOpacity>
      )}
      {recognizing && !loading && (
        <TouchableOpacity
          style={styles.stopButton}
          onPress={handleStop}
          accessibilityLabel="Stop recording"
          activeOpacity={0.8}
        >
          <MaterialIcons name="stop" size={40} color="#fff" />
        </TouchableOpacity>
      )}
      {loading && <ActivityIndicator size="large" color="#2196F3" style={{ margin: 16 }} />}
      <View style={styles.spacer} />
      {transcript ? (
        <View style={styles.feedbackBox}>
          <Text style={styles.label}>You said:</Text>
          <Text style={styles.transcript}>{transcript}</Text>
          {score !== null && (
            <View style={[styles.scoreCircle, { backgroundColor: getScoreColor(score) }]}> 
              <Text style={styles.scoreText}>{score}/10</Text>
            </View>
          )}
          {score !== null && score < 8 && tip && (
            <View style={styles.tipBox}>
              <Text style={styles.tipTitle}>Tip to improve:</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          )}
        </View>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.spacer} />
      <TouchableOpacity
        style={styles.tryAnotherButton}
        onPress={() => router.replace("/")}
        accessibilityLabel="Try another word"
        activeOpacity={0.8}
      >
        <MaterialIcons name="refresh" size={32} color="#2196F3" />
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
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },
  word: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2196F3",
    marginBottom: 16,
  },
  spacer: {
    height: 16,
  },
  feedbackBox: {
    alignItems: "center",
    marginTop: 16,
  },
  label: {
    fontSize: 16,
    color: "#555",
  },
  transcript: {
    fontSize: 22,
    fontWeight: "600",
    marginVertical: 8,
    color: "#333",
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  error: {
    color: "#F44336",
    marginTop: 12,
    fontSize: 16,
  },
  tipBox: {
    marginTop: 16,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    padding: 12,
    maxWidth: 260,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD54F',
  },
  tipTitle: {
    fontWeight: 'bold',
    color: '#FFA000',
    marginBottom: 4,
    fontSize: 16,
  },
  tipText: {
    color: '#333',
    fontSize: 15,
    textAlign: 'center',
  },
  micButton: {
    marginTop: 8,
    backgroundColor: "#2196F3",
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
  stopButton: {
    marginTop: 8,
    backgroundColor: "#F44336",
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
  tryAnotherButton: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 32,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#2196F3",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
}); 