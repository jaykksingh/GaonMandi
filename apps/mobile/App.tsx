import { catalogues, defaultLocale } from "@gaonmandi/i18n";
import { tokens } from "@gaonmandi/ui-tokens";
import { StatusBar, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.title}>{catalogues[defaultLocale].app.name}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.color.bg.canvas,
    padding: tokens.space["4"],
  },
  title: {
    color: tokens.color.text.primary,
    fontSize: tokens.font.size.title,
    fontWeight: tokens.font.weight.bold,
  },
});

export default App;
