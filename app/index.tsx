import { useEffect } from "react";
import { Text, View } from "react-native";
import { initDB } from "./lib/db";

export default function Index() {
  useEffect(() => {
    initDB().then(() => console.log('Database initialized')).catch((e) => console.warn('init db', e))
  }, [])
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
    </View>
  );
}
